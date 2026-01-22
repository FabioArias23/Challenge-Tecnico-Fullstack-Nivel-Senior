import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { DataSource } from 'typeorm';
import { Service } from '../entities/service.entity';
import { BillingPending, PendingStatus } from '../entities/billing-pending.entity';
import { BillingBatch } from '../entities/billing-batch.entity';
import { CreateBatchDto } from './dto/create-batch.dto';

// --- MOCKS ---

// 1. Mock de la Transaccion (QueryRunner)
const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    find: jest.fn(),
    findOne: jest.fn(),
    // CLAVE: create debe devolver el objeto que recibe para que no de error 'undefined' !!!
    create: jest.fn().mockImplementation((entity, dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
  },
};

// 2. Mock del DataSource
const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

// 3. Mock de la Cola BullMQ
const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 123, name: 'process-batch' }), // Simula job creado
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getQueueToken('billing-queue'), useValue: mockQueue }, // Inyectamos la cola Mock
        { provide: getRepositoryToken(Service), useValue: {} },
        { provide: getRepositoryToken(BillingPending), useValue: {} },
        { provide: getRepositoryToken(BillingBatch), useValue: {} },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- ESCENARIO 1: El Endpoint Publico (createBatch) ---
  describe('createBatch (Public Endpoint)', () => {
    it('should add a job to the queue and return immediately', async () => {
      const dto: CreateBatchDto = {
        pendingIds: [1, 2],
        receiptBook: '0001',
        issueDate: '2023-01-01',
      };

      const result = await service.createBatch(dto);

      // Verificaciones
      expect(mockQueue.add).toHaveBeenCalledWith('process-batch', dto, expect.any(Object));
      expect(result).toEqual({
        message: 'Batch processing started (Async)',
        jobId: 123,
        status: 'QUEUED',
        info: expect.any(String),
      });
    });
  });

  // --- ESCENARIO 2: La Logica de Negocio (processBatchJob) ---
  describe('processBatchJob (Worker Logic)', () => {
    const dto: CreateBatchDto = {
      pendingIds: [1],
      receiptBook: '0001',
      issueDate: '2023-01-01',
    };

    it('should process the transaction successfully', async () => {
      // Configurar Mocks para el camino feliz
      const mockPending = { id: 1, amount: 100, status: PendingStatus.PENDING };
      
      // 1. Encuentra pendientes
      mockQueryRunner.manager.find.mockResolvedValue([mockPending]);
      // 2. No encuentra facturas previas (inicia en 1)
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      // Ejecutar
      const result = await service.processBatchJob(dto);

      // Verificaciones de Transaccion
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.find).toHaveBeenCalled();
      
      // Verificar que se guardo el Batch, la Factura y se actualizo el Pendiente
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3); 
      
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(result).toHaveProperty('invoicesGenerated', 1);
    });

    it('should rollback transaction on DB error', async () => {
      // Simular error al buscar en DB
      mockQueryRunner.manager.find.mockRejectedValue(new Error('Connection Lost'));

      // Esperar que lance error
      await expect(service.processBatchJob(dto)).rejects.toThrow('Connection Lost');

      // Verificar Rollback
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled(); // <--- CRÍTICO
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
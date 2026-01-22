import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, DataSource, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { Service, ServiceStatus } from '../entities/service.entity';
import { BillingPending, PendingStatus } from '../entities/billing-pending.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { BatchStatus, BillingBatch } from '../entities/billing-batch.entity';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(BillingPending) private readonly pendingRepo: Repository<BillingPending>,
    @InjectRepository(BillingBatch) private readonly batchRepo: Repository<BillingBatch>,
    private readonly dataSource: DataSource,
    @InjectQueue('billing-queue') private billingQueue: Queue, // Cola Inyectada
  ) {}

  /*
    1. Generacion de Pendientes (Sincronico)
   */
  async generatePendings() {
    const candidates = await this.serviceRepo
      .createQueryBuilder('service')
      .leftJoin('service.pendings', 'pending')
      .where('service.status = :status', { status: ServiceStatus.DELIVERED })
      .andWhere('pending.id IS NULL')
      .getMany();

    if (candidates.length === 0) {
      return { message: 'No new services to process', count: 0 };
    }

    const newPendings = candidates.map((service) => {
      return this.pendingRepo.create({
        service: service,
        amount: service.amount,
        status: PendingStatus.PENDING,
      });
    });

    await this.pendingRepo.save(newPendings);

    this.logger.log(`Generated ${newPendings.length} new billing pendings`);

    return {
      message: 'Pendings generated successfully',
      count: newPendings.length,
      sampleIds: newPendings.slice(0, 5).map((p) => p.id),
    };
  }

  async findAllPendings() {
    return this.pendingRepo.find({
      where: { status: PendingStatus.PENDING },
      relations: ['service'],
    });
  }

  /**
     2. TAREA 4 (ASINCRONA): ENTRADA PUBLICA
     Recibe el request, valida y lo manda a la cola.
     Retorna inmediato al usuario.
   */
  async createBatch(dto: CreateBatchDto) {
    // Validaciones básicas antes de encolar
    if (!dto.pendingIds || dto.pendingIds.length === 0) {
      throw new BadRequestException('No pending IDs provided');
    }

    // Enviamos el trabajo a Redis
    const job = await this.billingQueue.add('process-batch', dto, {
      attempts: 3, // Si falla la DB, reintenta 3 veces
      backoff: 5000, // Espera 5 seg entre intentos
      removeOnComplete: true, // Limpia Redis al terminar
    });

    this.logger.log(`Job ${job.id} added to queue for receiptBook ${dto.receiptBook}`);

    return {
      message: 'Batch processing started (Async)',
      jobId: job.id,
      status: 'QUEUED',
      info: 'Check logs or query batch status later'
    };
  }

  /*
     3. LOGICA CORE (TRANSACCIONAL)
     Este método será llamado por el WORKER (BillingProcessor), no por el Controller.
     Contiene toda la lógica pesada que tenías antes.
   */
  async processBatchJob(dto: CreateBatchDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Starting transaction for ReceiptBook: ${dto.receiptBook}`);

      // A. Bloquear Pendientes
      const pendingsToBill = await queryRunner.manager.find(BillingPending, {
        where: {
          id: In(dto.pendingIds),
          status: PendingStatus.PENDING,
        },
        lock: { mode: 'pessimistic_write' },
        // relations: ['service'] -> QUITADO para evitar error de FOR UPDATE en LEFT JOIN
      });

      if (pendingsToBill.length !== dto.pendingIds.length) {
        throw new BadRequestException(
          'Algunos pendientes no existen o ya fueron facturados.',
        );
      }

      // B. Crear Lote
      const batch = queryRunner.manager.create(BillingBatch, {
        issueDate: new Date(dto.issueDate),
        receiptBook: dto.receiptBook,
        status: BatchStatus.PROCESSED,
      });
      const savedBatch = await queryRunner.manager.save(batch);

      // C. Obtener correlatividad
      const lastInvoice = await queryRunner.manager.findOne(Invoice, {
        where: { invoiceNumber: Like(`${dto.receiptBook}-%`) },
        order: { id: 'DESC' },
      });

      let currentSequence = 0;
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        currentSequence = parseInt(parts[1], 10);
      }

      const invoicesToSave: Invoice[] = [];

      // D. Generar Facturas
      for (const pending of pendingsToBill) {
        currentSequence++;
        const invoiceNumber = `${dto.receiptBook}-${currentSequence
          .toString()
          .padStart(8, '0')}`;

        const invoice = queryRunner.manager.create(Invoice, {
          invoiceNumber: invoiceNumber,
          cae: this.generateMockCAE(),
          issueDate: new Date(dto.issueDate),
          amount: pending.amount,
          batch: savedBatch,
          pending: pending,
        });
        invoicesToSave.push(invoice);

        // Actualizar pendiente
        pending.status = PendingStatus.INVOICED;
        await queryRunner.manager.save(pending);
      }

      // Guardar todo
      await queryRunner.manager.save(invoicesToSave);
      
      // E. Commit
      await queryRunner.commitTransaction();

      this.logger.log(`Batch ${savedBatch.id} created successfully with ${invoicesToSave.length} invoices`);

      return {
        batchId: savedBatch.id,
        invoicesGenerated: invoicesToSave.length,
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error processing batch job', err);
      // Relanzamos el error para que BullMQ sepa que fallo y pueda reintentar
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /*
    4. TAREA 5: Exportación ERP
   */
  async getBatchForERP(batchId: number) {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: ['invoices', 'invoices.pending', 'invoices.pending.service'],
    });

    if (!batch) throw new NotFoundException('Batch not found');

    const erpPayload = {
      header: {
        batch_reference: `BATCH-${batch.id}`,
        process_date: batch.createdAt.toISOString(),
        total_records: batch.invoices.length,
      },
      records: batch.invoices.map((inv) => ({
        external_id: inv.id,
        document_type: 'FACTURA_A',
        document_number: inv.invoiceNumber,
        issue_date: inv.issueDate,
        customer_id: inv.pending.service.customerId,
        items: [
          {
            concept: 'Servicio de Logística',
            net_amount: Number(inv.amount),
            vat_rate: 21.0,
            vat_amount: Number(inv.amount) * 0.21,
          },
        ],
        cae_auth: inv.cae,
      })),
    };

    return erpPayload;
  }

  private generateMockCAE(): string {
    return Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
  }
}
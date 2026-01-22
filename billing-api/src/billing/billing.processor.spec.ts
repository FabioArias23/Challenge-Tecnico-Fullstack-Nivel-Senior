
import { Test, TestingModule } from '@nestjs/testing';
import { BillingProcessor } from './billing.processor';
import { BillingService } from './billing.service';
import { Job } from 'bull';

describe('BillingProcessor', () => {
  let processor: BillingProcessor;
  let billingService: BillingService;

  // Mock del Servicio
  const mockBillingService = {
    processBatchJob: jest.fn(),
  };

  // Mock del Job de BullMQ
  const mockJob = {
    id: 1,
    data: { receiptBook: '0001', pendingIds: [1, 2] },
  } as unknown as Job;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingProcessor,
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    processor = module.get<BillingProcessor>(BillingProcessor);
    billingService = module.get<BillingService>(BillingService);
  });

  it('should process the job successfully', async () => {
    // Arrange
    mockBillingService.processBatchJob.mockResolvedValue({ batchId: 100 });

    // Act
    const result = await processor.handleBatchCreation(mockJob);

    // Assert
    expect(billingService.processBatchJob).toHaveBeenCalledWith(mockJob.data);
    expect(result).toEqual({ batchId: 100 });
  });

  it('should throw error if service fails', async () => {
    // Arrange
    mockBillingService.processBatchJob.mockRejectedValue(new Error('Processing Failed'));

    // Act & Assert
    await expect(processor.handleBatchCreation(mockJob)).rejects.toThrow('Processing Failed');
  });
});
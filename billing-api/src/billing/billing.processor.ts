import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BillingService } from './billing.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Processor('billing-queue')
export class BillingProcessor {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(private readonly billingService: BillingService) {}

  @Process('process-batch')
  async handleBatchCreation(job: Job<CreateBatchDto>) {
    this.logger.log(`👷 WORKER: Processing job ${job.id} for batch(o Lote)...`);
    try {
      // Llama a la logica pesada
      const result = await this.billingService.processBatchJob(job.data);
      this.logger.log(`✅ WORKER: Job ${job.id} completed successfully. Batch ID: ${result.batchId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ WORKER: Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
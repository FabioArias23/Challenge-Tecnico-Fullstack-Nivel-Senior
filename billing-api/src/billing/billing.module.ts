import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull'; // <--- 1. Importar BullModule
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingProcessor } from './billing.processor';
import { Service, BillingPending, BillingBatch, Invoice } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, BillingPending, BillingBatch, Invoice]),
    
    // 2. REGISTRAR LA COLA AQUÍ
    // Esto es lo que faltaba. Sin esto, el Service no puede inyectar @InjectQueue('billing-queue')
    BullModule.registerQueue({
      name: 'billing-queue',
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingProcessor],
})
export class BillingModule {}
// src/seed/seed.module.ts
//creo el modulo de seed 

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { Service, BillingPending, Invoice, BillingBatch } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, BillingPending, Invoice, BillingBatch]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
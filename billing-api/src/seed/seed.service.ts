// src/seed/seed.service.ts

//creo la carpeta seed y el archivo seed para poder implementar la logica 
//vamos a crear un modulo dedicado que exponga un endpoint POST /seed. Esto permitira "resetear" o "llenar" la base de datos a demanda.
//este servicio generara 50 envíos con fechas, montos y estados variados.


import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServiceStatus } from '../entities/service.entity';
import { BillingPending } from '../entities/billing-pending.entity';
import { Invoice } from '../entities/invoice.entity';
import { BillingBatch } from '../entities/billing-batch.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(BillingPending)
    private readonly pendingRepo: Repository<BillingPending>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(BillingBatch)
    private readonly batchRepo: Repository<BillingBatch>,
  ) {}

  async execute() {
    // 1. Limpiar base de datos (Orden inverso por FKs)
    // Usamos createQueryBuilder para saltar la protección de "delete({})"
    await this.invoiceRepo.createQueryBuilder().delete().execute();
    await this.pendingRepo.createQueryBuilder().delete().execute();
    await this.batchRepo.createQueryBuilder().delete().execute();
    await this.serviceRepo.createQueryBuilder().delete().execute();

    const servicesToInsert: Service[] = [];

    // 2. Generar 50 Servicios Simulados
    for (let i = 0; i < 50; i++) {
      const status = this.getRandomStatus();
      
      const service = this.serviceRepo.create({
        customerId: Math.floor(Math.random() * 5) + 1, // Clientes 1 al 5
        amount: Number((Math.random() * 10000 + 1000).toFixed(2)), // Montos entre 1000 y 11000
        serviceDate: this.getRandomDate(),
        status: status,
      });

      servicesToInsert.push(service);
    }

    // 3. Insertar masivamente (Performance)
    await this.serviceRepo.save(servicesToInsert);

    return {
      message: 'SEED EXECUTED',
      stats: {
        totalServices: servicesToInsert.length,
        delivered: servicesToInsert.filter(s => s.status === ServiceStatus.DELIVERED).length,
        inTransit: servicesToInsert.filter(s => s.status === ServiceStatus.IN_TRANSIT).length,
      }
    };
  }

  private getRandomStatus(): ServiceStatus {
    const rand = Math.random();
    //probando los servicios 
    // 60% entregados (listos para facturar), 20% en transito, 20% pendientes
    if (rand < 0.6) return ServiceStatus.DELIVERED;
    if (rand < 0.8) return ServiceStatus.IN_TRANSIT;
    return ServiceStatus.PENDING;
  }

  private getRandomDate(): Date {
    const start = new Date(2025, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}
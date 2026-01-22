import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BillingPending } from './billing-pending.entity';


//Aca hice el primer cambio, añadi el estado DELIVERED para el estado del servicio 
//Borre el estado CREATED, SENT_TO_BILL, INVOICED 
//Cambie ServiceStatus  cree el estado PENDING, IN_TRANSIT, DELIVERED, CANCELLED
//esto es un cambio puramente logistico 

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED', // Solo cuando esta aca se puede facturar
  CANCELLED = 'CANCELLED',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  serviceDate: Date;

  @Column()
  customerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;


  //aca cambio el estado de la columna enum de ServiceStatus.CREATED.  a ServiceStatus.PENDING

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;


  //aca esta la relacion con el dominio de la facturacion

  @OneToMany(() => BillingPending, (pending) => pending.service)
  pendings: BillingPending[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Service } from './service.entity';
import { Invoice } from './invoice.entity';


//añadi el estado de Cancelled a PendingStatus
export enum PendingStatus {
  PENDING = 'PENDING',  // Disponible para un lote
  INVOICED = 'INVOICED',  // Ya procesado
  CANCELLED = 'CANCELLED'
}

@Entity('billing_pendings')
export class BillingPending {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serviceId: number;

  @ManyToOne(() => Service, (service) => service.pendings)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({
    type: 'enum',
    enum: PendingStatus,
    default: PendingStatus.PENDING,
  })
  status: PendingStatus;
//aca hice un cambio hice una captura o hacer snapshot del monto antes de pasar a facturacion
// Esto evita inconsistencias si el servicio original cambia de precio
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @OneToMany(() => Invoice, (invoice) => invoice.pending)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


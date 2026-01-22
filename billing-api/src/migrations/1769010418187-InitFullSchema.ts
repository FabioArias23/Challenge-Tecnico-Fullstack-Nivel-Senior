import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFullSchema1769010418187 implements MigrationInterface {
    name = 'InitFullSchema1769010418187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_batchId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_pendingId"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" DROP CONSTRAINT "FK_billing_pendings_serviceId"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ADD "amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."batch_status_enum" RENAME TO "batch_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."billing_batches_status_enum" AS ENUM('PROCESSED', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" TYPE "public"."billing_batches_status_enum" USING "status"::"text"::"public"."billing_batches_status_enum"`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" SET DEFAULT 'PROCESSED'`);
        await queryRunner.query(`DROP TYPE "public"."batch_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."pending_status_enum" RENAME TO "pending_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."billing_pendings_status_enum" AS ENUM('PENDING', 'INVOICED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" TYPE "public"."billing_pendings_status_enum" USING "status"::"text"::"public"."billing_pendings_status_enum"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."pending_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."service_status_enum" RENAME TO "service_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" TYPE "public"."services_status_enum" USING "status"::"text"::"public"."services_status_enum"`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."service_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_bdef5dd10ff4d7d11b31008e141" FOREIGN KEY ("batchId") REFERENCES "billing_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_fb37360703f36b78c90a8ba671a" FOREIGN KEY ("pendingId") REFERENCES "billing_pendings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ADD CONSTRAINT "FK_52aac71142edc8a7c3418925202" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billing_pendings" DROP CONSTRAINT "FK_52aac71142edc8a7c3418925202"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_fb37360703f36b78c90a8ba671a"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_bdef5dd10ff4d7d11b31008e141"`);
        await queryRunner.query(`CREATE TYPE "public"."service_status_enum_old" AS ENUM('CREATED', 'SENT_TO_BILL', 'INVOICED')`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" TYPE "public"."service_status_enum_old" USING "status"::"text"::"public"."service_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" SET DEFAULT 'CREATED'`);
        await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."service_status_enum_old" RENAME TO "service_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."pending_status_enum_old" AS ENUM('PENDING', 'INVOICED')`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" TYPE "public"."pending_status_enum_old" USING "status"::"text"::"public"."pending_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."billing_pendings_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."pending_status_enum_old" RENAME TO "pending_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."batch_status_enum_old" AS ENUM('PROCESSED', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" TYPE "public"."batch_status_enum_old" USING "status"::"text"::"public"."batch_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "billing_batches" ALTER COLUMN "status" SET DEFAULT 'PROCESSED'`);
        await queryRunner.query(`DROP TYPE "public"."billing_batches_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."batch_status_enum_old" RENAME TO "batch_status_enum"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "billing_pendings" ADD CONSTRAINT "FK_billing_pendings_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_pendingId" FOREIGN KEY ("pendingId") REFERENCES "billing_pendings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_batchId" FOREIGN KEY ("batchId") REFERENCES "billing_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

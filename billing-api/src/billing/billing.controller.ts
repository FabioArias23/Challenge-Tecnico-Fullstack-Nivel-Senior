import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBatchDto } from './dto/create-batch.dto';
// OJO: Ya NO importamos Public aquí, o lo dejamos de usar

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // SIN @Public() -> Requiere Token
  @Post('generate-pendings')
  async generatePendings() {
    return this.billingService.generatePendings();
  }

  // SIN @Public() -> Requiere Token
  @Get('pendings')
  async getPendings() {
    return this.billingService.findAllPendings();
  }

  // SIN @Public() -> Requiere Token
  @Post('batch')
  async createBatch(@Body() dto: CreateBatchDto) {
    return this.billingService.createBatch(dto);
  }

  // SIN @Public() -> Requiere Token
  @Get('batch/:id/erp-export')
  async exportBatchToERP(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.getBatchForERP(id);
  }
}
import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { OrgId, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CreatePaymentDto } from './dto';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
@RequireModule('payments')
@UseGuards(ModuleGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@OrgId() organizationId: string) {
    return this.payments.list(organizationId);
  }

  @Get(':id')
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.payments.findOne(organizationId, id);
  }

  @Get(':id/receipt')
  async receipt(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.payments.getReceipt(organizationId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.end(buffer);
  }

  @Get(':id/receipt/status')
  async receiptStatus(@OrgId() organizationId: string, @Param('id') id: string) {
    await this.payments.findOne(organizationId, id); // valida ownership
    return { status: await this.payments.getReceiptStatus(id) };
  }

  @Post()
  @Roles(['imperador', 'administrador', 'tesoureiro'])
  create(@OrgId() organizationId: string, @Body() dto: CreatePaymentDto) {
    return this.payments.create(organizationId, dto);
  }
}

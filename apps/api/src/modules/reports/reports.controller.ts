import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OrgId, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { ReportsService } from './reports.service';

@Controller('api/reports')
@RequireModule('reports')
@UseGuards(ModuleGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  overview(@OrgId() organizationId: string) {
    return this.reports.overview(organizationId);
  }

  @Get('members.csv')
  async membersCsv(@OrgId() organizationId: string, @Res() res: Response) {
    const csv = await this.reports.membersCsv(organizationId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="socios.csv"');
    res.end('\uFEFF' + csv);
  }

  @Get('payments.csv')
  async paymentsCsv(@OrgId() organizationId: string, @Res() res: Response) {
    const csv = await this.reports.paymentsCsv(organizationId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pagamentos.csv"');
    res.end('\uFEFF' + csv);
  }
}

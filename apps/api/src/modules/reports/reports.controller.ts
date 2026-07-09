import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OrgId, RequireModule, StaffOnly } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { MemberListPdfService } from './member-list-pdf.service';
import { MemberQuotaReportService } from './member-quota-report.service';
import { ReportsService } from './reports.service';

function semicolonCsv(headers: string[], rows: string[][]): string {
  const esc = (v: string) => (/[";\\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...rows].map((r) => r.map((c) => esc(c)).join(';')).join('\n');
}

@Controller('api/reports')
@RequireModule('reports')
@UseGuards(ModuleGuard)
@StaffOnly()
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly quotaReports: MemberQuotaReportService,
    private readonly listPdf: MemberListPdfService,
  ) {}

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

  @Get('members/paying.pdf')
  async payingPdf(@OrgId() organizationId: string, @Res() res: Response) {
    const org = await this.reports.getOrganizationName(organizationId);
    const rows = await this.quotaReports.payingRows(organizationId);
    const pdf = await this.listPdf.generate(
      'Sócios pagantes (quota em dia)',
      org,
      ['N.º', 'Nome', 'Email', 'Plano', 'Situação', 'Vencimento'],
      rows.map((r) => [r.number, r.name, r.email, r.plan, r.situation, r.dueDate]),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="socios_pagantes_${date}.pdf"`);
    res.end(pdf);
  }

  @Get('members/paying.csv')
  async payingCsv(@OrgId() organizationId: string, @Res() res: Response) {
    const rows = await this.quotaReports.payingRows(organizationId);
    const csv = semicolonCsv(
      ['N.º', 'Nome', 'Email', 'Telefone', 'Plano', 'Situação', 'Vencimento'],
      rows.map((r) => [r.number, r.name, r.email, r.phone, r.plan, r.situation, r.dueDate]),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="socios_pagantes_${date}.csv"`);
    res.end('\uFEFF' + csv);
  }

  @Get('members/overdue.pdf')
  async overduePdf(@OrgId() organizationId: string, @Res() res: Response) {
    const org = await this.reports.getOrganizationName(organizationId);
    const rows = await this.quotaReports.overdueRows(organizationId);
    const pdf = await this.listPdf.generate(
      'Sócios em atraso',
      org,
      ['N.º', 'Nome', 'Email', 'Plano', 'Dias', 'Vencimento'],
      rows.map((r) => [
        r.number,
        r.name,
        r.email,
        r.plan,
        String(r.daysOverdue ?? 0),
        r.dueDate,
      ]),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="socios_em_atraso_${date}.pdf"`);
    res.end(pdf);
  }

  @Get('members/overdue.csv')
  async overdueCsv(@OrgId() organizationId: string, @Res() res: Response) {
    const rows = await this.quotaReports.overdueRows(organizationId);
    const csv = semicolonCsv(
      ['N.º', 'Nome', 'Email', 'Telefone', 'Plano', 'Dias em atraso', 'Vencimento'],
      rows.map((r) => [
        r.number,
        r.name,
        r.email,
        r.phone,
        r.plan,
        String(r.daysOverdue ?? 0),
        r.dueDate,
      ]),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="socios_em_atraso_${date}.csv"`);
    res.end('\uFEFF' + csv);
  }
}

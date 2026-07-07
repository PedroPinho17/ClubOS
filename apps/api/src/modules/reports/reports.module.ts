import { Module } from '@nestjs/common';
import { MemberListPdfService } from './member-list-pdf.service';
import { MemberQuotaReportService } from './member-quota-report.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, MemberQuotaReportService, MemberListPdfService],
})
export class ReportsModule {}

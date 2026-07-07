import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { buildMemberExportRows } from './member-export-rows';
import { buildSpreadsheetBuffer } from './member-spreadsheet';

@Injectable()
export class MemberExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportBuffer(organizationId: string): Promise<Buffer> {
    const members = await this.prisma.member.findMany({
      where: { organizationId },
      include: {
        quotaPlan: true,
        payments: { orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] },
      },
    });

    const rows = buildMemberExportRows(members);
    return buildSpreadsheetBuffer(rows);
  }

  exportFilename(): string {
    return `socios_${new Date().toISOString().slice(0, 10)}.xlsx`;
  }
}

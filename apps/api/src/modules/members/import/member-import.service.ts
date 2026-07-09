import { Injectable } from '@nestjs/common';
import type { Member } from '@clubos/database';
import { PrismaService } from '../../../prisma/prisma.service';
import { ImportDryRunService } from './import-dry-run';
import { ImportMemberUpsertService } from './import-member-upsert';
import { ImportPaymentUpsertService } from './import-payment-upsert';
import {
  columnMapHasIdentity,
  mapHeaderIndexes,
} from './member-import-column-map';
import {
  buildMemberPayload,
  extractRowData,
  isPaymentOnlyRow,
  rowIsEmpty,
} from './import-row-validator';
import { emptyImportResult, type MemberImportResult } from './member-import.types';
import { nullableString } from './member-import-parse';
import { readSpreadsheetRows } from './member-spreadsheet';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

@Injectable()
export class MemberImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberUpsert: ImportMemberUpsertService,
    private readonly paymentUpsert: ImportPaymentUpsertService,
    private readonly dryRun: ImportDryRunService,
  ) {}

  async importFromBuffer(
    organizationId: string,
    buffer: Buffer,
    updateExisting = true,
    dryRun = false,
  ): Promise<MemberImportResult> {
    if (buffer.length > MAX_IMPORT_BYTES) {
      return {
        ...emptyImportResult(),
        errors: [{ row: 0, message: 'Ficheiro demasiado grande (max 10 MB).' }],
      };
    }

    const rows = readSpreadsheetRows(buffer);
    if (rows.length === 0) {
      return {
        ...emptyImportResult(),
        errors: [{ row: 1, message: 'O ficheiro está vazio ou não tem linhas de dados.' }],
      };
    }

    const headerRow = rows.shift()!;
    const columnMap = mapHeaderIndexes(headerRow);
    if (!columnMapHasIdentity(columnMap)) {
      return {
        ...emptyImportResult(),
        errors: [
          {
            row: 1,
            message:
              'Cabeçalho inválido: falta a coluna «Nome» ou «Número». Use o modelo Excel disponível no backoffice.',
          },
        ],
      };
    }

    const plans = await this.prisma.quotaPlan.findMany({ where: { organizationId } });
    const membersInSession = new Map<string, Member>();
    const result = emptyImportResult();

    for (let i = 0; i < rows.length; i++) {
      const excelRow = i + 2;
      const data = extractRowData(rows[i], columnMap);

      if (rowIsEmpty(data)) continue;

      if (isPaymentOnlyRow(data)) {
        await this.paymentUpsert.importPaymentOnlyRow(
          organizationId,
          data,
          excelRow,
          membersInSession,
          result,
          dryRun,
          (orgId, member, rowData, importResult) =>
            this.dryRun.simulatePaymentForMember(orgId, member, rowData, importResult),
        );
        continue;
      }

      const nome = nullableString(data.nome);
      if (!nome) {
        result.errors.push({ row: excelRow, message: 'O nome é obrigatório na primeira linha de cada sócio.' });
        result.skipped++;
        continue;
      }

      let memberPayload;
      try {
        memberPayload = buildMemberPayload(data, plans);
      } catch (e) {
        result.errors.push({ row: excelRow, message: (e as Error).message });
        result.skipped++;
        continue;
      }

      const numero = memberPayload.number ?? '';
      const existing =
        numero !== ''
          ? (membersInSession.get(numero) ??
            (await this.prisma.member.findFirst({
              where: { organizationId, number: numero },
            })))
          : null;

      if (existing && !updateExisting) {
        result.skipped++;
        continue;
      }

      try {
        if (dryRun) {
          await this.dryRun.simulateMemberRow(
            organizationId,
            existing,
            memberPayload,
            data,
            membersInSession,
            result,
          );
        } else {
          await this.prisma.$transaction(async (tx) => {
            const member = await this.memberUpsert.upsert(tx, organizationId, existing, memberPayload);
            if (existing) {
              result.updated++;
            } else {
              result.created++;
            }
            membersInSession.set(member.number, member);
            await this.paymentUpsert.importForMember(tx, organizationId, member, data, result);
          });
        }
      } catch (e) {
        result.errors.push({ row: excelRow, message: (e as Error).message });
        result.skipped++;
      }
    }

    if (dryRun) result.dryRun = true;
    return result;
  }
}

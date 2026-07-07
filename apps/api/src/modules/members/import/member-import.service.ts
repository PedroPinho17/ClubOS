import { Injectable } from '@nestjs/common';
import type { Prisma } from '@clubos/database';
import { MemberStatus, PaymentMethod, PaymentStatus, type Member, type QuotaPlan } from '@clubos/database';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  columnMapHasIdentity,
  mapHeaderIndexes,
  MEMBER_FIELDS,
} from './member-import-column-map';
import {
  cellWasExplicitlyEmpty,
  formatYearMonth,
  nullableString,
  parseBoolean,
  parseDate,
  parseDecimal,
} from './member-import-parse';
import { emptyImportResult, type ImportRowData, type MemberImportResult } from './member-import.types';
import { readSpreadsheetRows } from './member-spreadsheet';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

@Injectable()
export class MemberImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importFromBuffer(
    organizationId: string,
    buffer: Buffer,
    updateExisting = true,
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
      const data = this.extractRowData(rows[i], columnMap);

      if (this.rowIsEmpty(data)) continue;

      if (this.isPaymentOnlyRow(data)) {
        await this.importPaymentOnlyRow(organizationId, data, excelRow, membersInSession, result);
        continue;
      }

      const nome = nullableString(data.nome);
      if (!nome) {
        result.errors.push({ row: excelRow, message: 'O nome é obrigatório na primeira linha de cada sócio.' });
        result.skipped++;
        continue;
      }

      let memberPayload: MemberPayload;
      try {
        memberPayload = this.buildMemberPayload(data, plans);
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
        await this.prisma.$transaction(async (tx) => {
          let member: Member;
          if (existing) {
            member = await tx.member.update({
              where: { id: existing.id },
              data: {
                name: memberPayload.name,
                email: memberPayload.email,
                phone: memberPayload.phone,
                joinedAt: memberPayload.joinedAt,
                cardRole: memberPayload.cardRole,
                cardValidUntil: memberPayload.cardValidUntil,
                status: memberPayload.status,
                notes: memberPayload.notes,
                quotaPlanId: memberPayload.quotaPlanId,
              },
            });
            result.updated++;
          } else {
            const number =
              memberPayload.number ?? (await this.nextNumber(tx, organizationId));
            member = await tx.member.create({
              data: {
                organizationId,
                number,
                name: memberPayload.name,
                email: memberPayload.email,
                phone: memberPayload.phone,
                joinedAt: memberPayload.joinedAt,
                cardRole: memberPayload.cardRole,
                cardValidUntil: memberPayload.cardValidUntil,
                status: memberPayload.status,
                notes: memberPayload.notes,
                quotaPlanId: memberPayload.quotaPlanId,
              },
            });
            result.created++;
          }

          membersInSession.set(member.number, member);
          await this.importPaymentForMember(tx, organizationId, member, data, result);
        });
      } catch (e) {
        result.errors.push({ row: excelRow, message: (e as Error).message });
        result.skipped++;
      }
    }

    return result;
  }

  private extractRowData(row: unknown[], columnMap: Record<number, string>): ImportRowData {
    const data: ImportRowData = {};
    for (const [index, field] of Object.entries(columnMap)) {
      data[field] = row[Number(index)] ?? null;
    }
    return data;
  }

  private rowIsEmpty(data: ImportRowData): boolean {
    return Object.values(data).every(
      (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === ''),
    );
  }

  private isPaymentOnlyRow(data: ImportRowData): boolean {
    const numero = nullableString(data.numero);
    if (!numero) return false;
    if (nullableString(data.nome)) return false;

    for (const field of MEMBER_FIELDS) {
      if (field === 'nome') continue;
      if (this.fieldHasValue(data[field])) return false;
    }
    return true;
  }

  private fieldHasValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  private hasPaymentData(data: ImportRowData): boolean {
    return (
      this.fieldHasValue(data.pagamento_data) ||
      this.fieldHasValue(data.pagamento_valor) ||
      this.fieldHasValue(data.pagamento_referencia) ||
      this.fieldHasValue(data.pagamento_notas)
    );
  }

  private buildMemberPayload(data: ImportRowData, plans: QuotaPlan[]): MemberPayload {
    const joinedAt = parseDate(data.data_adesao);
    if (!joinedAt) {
      throw new Error('A data de adesão é obrigatória (formato dd/mm/aaaa).');
    }

    const email = nullableString(data.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Email inválido: «${email}».`);
    }

    let quotaPlanId: string | null | undefined = undefined;
    const planName = nullableString(data.quota_plan);
    if (planName) {
      const plan = plans.find((p) => p.name.localeCompare(planName, 'pt', { sensitivity: 'accent' }) === 0);
      if (!plan) throw new Error(`Plano de quota «${planName}» não encontrado.`);
      quotaPlanId = plan.id;
    } else if ('quota_plan' in data && cellWasExplicitlyEmpty(data.quota_plan)) {
      quotaPlanId = null;
    }

    let cardValidUntil: Date | null | undefined = undefined;
    const validade = parseDate(data.validade_manual);
    if (validade) {
      cardValidUntil = validade;
    } else if ('validade_manual' in data && cellWasExplicitlyEmpty(data.validade_manual)) {
      cardValidUntil = null;
    }

    return {
      number: nullableString(data.numero) ?? undefined,
      name: String(data.nome).trim(),
      email,
      phone: nullableString(data.telefone),
      joinedAt,
      cardRole: nullableString(data.cargo_cartao),
      notes: nullableString(data.notas),
      status: parseBoolean(data.ativo, true) ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
      quotaPlanId,
      cardValidUntil,
    };
  }

  private buildPaymentPayload(data: ImportRowData): PaymentPayload {
    const paidAt = parseDate(data.pagamento_data);
    if (!paidAt) {
      throw new Error('Para registar pagamento, indique a data do pagamento.');
    }
    const amount = parseDecimal(data.pagamento_valor);
    if (amount === null || amount <= 0) {
      throw new Error('Para registar pagamento, indique um valor maior que zero.');
    }
    const reference = nullableString(data.pagamento_referencia) ?? formatYearMonth(paidAt);
    return { paidAt, amount, reference };
  }

  private async importPaymentOnlyRow(
    organizationId: string,
    data: ImportRowData,
    excelRow: number,
    membersInSession: Map<string, Member>,
    result: MemberImportResult,
  ): Promise<void> {
    const numero = nullableString(data.numero);
    if (!numero) {
      result.errors.push({
        row: excelRow,
        message: 'Linha de pagamento extra: o número de sócio é obrigatório.',
      });
      result.skipped++;
      return;
    }
    if (!this.hasPaymentData(data)) {
      result.errors.push({
        row: excelRow,
        message:
          'Linha com número repetido sem dados de sócio: indique pelo menos um campo de pagamento.',
      });
      result.skipped++;
      return;
    }

    const member =
      membersInSession.get(numero) ??
      (await this.prisma.member.findFirst({ where: { organizationId, number: numero } }));

    if (!member) {
      result.errors.push({
        row: excelRow,
        message: `Sócio n.º «${numero}» não encontrado. A primeira linha desse sócio deve ter o nome e os dados completos.`,
      });
      result.skipped++;
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        membersInSession.set(member.number, member);
        await this.importPaymentForMember(tx, organizationId, member, data, result);
      });
    } catch (e) {
      result.errors.push({ row: excelRow, message: (e as Error).message });
      result.skipped++;
    }
  }

  private async importPaymentForMember(
    tx: Prisma.TransactionClient,
    organizationId: string,
    member: Member,
    data: ImportRowData,
    result: MemberImportResult,
  ): Promise<void> {
    if (!this.hasPaymentData(data)) return;

    const payload = this.buildPaymentPayload(data);
    const existing = await tx.payment.findFirst({
      where: { organizationId, memberId: member.id, reference: payload.reference },
    });

    if (existing) {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          amount: payload.amount,
          paidAt: payload.paidAt,
          status: PaymentStatus.PAID,
          method: PaymentMethod.OTHER,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          organizationId,
          memberId: member.id,
          quotaPlanId: member.quotaPlanId,
          amount: payload.amount,
          paidAt: payload.paidAt,
          reference: payload.reference,
          status: PaymentStatus.PAID,
          method: PaymentMethod.OTHER,
        },
      });
    }
    result.payments++;
  }

  private async nextNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<string> {
    const members = await tx.member.findMany({
      where: { organizationId },
      select: { number: true },
    });
    const max = members.reduce((acc, m) => {
      const n = Number.parseInt(m.number, 10);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return String(max + 1);
  }
}

interface MemberPayload {
  number?: string;
  name: string;
  email: string | null;
  phone: string | null;
  joinedAt: Date;
  cardRole: string | null;
  notes: string | null;
  status: MemberStatus;
  quotaPlanId?: string | null;
  cardValidUntil?: Date | null;
}

interface PaymentPayload {
  paidAt: Date;
  amount: number;
  reference: string;
}

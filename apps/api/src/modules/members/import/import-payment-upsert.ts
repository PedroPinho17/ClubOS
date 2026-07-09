import { Injectable } from '@nestjs/common';
import type { Prisma } from '@clubos/database';
import { PaymentMethod, PaymentStatus, type Member } from '@clubos/database';
import { PrismaService } from '../../../prisma/prisma.service';
import { buildPaymentPayload, hasPaymentData } from './import-row-validator';
import { nullableString } from './member-import-parse';
import type { ImportRowData, MemberImportResult } from './member-import.types';

@Injectable()
export class ImportPaymentUpsertService {
  constructor(private readonly prisma: PrismaService) {}

  async importForMember(
    tx: Prisma.TransactionClient,
    organizationId: string,
    member: Member,
    data: ImportRowData,
    result: MemberImportResult,
  ): Promise<void> {
    if (!hasPaymentData(data)) return;

    const payload = buildPaymentPayload(data);
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

  async importPaymentOnlyRow(
    organizationId: string,
    data: ImportRowData,
    excelRow: number,
    membersInSession: Map<string, Member>,
    result: MemberImportResult,
    dryRun: boolean,
    simulatePayment: (
      organizationId: string,
      member: Member,
      data: ImportRowData,
      result: MemberImportResult,
    ) => Promise<void>,
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
    if (!hasPaymentData(data)) {
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
      if (dryRun) {
        membersInSession.set(member.number, member);
        await simulatePayment(organizationId, member, data, result);
      } else {
        await this.prisma.$transaction(async (tx) => {
          membersInSession.set(member.number, member);
          await this.importForMember(tx, organizationId, member, data, result);
        });
      }
    } catch (e) {
      result.errors.push({ row: excelRow, message: (e as Error).message });
      result.skipped++;
    }
  }
}

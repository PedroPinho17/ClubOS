import { Injectable } from '@nestjs/common';
import { type Member } from '@clubos/database';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  buildPaymentPayload,
  hasPaymentData,
  type MemberPayload,
} from './import-row-validator';
import { formatYearMonth, nullableString, parseDate } from './member-import-parse';
import type { ImportRowData, MemberImportResult } from './member-import.types';
import { ImportMemberUpsertService } from './import-member-upsert';

@Injectable()
export class ImportDryRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberUpsert: ImportMemberUpsertService,
  ) {}

  async simulateMemberRow(
    organizationId: string,
    existing: Member | null,
    memberPayload: MemberPayload,
    data: ImportRowData,
    membersInSession: Map<string, Member>,
    result: MemberImportResult,
  ): Promise<Member> {
    let member: Member;
    if (existing) {
      member = {
        ...existing,
        name: memberPayload.name,
        email: memberPayload.email,
        phone: memberPayload.phone,
        joinedAt: memberPayload.joinedAt,
        cardRole: memberPayload.cardRole,
        cardValidUntil: memberPayload.cardValidUntil ?? existing.cardValidUntil,
        status: memberPayload.status,
        notes: memberPayload.notes,
        quotaPlanId: memberPayload.quotaPlanId ?? existing.quotaPlanId,
      };
      result.updated++;
    } else {
      const number = memberPayload.number ?? (await this.memberUpsert.nextNumber(this.prisma, organizationId));
      member = {
        id: `dry-${number}`,
        organizationId,
        number,
        name: memberPayload.name,
        email: memberPayload.email,
        phone: memberPayload.phone,
        joinedAt: memberPayload.joinedAt,
        cardRole: memberPayload.cardRole,
        cardValidUntil: memberPayload.cardValidUntil ?? null,
        status: memberPayload.status,
        notes: memberPayload.notes,
        photoKey: null,
        userId: null,
        quotaPlanId: memberPayload.quotaPlanId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      result.created++;
    }

    membersInSession.set(member.number, member);
    await this.simulatePaymentForMember(organizationId, member, data, result);
    return member;
  }

  async simulatePaymentForMember(
    organizationId: string,
    member: Member,
    data: ImportRowData,
    result: MemberImportResult,
  ): Promise<void> {
    if (!hasPaymentData(data)) return;
    buildPaymentPayload(data);
    if (!member.id.startsWith('dry-')) {
      const reference =
        nullableString(data.pagamento_referencia) ??
        formatYearMonth(parseDate(data.pagamento_data) ?? new Date());
      await this.prisma.payment.findFirst({
        where: { organizationId, memberId: member.id, reference },
      });
    }
    result.payments++;
  }
}

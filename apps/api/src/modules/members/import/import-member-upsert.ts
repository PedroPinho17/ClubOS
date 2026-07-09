import { Injectable } from '@nestjs/common';
import type { Prisma } from '@clubos/database';
import { type Member } from '@clubos/database';
import { PrismaService } from '../../../prisma/prisma.service';
import type { MemberPayload } from './import-row-validator';

@Injectable()
export class ImportMemberUpsertService {
  async nextNumber(
    tx: Prisma.TransactionClient | PrismaService,
    organizationId: string,
  ): Promise<string> {
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

  async upsert(
    tx: Prisma.TransactionClient,
    organizationId: string,
    existing: Member | null,
    memberPayload: MemberPayload,
  ): Promise<Member> {
    if (existing) {
      return tx.member.update({
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
    }

    const number = memberPayload.number ?? (await this.nextNumber(tx, organizationId));
    return tx.member.create({
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
  }
}

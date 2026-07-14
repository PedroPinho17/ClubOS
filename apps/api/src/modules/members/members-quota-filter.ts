import { PaymentStatus, type Prisma } from "@clubos/database";
import type { PrismaService } from "../../prisma/prisma.service";
import { computeQuotaSituation, type QuotaStatus } from "./quota.util";

const BATCH_SIZE = 200;

/**
 * Encontra IDs de socios cujo estado de quota corresponde ao filtro.
 * Varre a org em lotes leves (sem fotos nem mapeamento completo).
 */
export async function findMemberIdsByQuotaStatus(
  prisma: PrismaService,
  organizationId: string,
  where: Prisma.MemberWhereInput,
  quotaFilter: QuotaStatus,
  diasAvisoQuota: number,
): Promise<{ ids: string[]; total: number }> {
  const matches: { id: string; createdAt: Date }[] = [];
  let cursor: string | undefined;

  for (;;) {
    const batch = await prisma.member.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        joinedAt: true,
        cardValidUntil: true,
        quotaPlan: { select: { periodicity: true } },
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { paidAt: true },
        },
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (batch.length === 0) {
      break;
    }

    for (const member of batch) {
      const situation = computeQuotaSituation({
        periodicity: member.quotaPlan?.periodicity,
        joinedAt: member.joinedAt,
        lastPaidAt: member.payments[0]?.paidAt ?? null,
        cardValidUntil: member.cardValidUntil,
        dueSoonDays: diasAvisoQuota,
      });

      if (situation.status === quotaFilter) {
        matches.push({ id: member.id, createdAt: member.createdAt });
      }
    }

    cursor = batch[batch.length - 1]?.id;
    if (batch.length < BATCH_SIZE) {
      break;
    }
  }

  matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return {
    ids: matches.map((m) => m.id),
    total: matches.length,
  };
}

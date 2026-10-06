import { prisma } from "@clubos/database";
import { publicOriginForOrg } from "../common/public-origin";

/** Origem publica do clube do utilizador (reset password / emails). */
export async function publicOriginForUser(userId: string): Promise<string> {
  const member = await prisma.member.findFirst({
    where: { userId },
    select: { organization: { select: { domain: true } } },
  });
  if (member?.organization) {
    return publicOriginForOrg(member.organization);
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organization: { select: { domain: true } } },
  });
  return publicOriginForOrg(membership?.organization ?? {});
}

import { ForbiddenException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * Resolve o papel efectivo do utilizador no contexto actual.
 * - socio: sempre portal (global).
 * - imperador: super-admin global em qualquer org.
 * - restantes staff: orgRole da membership activa.
 */
export async function resolveEffectiveRole(
  prisma: PrismaService,
  userId: string,
  globalRole: string | null | undefined,
  organizationId: string,
): Promise<string> {
  if (globalRole === "socio") {
    return "socio";
  }

  if (globalRole === "imperador") {
    return "imperador";
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { orgRole: true },
  });

  if (!membership) {
    throw new ForbiddenException(
      "Sem permissao para aceder a esta organizacao.",
    );
  }

  return membership.orgRole;
}

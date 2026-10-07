import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@clubos/database";

/**
 * Better Auth credential exige accountId = user.id.
 * Contas legadas com accountId=email falham em POST /api/auth/sign-in/email.
 */
export async function repairCredentialAccountIds(opts?: {
  userId?: string;
}): Promise<{ repaired: number }> {
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "credential",
      ...(opts?.userId ? { userId: opts.userId } : {}),
    },
    select: { id: true, accountId: true, userId: true },
  });
  const broken = accounts.filter((a) => a.accountId !== a.userId);
  if (broken.length === 0) return { repaired: 0 };

  await prisma.$transaction(
    broken.map((a) =>
      prisma.account.update({
        where: { id: a.id },
        data: { accountId: a.userId },
      }),
    ),
  );
  return { repaired: broken.length };
}

/**
 * Cria utilizador + conta credential sem passar pelo endpoint publico de sign-up.
 * Usar para convites, portal e seeds — o registo publico fica desactivado.
 */
export async function createCredentialUser(opts: {
  email: string;
  password: string;
  name: string;
  role?: string;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
}) {
  const email = opts.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await repairCredentialAccountIds({ userId: existing.id });
    return existing;
  }

  const userId = randomUUID();
  const hashed = await hashPassword(opts.password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      name: opts.name,
      role: opts.role ?? "socio",
      emailVerified: opts.emailVerified ?? false,
      mustChangePassword: opts.mustChangePassword ?? false,
      accounts: {
        create: {
          id: randomUUID(),
          // Better Auth credential: accountId deve ser o user.id (nao o email).
          accountId: userId,
          providerId: "credential",
          password: hashed,
        },
      },
    },
  });

  return user;
}

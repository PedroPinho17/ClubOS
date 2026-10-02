import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@clubos/database";

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
    // Repara contas criadas com accountId=email (login Better Auth falhava).
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { accountId: existing.id },
    });
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

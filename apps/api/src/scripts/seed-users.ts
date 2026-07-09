import '../env';
import { randomUUID } from 'node:crypto';
import { prisma } from '@clubos/database';
import { hashPassword } from 'better-auth/crypto';
import { auth } from '../auth/auth';

function requireSeedPassword(): string {
  const password = process.env.SEED_DEMO_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error(
      'Defina SEED_DEMO_PASSWORD (min. 8 caracteres) no .env antes de correr o seed de utilizadores.',
    );
  }
  return password;
}

async function ensureMembership(userId: string, organizationId: string, orgRole: string) {
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    update: { orgRole },
    create: { userId, organizationId, orgRole },
  });
}

async function syncCredentialPassword(userId: string, email: string, password: string) {
  const hashed = await hashPassword(password);
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });
    return;
  }
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: email,
      providerId: 'credential',
      userId,
      password: hashed,
    },
  });
}

/**
 * Cria os utilizadores iniciais via Better Auth (hashing/contas corretos).
 * Requer que o seed do catalogo/organizacao ja tenha corrido.
 */
async function ensureUser(opts: {
  email: string;
  password: string;
  name: string;
  role: string;
  memberships?: { organizationId: string; orgRole: string }[];
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: opts.email, password: opts.password, name: opts.name },
    });
  }

  await prisma.user.update({
    where: { email: opts.email },
    data: {
      role: opts.role,
      emailVerified: true,
    },
  });

  const user = await prisma.user.findUnique({ where: { email: opts.email } });
  if (!user) return;

  // Sincroniza password demo em contas ja existentes (re-seed seguro).
  await syncCredentialPassword(user.id, opts.email, opts.password);

  for (const m of opts.memberships ?? []) {
    await ensureMembership(user.id, m.organizationId, m.orgRole);
  }
}

async function main() {
  const demoPassword = requireSeedPassword();

  const crcVale = await prisma.organization.findUnique({ where: { slug: 'crc-vale' } });
  const academiaFit = await prisma.organization.findUnique({ where: { slug: 'academia-fit' } });
  if (!crcVale) {
    throw new Error('Organizacao "crc-vale" nao existe. Corre primeiro: pnpm db:seed');
  }

  const crcMembership = { organizationId: crcVale.id, orgRole: 'imperador' as const };
  const fitMembership = academiaFit
    ? { organizationId: academiaFit.id, orgRole: 'imperador' as const }
    : null;

  await ensureUser({
    email: 'pedropinho364@gmail.com',
    password: demoPassword,
    name: 'Pedro Pinho',
    role: 'imperador',
    memberships: fitMembership ? [crcMembership, fitMembership] : [crcMembership],
  });

  await ensureUser({
    email: 'joao.imperador@clubos.pt',
    password: demoPassword,
    name: 'Joao Imperador',
    role: 'imperador',
    memberships: fitMembership ? [crcMembership, fitMembership] : [crcMembership],
  });

  await ensureUser({
    email: 'admin@crcvale.pt',
    password: demoPassword,
    name: 'Admin CRC Vale',
    role: 'administrador',
    memberships: [{ organizationId: crcVale.id, orgRole: 'administrador' }],
  });

  await ensureUser({
    email: 'tesoureiro@crcvale.pt',
    password: demoPassword,
    name: 'Tesoureiro CRC Vale',
    role: 'tesoureiro',
    memberships: [{ organizationId: crcVale.id, orgRole: 'tesoureiro' }],
  });

  await ensureUser({
    email: 'joao@example.com',
    password: demoPassword,
    name: 'Joao Silva',
    role: 'socio',
  });

  const joaoUser = await prisma.user.findUnique({ where: { email: 'joao@example.com' } });
  const joaoMember = await prisma.member.findFirst({
    where: { organizationId: crcVale.id, email: 'joao@example.com' },
  });
  if (joaoUser && joaoMember) {
    await prisma.member.update({
      where: { id: joaoMember.id },
      data: { userId: joaoUser.id },
    });
  }

  console.log('Utilizadores demo criados.');
  console.log('Password: valor de SEED_DEMO_PASSWORD no .env local (nao commitar).');
  console.log('Contas: pedropinho364@gmail.com, joao.imperador@clubos.pt, admin@crcvale.pt,');
  console.log('        tesoureiro@crcvale.pt, joao@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

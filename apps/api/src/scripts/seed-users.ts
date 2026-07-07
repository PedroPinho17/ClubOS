import '../env';
import { prisma } from '@clubos/database';
import { auth } from '../auth/auth';

async function ensureMembership(userId: string, organizationId: string, orgRole: string) {
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    update: { orgRole },
    create: { userId, organizationId, orgRole },
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
  organizationId: string | null;
  orgRole?: string;
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
      organizationId: opts.organizationId,
      emailVerified: true,
    },
  });

  const user = await prisma.user.findUnique({ where: { email: opts.email } });
  if (user && opts.organizationId && opts.role !== 'socio') {
    await ensureMembership(user.id, opts.organizationId, opts.orgRole ?? opts.role);
  }
}

async function main() {
  const crcVale = await prisma.organization.findUnique({ where: { slug: 'crc-vale' } });
  const academiaFit = await prisma.organization.findUnique({ where: { slug: 'academia-fit' } });
  if (!crcVale) {
    throw new Error('Organizacao "crc-vale" nao existe. Corre primeiro: pnpm db:seed');
  }

  // Imperador Pedro — CRC Vale + Academia Fit.
  await ensureUser({
    email: 'pedropinho364@gmail.com',
    password: 'Gestao2026!dev',
    name: 'Pedro Pinho',
    role: 'imperador',
    organizationId: crcVale.id,
    orgRole: 'imperador',
  });
  const pedro = await prisma.user.findUnique({ where: { email: 'pedropinho364@gmail.com' } });
  if (pedro && academiaFit) {
    await ensureMembership(pedro.id, academiaFit.id, 'imperador');
  }

  // Segundo imperador Joao — CRC Vale (org partilhada com Pedro) + Academia Fit.
  await ensureUser({
    email: 'joao.imperador@clubos.pt',
    password: 'Password123!',
    name: 'Joao Imperador',
    role: 'imperador',
    organizationId: crcVale.id,
    orgRole: 'imperador',
  });
  const joaoImp = await prisma.user.findUnique({ where: { email: 'joao.imperador@clubos.pt' } });
  if (joaoImp && academiaFit) {
    await ensureMembership(joaoImp.id, academiaFit.id, 'imperador');
  }

  await ensureUser({
    email: 'admin@crcvale.pt',
    password: 'Password123!',
    name: 'Admin CRC Vale',
    role: 'administrador',
    organizationId: crcVale.id,
    orgRole: 'administrador',
  });

  await ensureUser({
    email: 'tesoureiro@crcvale.pt',
    password: 'Password123!',
    name: 'Tesoureiro CRC Vale',
    role: 'tesoureiro',
    organizationId: crcVale.id,
    orgRole: 'tesoureiro',
  });

  await ensureUser({
    email: 'joao@example.com',
    password: 'Portal2026!',
    name: 'Joao Silva',
    role: 'socio',
    organizationId: crcVale.id,
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

  // Migrar utilizadores legacy sem membership.
  const legacyUsers = await prisma.user.findMany({
    where: { organizationId: { not: null }, role: { not: 'socio' } },
    select: { id: true, organizationId: true, role: true },
  });
  for (const u of legacyUsers) {
    if (!u.organizationId) continue;
    await ensureMembership(u.id, u.organizationId, u.role === 'imperador' ? 'imperador' : (u.role ?? 'administrador'));
  }

  console.log('Utilizadores prontos:');
  console.log('  Imperador (Pedro):  pedropinho364@gmail.com / Gestao2026!dev');
  console.log('  Imperador (Joao):   joao.imperador@clubos.pt / Password123!');
  console.log('  Administrador:      admin@crcvale.pt / Password123!');
  console.log('  Tesoureiro:         tesoureiro@crcvale.pt / Password123!');
  console.log('  Socio (portal):     joao@example.com / Portal2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

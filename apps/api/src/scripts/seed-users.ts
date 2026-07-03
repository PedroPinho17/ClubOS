import '../env';
import { prisma } from '@clubos/database';
import { auth } from '../auth/auth';

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
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: opts.email, password: opts.password, name: opts.name },
    });
  }

  // Definir role, tenant e marcar email como verificado.
  await prisma.user.update({
    where: { email: opts.email },
    data: {
      role: opts.role,
      organizationId: opts.organizationId,
      emailVerified: true,
    },
  });
}

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: 'crc-vale' } });
  if (!org) {
    throw new Error('Organizacao "crc-vale" nao existe. Corre primeiro: pnpm db:seed');
  }

  // Imperador (super admin da plataforma).
  await ensureUser({
    email: 'pedropinho364@gmail.com',
    password: 'Gestao2026!dev',
    name: 'Pedro Pinho',
    role: 'imperador',
    organizationId: org.id,
  });

  // Administrador demo do CRC Vale.
  await ensureUser({
    email: 'admin@crcvale.pt',
    password: 'Password123!',
    name: 'Admin CRC Vale',
    role: 'administrador',
    organizationId: org.id,
  });

  // Tesoureiro demo do CRC Vale.
  await ensureUser({
    email: 'tesoureiro@crcvale.pt',
    password: 'Password123!',
    name: 'Tesoureiro CRC Vale',
    role: 'tesoureiro',
    organizationId: org.id,
  });

  // Socio demo com acesso ao portal (ligado ao membro Joao Silva).
  await ensureUser({
    email: 'joao@example.com',
    password: 'Portal2026!',
    name: 'Joao Silva',
    role: 'socio',
    organizationId: org.id,
  });

  const joaoUser = await prisma.user.findUnique({ where: { email: 'joao@example.com' } });
  const joaoMember = await prisma.member.findFirst({
    where: { organizationId: org.id, email: 'joao@example.com' },
  });
  if (joaoUser && joaoMember) {
    await prisma.member.update({
      where: { id: joaoMember.id },
      data: { userId: joaoUser.id },
    });
  }

  console.log('Utilizadores prontos:');
  console.log('  Imperador:     pedropinho364@gmail.com / Gestao2026!dev');
  console.log('  Administrador: admin@crcvale.pt / Password123!');
  console.log('  Tesoureiro:    tesoureiro@crcvale.pt / Password123!');
  console.log('  Socio (portal): joao@example.com / Portal2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

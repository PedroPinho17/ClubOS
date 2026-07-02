import {
  PrismaClient,
  ModuleCategory,
  OrganizationPlan,
  OrganizationStatus,
  Periodicity,
} from '@prisma/client';

const prisma = new PrismaClient();

// Catalogo de modulos da plataforma: Core -> Base -> Plugins.
// V1 (CRC Vale): Dashboard, Members, Membership Plans, Payments, Cards,
// QR Validation, Communications, Reports, Member Portal.
const MODULES = [
  // Core (sempre ativos)
  { slug: 'organizations', name: 'Organizations', category: ModuleCategory.CORE, isCore: true, sortOrder: 1 },
  { slug: 'auth', name: 'Authentication', category: ModuleCategory.CORE, isCore: true, sortOrder: 2 },
  { slug: 'users', name: 'Utilizadores', category: ModuleCategory.CORE, isCore: true, sortOrder: 3 },
  { slug: 'permissions', name: 'Roles & Permissions', category: ModuleCategory.CORE, isCore: true, sortOrder: 4 },
  { slug: 'settings', name: 'Settings', category: ModuleCategory.CORE, isCore: true, sortOrder: 5 },
  { slug: 'notifications', name: 'Notifications', category: ModuleCategory.CORE, isCore: true, sortOrder: 6 },
  { slug: 'audit', name: 'Audit', category: ModuleCategory.CORE, isCore: true, sortOrder: 7 },
  // Base / universais (ativaveis)
  { slug: 'dashboard', name: 'Dashboard', category: ModuleCategory.BASE, isCore: false, sortOrder: 10 },
  { slug: 'members', name: 'Members', category: ModuleCategory.BASE, isCore: false, sortOrder: 11 },
  { slug: 'membership-plans', name: 'Membership Plans', category: ModuleCategory.BASE, isCore: false, sortOrder: 12 },
  { slug: 'payments', name: 'Payments', category: ModuleCategory.BASE, isCore: false, sortOrder: 13 },
  { slug: 'cards', name: 'Cards', category: ModuleCategory.BASE, isCore: false, sortOrder: 14 },
  { slug: 'qr-validation', name: 'QR Validation', category: ModuleCategory.BASE, isCore: false, sortOrder: 15 },
  { slug: 'communications', name: 'Communications', category: ModuleCategory.BASE, isCore: false, sortOrder: 16 },
  { slug: 'reports', name: 'Reports', category: ModuleCategory.BASE, isCore: false, sortOrder: 17 },
  { slug: 'member-portal', name: 'Member Portal', category: ModuleCategory.BASE, isCore: false, sortOrder: 18 },
  // Plugins (modalidades - futuro)
  { slug: 'football', name: 'Football', category: ModuleCategory.PLUGIN, isCore: false, sortOrder: 30 },
  { slug: 'kickboxing', name: 'Kickboxing', category: ModuleCategory.PLUGIN, isCore: false, sortOrder: 31 },
  { slug: 'dance', name: 'Dance', category: ModuleCategory.PLUGIN, isCore: false, sortOrder: 32 },
  { slug: 'padel', name: 'Padel', category: ModuleCategory.PLUGIN, isCore: false, sortOrder: 33 },
];

async function main() {
  console.log('Seeding ClubOS (catalogo + org + socios)...');

  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { slug: m.slug },
      update: { name: m.name, category: m.category, isCore: m.isCore, sortOrder: m.sortOrder },
      create: m,
    });
  }

  // Organizacao demo: CRC Vale (primeira organizacao da plataforma).
  const org = await prisma.organization.upsert({
    where: { slug: 'crc-vale' },
    update: {},
    create: {
      name: 'CRC Vale',
      slug: 'crc-vale',
      plan: OrganizationPlan.PRO,
      status: OrganizationStatus.ACTIVE,
      primaryColor: '#16a34a',
    },
  });

  // Ativar todos os modulos V1 para o CRC Vale.
  const v1Enabled = new Set([
    'dashboard',
    'members',
    'membership-plans',
    'payments',
    'cards',
    'qr-validation',
    'communications',
    'reports',
    'member-portal',
  ]);
  const allModules = await prisma.module.findMany();
  for (const module of allModules) {
    const enabled = module.isCore || v1Enabled.has(module.slug);
    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: org.id, moduleId: module.id } },
      update: { enabled },
      create: { organizationId: org.id, moduleId: module.id, enabled },
    });
  }

  // Plano de quota + socios demo.
  const quotaPlan = await prisma.quotaPlan.upsert({
    where: { id: `${org.id}-quota-mensal` },
    update: {},
    create: {
      id: `${org.id}-quota-mensal`,
      organizationId: org.id,
      name: 'Quota Mensal',
      amount: 10,
      periodicity: Periodicity.MONTHLY,
    },
  });

  const demoMembers = [
    { number: '1', name: 'Joao Silva', email: 'joao@example.com' },
    { number: '2', name: 'Maria Santos', email: 'maria@example.com' },
    { number: '3', name: 'Pedro Costa', email: 'pedro@example.com' },
  ];
  for (const m of demoMembers) {
    await prisma.member.upsert({
      where: { organizationId_number: { organizationId: org.id, number: m.number } },
      update: {},
      create: {
        organizationId: org.id,
        number: m.number,
        name: m.name,
        email: m.email,
        quotaPlanId: quotaPlan.id,
      },
    });
  }

  console.log('Catalogo/org/socios prontos. (Utilizadores: correr o seed do Better Auth na API.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

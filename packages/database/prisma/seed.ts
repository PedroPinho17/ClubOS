import {
  PrismaClient,
  ModuleCategory,
  OrganizationPlan,
  OrganizationStatus,
  PaymentMethod,
  PaymentStatus,
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

  // Pagamentos demo (portal do socio: Joao Silva com historico).
  const members = await prisma.member.findMany({ where: { organizationId: org.id } });
  const joao = members.find((m) => m.number === '1');
  const maria = members.find((m) => m.number === '2');

  const now = new Date();
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const demoPayments = [
    ...(joao
      ? [
          {
            id: `${org.id}-demo-pay-joao-1`,
            memberId: joao.id,
            amount: 10,
            method: PaymentMethod.CASH,
            paidAt: twoMonthsAgo,
            reference: 'DEMO-001',
          },
          {
            id: `${org.id}-demo-pay-joao-2`,
            memberId: joao.id,
            amount: 10,
            method: PaymentMethod.MBWAY,
            paidAt: lastMonth,
            reference: 'DEMO-002',
          },
          {
            id: `${org.id}-demo-pay-joao-3`,
            memberId: joao.id,
            amount: 10,
            method: PaymentMethod.TRANSFER,
            paidAt: now,
            reference: 'DEMO-003',
          },
        ]
      : []),
    ...(maria
      ? [
          {
            id: `${org.id}-demo-pay-maria-1`,
            memberId: maria.id,
            amount: 10,
            method: PaymentMethod.CARD,
            paidAt: lastMonth,
            reference: 'DEMO-004',
          },
        ]
      : []),
  ];

  for (const p of demoPayments) {
    await prisma.payment.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        organizationId: org.id,
        memberId: p.memberId,
        quotaPlanId: quotaPlan.id,
        amount: p.amount,
        method: p.method,
        status: PaymentStatus.PAID,
        paidAt: p.paidAt,
        reference: p.reference,
      },
    });
  }

  for (const key of ['dias_aviso_quota', 'lembretes_automaticos'] as const) {
    await prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId: org.id, key } },
      update: {},
      create: {
        organizationId: org.id,
        key,
        value: (key === 'dias_aviso_quota' ? 7 : false) as never,
      },
    });
  }

  await prisma.organizationSetting.upsert({
    where: { organizationId_key: { organizationId: org.id, key: 'card.layout' } },
    update: {
      value: {
        template: 'crc_vale',
        crcValeEnabled: true,
        slogan: 'Juntos Somos Mais Fortes',
      } as never,
    },
    create: {
      organizationId: org.id,
      key: 'card.layout',
      value: {
        template: 'crc_vale',
        crcValeEnabled: true,
        slogan: 'Juntos Somos Mais Fortes',
      } as never,
    },
  });

  // Segunda organizacao demo (testar multi-tenant / switcher do Imperador).
  const org2 = await prisma.organization.upsert({
    where: { slug: 'academia-fit' },
    update: {},
    create: {
      name: 'Academia Fit Lisboa',
      slug: 'academia-fit',
      plan: OrganizationPlan.FREE,
      status: OrganizationStatus.TRIAL,
      primaryColor: '#2563eb',
    },
  });

  const basicModules = new Set(['dashboard', 'members', 'membership-plans', 'payments']);
  for (const module of allModules) {
    const enabled = module.isCore || basicModules.has(module.slug);
    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: org2.id, moduleId: module.id } },
      update: { enabled },
      create: { organizationId: org2.id, moduleId: module.id, enabled },
    });
  }

  await prisma.quotaPlan.upsert({
    where: { id: `${org2.id}-quota-mensal` },
    update: {},
    create: {
      id: `${org2.id}-quota-mensal`,
      organizationId: org2.id,
      name: 'Mensalidade',
      amount: 25,
      periodicity: Periodicity.MONTHLY,
    },
  });

  await prisma.member.upsert({
    where: { organizationId_number: { organizationId: org2.id, number: '1' } },
    update: {},
    create: {
      organizationId: org2.id,
      number: '1',
      name: 'Ana Demo',
      email: 'ana@academiafit.pt',
    },
  });

  console.log('Catalogo/org/socios/pagamentos prontos. (Utilizadores: pnpm db:seed ou seed:users na API.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

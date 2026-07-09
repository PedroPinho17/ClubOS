import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../../src/auth/auth';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';
import { createStaffUser, ensureCrcValeOrg, E2E_PASSWORD, loginWithOrg } from './helpers';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('Organization context guard (E2E)', () => {
  let app: NestExpressApplication;
  let crcValeOrgId: string;
  let otherOrgId: string;
  let staffEmail: string;
  let staffUserId: string;

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = '1000';
    app = await createTestApp({ authRateLimitMax: 1000 });
    crcValeOrgId = await ensureCrcValeOrg();

    const otherOrg = await prisma.organization.findUnique({ where: { slug: 'academia-fit' } });
    if (!otherOrg) {
      throw new Error('Organizacao academia-fit em falta. Corre pnpm db:seed antes dos testes E2E.');
    }
    otherOrgId = otherOrg.id;

    const staff = await createStaffUser({ role: 'administrador', organizationId: crcValeOrgId });
    staffEmail = staff.email;
    staffUserId = staff.userId;
  }, 90_000);

  afterAll(async () => {
    await prisma.organizationMember.deleteMany({ where: { userId: staffUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: staffEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('GET /api/me/organizations responde sem tenant activo (@NoOrgContext)', async () => {
    const agent = request.agent(app.getHttpServer());
    const signIn = await agent.post('/api/auth/sign-in/email').send({
      email: staffEmail,
      password: E2E_PASSWORD,
    });
    expect(signIn.status).toBe(200);

    const orgs = await agent.get('/api/me/organizations');
    expect(orgs.status).toBe(200);
    expect(Array.isArray(orgs.body)).toBe(true);
  });

  it('pedido tenant-aware com org invalida devolve 403', async () => {
    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, crcValeOrgId);
    const members = await agent.get('/api/members').set('x-organization-id', otherOrgId);
    expect(members.status).toBe(403);
    expect(members.body?.message).toMatch(/organizacao|permissao/i);
  });

  it('staff sem membership nao acede a rotas tenant-aware', async () => {
    const orphanEmail = `e2e-orphan-${randomUUID()}@test.clubos.local`;
    await auth.api.signUpEmail({
      body: { email: orphanEmail, password: E2E_PASSWORD, name: 'Orphan Staff' },
    });
    await prisma.user.update({
      where: { email: orphanEmail },
      data: { role: 'administrador', emailVerified: true },
    });

    const agent = request.agent(app.getHttpServer());
    const signIn = await agent.post('/api/auth/sign-in/email').send({
      email: orphanEmail,
      password: E2E_PASSWORD,
    });
    expect(signIn.status).toBe(200);

    const members = await agent.get('/api/members');
    expect(members.status).toBe(403);
    expect(members.body?.message).toMatch(/organizacoes|organizacao/i);

    await prisma.user.deleteMany({ where: { email: orphanEmail } }).catch(() => undefined);
  });
});

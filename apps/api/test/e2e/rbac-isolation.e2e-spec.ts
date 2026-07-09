import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';
import {
  createSocioPortalUser,
  createStaffUser,
  ensureCrcValeOrg,
  E2E_PASSWORD,
  loginWithOrg,
} from './helpers';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('RBAC and tenant isolation (E2E)', () => {
  let app: NestExpressApplication;
  let crcValeOrgId: string;
  let otherOrgId: string;
  let staffEmail: string;
  let staffUserId: string;
  const suffix = randomUUID().slice(0, 8);

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
    await prisma.member.deleteMany({ where: { email: { contains: `rbac-${suffix}` } } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: { contains: `rbac-${suffix}` } } }).catch(() => undefined);
    await prisma.organizationMember.deleteMany({ where: { userId: staffUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: staffEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  }, 90_000);

  it('GET /api/health e /api/ready sao publicos', async () => {
    const health = await request(app.getHttpServer()).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const ready = await request(app.getHttpServer()).get('/api/ready');
    if (ready.status === 200) {
      expect(ready.body.status).toBe('ready');
      expect(ready.body.db).toBe('ok');
      expect(ready.body.redis).toBe('ok');
    } else {
      expect(ready.status).toBe(503);
    }
  });

  it('socio nao acede ao backoffice (GET /api/members)', async () => {
    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, crcValeOrgId);
    const email = `rbac-socio-${suffix}@test.clubos.local`;
    const created = await agent.post('/api/members').send({ name: `Socio RBAC ${suffix}`, email });
    expect(created.status).toBe(201);

    await createSocioPortalUser(created.body.id, email, `Socio RBAC ${suffix}`);

    const socioAgent = request.agent(app.getHttpServer());
    const signIn = await socioAgent.post('/api/auth/sign-in/email').send({ email, password: E2E_PASSWORD });
    expect(signIn.status).toBe(200);

    const members = await socioAgent.get('/api/members');
    expect(members.status).toBe(403);

    const dashboard = await socioAgent.get('/api/dashboard/stats');
    expect(dashboard.status).toBe(403);

    const portal = await socioAgent.get('/api/portal/me');
    expect(portal.status).toBe(200);

    const orgStaff = await socioAgent.get('/api/organization');
    expect(orgStaff.status).toBe(403);

    const orgBranding = await socioAgent.get('/api/portal/organization');
    expect(orgBranding.status).toBe(200);
    expect(orgBranding.body.name).toBeTruthy();
    expect(orgBranding.body.primaryColor).toBeTruthy();
    expect(Object.keys(orgBranding.body).sort()).toEqual(['id', 'logoUrl', 'name', 'primaryColor'].sort());
  });

  it('staff sem membership nao acede a outra organizacao', async () => {
    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, crcValeOrgId);

    const members = await agent.get('/api/members').set('x-organization-id', otherOrgId);
    expect(members.status).toBe(403);
  });
});

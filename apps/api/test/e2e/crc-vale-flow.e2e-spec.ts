import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';
import {
  buildDryRunImportBuffer,
  createSocioPortalUser,
  createStaffUser,
  ensureCrcValeOrg,
  E2E_PASSWORD,
  loginWithOrg,
} from './helpers';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('CRC Vale business flow (E2E)', () => {
  let app: NestExpressApplication;
  let organizationId: string;
  let staffUserId: string;
  let staffEmail: string;
  const suffix = randomUUID().slice(0, 8);

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = '1000';
    app = await createTestApp({ authRateLimitMax: 1000 });
    organizationId = await ensureCrcValeOrg();

    const staff = await createStaffUser({
      role: 'administrador',
      organizationId,
    });
    staffEmail = staff.email;
    staffUserId = staff.userId;
  }, 90_000);

  afterAll(async () => {
    await prisma.organizationMember.deleteMany({ where: { userId: staffUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: staffEmail } }).catch(() => undefined);
    await prisma.member.deleteMany({ where: { email: { contains: `e2e-${suffix}` } } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: { contains: `e2e-${suffix}` } } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('login → import dry-run → pagamento → portal do socio', async () => {
    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, organizationId);

    const importRes = await agent
      .post('/api/members/import')
      .set('x-organization-id', organizationId)
      .field('dryRun', 'true')
      .field('updateExisting', 'false')
      .attach('file', buildDryRunImportBuffer(suffix), 'e2e-import.xlsx');

    expect(importRes.status).toBe(201);
    expect(importRes.body.dryRun).toBe(true);
    expect(importRes.body.errors).toEqual([]);

    const membersRes = await agent.get('/api/members').set('x-organization-id', organizationId);
    expect(membersRes.status).toBe(200);
    const joao = (membersRes.body.items as { id: string; number: string }[]).find((m) => m.number === '1');
    expect(joao).toBeTruthy();

    const paymentRes = await agent
      .post('/api/payments')
      .set('x-organization-id', organizationId)
      .send({
        memberId: joao!.id,
        amount: 10,
        method: 'CASH',
        status: 'PAID',
        reference: `e2e-${suffix}`,
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.memberId).toBe(joao!.id);

    const maria = await prisma.member.findFirst({
      where: { organizationId, number: '2' },
    });
    expect(maria).toBeTruthy();

    const portalEmail = `e2e-portal-${suffix}@test.clubos.local`;
    await createSocioPortalUser(maria!.id, portalEmail, 'Maria E2E Portal');

    const socioAgent = request.agent(app.getHttpServer());
    const socioSignIn = await socioAgent.post('/api/auth/sign-in/email').send({
      email: portalEmail,
      password: E2E_PASSWORD,
    });
    expect(socioSignIn.status).toBe(200);

    const portalMe = await socioAgent.get('/api/portal/me');
    expect(portalMe.status).toBe(200);
    expect(portalMe.body.member?.name).toBeTruthy();
    expect(Array.isArray(portalMe.body.payments)).toBe(true);
  }, 60_000);
});

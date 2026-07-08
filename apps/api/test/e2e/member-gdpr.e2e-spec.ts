import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GDPR_ERASED_NAME } from '../../src/modules/members/member-gdpr.service';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';
import { createSocioPortalUser, createStaffUser, ensureCrcValeOrg, E2E_PASSWORD, loginWithOrg } from './helpers';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('member GDPR (E2E)', () => {
  let app: NestExpressApplication;
  let organizationId: string;
  let staffEmail: string;
  let staffUserId: string;
  const suffix = randomUUID().slice(0, 8);
  let memberId: string;
  let portalUserId: string;

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = '1000';
    app = await createTestApp({ authRateLimitMax: 1000 });
    organizationId = await ensureCrcValeOrg();

    const staff = await createStaffUser({ role: 'administrador', organizationId });
    staffEmail = staff.email;
    staffUserId = staff.userId;

    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, organizationId);
    const email = `gdpr-e2e-${suffix}@test.clubos.local`;
    const created = await agent.post('/api/members').send({ name: `Socio GDPR ${suffix}`, email });
    expect(created.status).toBe(201);
    memberId = created.body.id;

    const portal = await createSocioPortalUser(memberId, email, `Socio GDPR ${suffix}`);
    portalUserId = portal.userId;
  }, 90_000);

  afterAll(async () => {
    await prisma.quotaReminderSent.deleteMany({ where: { memberId } }).catch(() => undefined);
    await prisma.payment.deleteMany({ where: { memberId } }).catch(() => undefined);
    await prisma.member.deleteMany({ where: { id: memberId } }).catch(() => undefined);
    await prisma.session.deleteMany({ where: { userId: portalUserId } }).catch(() => undefined);
    await prisma.account.deleteMany({ where: { userId: portalUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: portalUserId } }).catch(() => undefined);
    await prisma.organizationMember.deleteMany({ where: { userId: staffUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: staffEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('exporta JSON RGPD e apaga dados pessoais mantendo historico de pagamentos', async () => {
    const agent = await loginWithOrg(app, staffEmail, E2E_PASSWORD, organizationId);

    const exportRes = await agent.get(`/api/members/${memberId}/gdpr-export`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-disposition']).toContain('gdpr-export');
    const payload = JSON.parse(exportRes.text);
    expect(payload.format).toBe('clubos-gdpr-v1');
    expect(payload.member.email).toContain(`gdpr-e2e-${suffix}`);
    expect(payload.member.portalLinked).toBe(true);

    const eraseRes = await agent.post(`/api/members/${memberId}/gdpr-erase`).send({ confirm: true });
    expect(eraseRes.status).toBe(201);
    expect(eraseRes.body.portalUserAnonymized).toBe(true);

    const memberRes = await agent.get(`/api/members/${memberId}`);
    expect(memberRes.body.name).toBe(GDPR_ERASED_NAME);
    expect(memberRes.body.email).toBeNull();
    expect(memberRes.body.userId).toBeNull();

    const portalUser = await prisma.user.findUnique({ where: { id: portalUserId } });
    expect(portalUser?.banned).toBe(true);
    expect(portalUser?.email).toContain('gdpr-erased-');

    const exportAfter = JSON.parse(
      (await agent.get(`/api/members/${memberId}/gdpr-export`)).text,
    );
    expect(exportAfter.member.gdprErased).toBe(true);
    expect(exportAfter.member.email).toBeNull();

    const eraseAgain = await agent.post(`/api/members/${memberId}/gdpr-erase`).send({ confirm: true });
    expect(eraseAgain.status).toBe(400);
  });
});

import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../../src/auth/auth';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('Protected API routes (E2E)', () => {
  let app: NestExpressApplication;
  const testEmail = `e2e-protected-${randomUUID()}@test.clubos.local`;
  const testPassword = 'E2eTestPass1!';
  let organizationId: string;
  let userId: string;

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = '1000';
    app = await createTestApp({ authRateLimitMax: 1000 });

    const org = await prisma.organization.findUnique({ where: { slug: 'crc-vale' } });
    if (!org) {
      throw new Error('Organizacao crc-vale em falta. Corre pnpm db:seed antes dos testes E2E.');
    }
    organizationId = org.id;

    await auth.api.signUpEmail({
      body: { email: testEmail, password: testPassword, name: 'E2E Protected' },
    });

    const user = await prisma.user.update({
      where: { email: testEmail },
      data: {
        role: 'administrador',
        emailVerified: true,
      },
    });
    userId = user.id;

    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      update: { orgRole: 'administrador' },
      create: { userId, organizationId, orgRole: 'administrador' },
    });
  }, 60_000);

  afterAll(async () => {
    await prisma.organizationMember.deleteMany({ where: { userId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('GET /api/members exige autenticacao', async () => {
    const res = await request(app.getHttpServer()).get('/api/members');
    expect(res.status).toBe(401);
  });

  it('GET /api/members com sessao e org activa devolve lista', async () => {
    const agent = request.agent(app.getHttpServer());

    const signIn = await agent.post('/api/auth/sign-in/email').send({
      email: testEmail,
      password: testPassword,
    });
    expect(signIn.status).toBe(200);

    const setOrg = await agent
      .post('/api/me/active-organization')
      .send({ organizationId });
    expect(setOrg.status).toBe(201);

    const members = await agent.get('/api/members').set('x-organization-id', organizationId);
    expect(members.status).toBe(200);
    expect(members.body).toMatchObject({ items: expect.any(Array), total: expect.any(Number) });
  });

  it('GET /api/validate/:id sem assinatura e publico mas rejeita token invalido', async () => {
    const res = await request(app.getHttpServer()).get('/api/validate/fake-member-id');
    expect(res.status).toBe(401);
    expect(res.body?.message).toMatch(/invalido|expirado/i);
  });
});

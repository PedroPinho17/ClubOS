import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('Auth API (E2E)', () => {
  let app: NestExpressApplication;
  const testEmail = `e2e-auth-${randomUUID()}@test.clubos.local`;
  const testPassword = 'E2eTestPass1!';
  const testName = 'E2E Auth User';

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = '1000';
    app = await createTestApp({ authRateLimitMax: 1000 });
  }, 60_000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('rejeita rota protegida sem sessao', async () => {
    const res = await request(app.getHttpServer()).get('/api/me/organizations');
    expect(res.status).toBe(401);
  });

  it('regista utilizador via POST /api/auth/sign-up/email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email: testEmail, password: testPassword, name: testName });

    expect(res.status).toBe(200);
    expect(res.body?.user?.email ?? res.body?.email).toBe(testEmail);
  });

  it('falha login com password errada', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: testEmail, password: 'wrong-password' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('autentica e acede a /api/me/organizations com cookie de sessao', async () => {
    const agent = request.agent(app.getHttpServer());

    const signIn = await agent.post('/api/auth/sign-in/email').send({
      email: testEmail,
      password: testPassword,
    });

    expect(signIn.status).toBe(200);

    const orgs = await agent.get('/api/me/organizations');
    expect(orgs.status).toBe(200);
    expect(Array.isArray(orgs.body)).toBe(true);
  });

  it('termina sessao via POST /api/auth/sign-out', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/api/auth/sign-in/email').send({
      email: testEmail,
      password: testPassword,
    });

    const signOut = await agent.post('/api/auth/sign-out');
    expect(signOut.status).toBe(200);

    const orgs = await agent.get('/api/me/organizations');
    expect(orgs.status).toBe(401);
  });
});

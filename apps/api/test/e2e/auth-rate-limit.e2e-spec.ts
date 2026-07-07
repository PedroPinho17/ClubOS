import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-app';
import { isDatabaseAvailable } from './db-available';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('Auth rate limit (E2E)', () => {
  let app: NestExpressApplication;
  const testEmail = `e2e-ratelimit-${randomUUID()}@test.clubos.local`;

  beforeAll(async () => {
    app = await createTestApp({ authRateLimitMax: 3 });
  }, 60_000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it('bloqueia apos exceder o limite em /api/auth', async () => {
    const server = app.getHttpServer();
    const body = { email: testEmail, password: 'wrong' };

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(server).post('/api/auth/sign-in/email').send(body);
      statuses.push(res.status);
    }

    expect(statuses.some((s) => s === 429)).toBe(true);
  });
});

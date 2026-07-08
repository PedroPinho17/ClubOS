import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { prisma } from '@clubos/database';
import type TestAgent from 'supertest/lib/agent';
import request from 'supertest';
import { auth } from '../../src/auth/auth';
import { TEMPLATE_HEADERS } from '../../src/modules/members/import/member-import-column-map';
import { buildSpreadsheetBuffer } from '../../src/modules/members/import/member-spreadsheet';

export const E2E_PASSWORD = 'E2eTestPass1!';

export async function ensureCrcValeOrg(): Promise<string> {
  const org = await prisma.organization.findUnique({ where: { slug: 'crc-vale' } });
  if (!org) {
    throw new Error('Organizacao crc-vale em falta. Corre pnpm db:seed antes dos testes E2E.');
  }
  return org.id;
}

export async function createStaffUser(opts: {
  role: 'administrador' | 'tesoureiro' | 'imperador';
  organizationId: string;
  orgRole?: string;
}): Promise<{ email: string; password: string; userId: string }> {
  const email = `e2e-staff-${randomUUID()}@test.clubos.local`;
  const password = E2E_PASSWORD;

  await auth.api.signUpEmail({
    body: { email, password, name: 'E2E Staff' },
  });

  const user = await prisma.user.update({
    where: { email },
    data: { role: opts.role, emailVerified: true },
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: opts.organizationId } },
    update: { orgRole: opts.orgRole ?? opts.role },
    create: {
      userId: user.id,
      organizationId: opts.organizationId,
      orgRole: opts.orgRole ?? opts.role,
    },
  });

  return { email, password, userId: user.id };
}

export async function loginWithOrg(
  app: NestExpressApplication,
  email: string,
  password: string,
  organizationId: string,
): Promise<TestAgent> {
  const agent = request.agent(app.getHttpServer());

  const signIn = await agent.post('/api/auth/sign-in/email').send({ email, password });
  if (signIn.status !== 200) {
    throw new Error(`Sign-in falhou: ${signIn.status} ${JSON.stringify(signIn.body)}`);
  }

  const setOrg = await agent.post('/api/me/active-organization').send({ organizationId });
  if (setOrg.status !== 200 && setOrg.status !== 201) {
    throw new Error(`Active org falhou: ${setOrg.status} ${JSON.stringify(setOrg.body)}`);
  }

  return agent;
}

export function buildDryRunImportBuffer(uniqueSuffix: string): Buffer {
  const rows: string[][] = [
    [...TEMPLATE_HEADERS],
    [
      `9${uniqueSuffix.slice(0, 3)}`,
      `Socio E2E ${uniqueSuffix}`,
      `e2e-${uniqueSuffix}@test.clubos.local`,
      '912000000',
      '01/01/2026',
      'Quota Mensal',
      '',
      '',
      'Sim',
      'Linha E2E',
      '',
      '',
      '',
      '',
    ],
  ];
  return buildSpreadsheetBuffer(rows);
}

export async function createSocioPortalUser(memberId: string, email: string, name: string) {
  const password = E2E_PASSWORD;

  await auth.api.signUpEmail({
    body: { email, password, name },
  });

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'socio', emailVerified: true },
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { userId: user.id, email },
  });

  return { email, password, userId: user.id };
}

import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { prisma } from "@clubos/database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "../../src/auth/auth";
import { createTestApp } from "./create-app";
import { isDatabaseAvailable } from "./db-available";
import {
  createStaffUser,
  ensureCrcValeOrg,
  E2E_PASSWORD,
  loginWithOrg,
} from "./helpers";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("Organization context guard (E2E)", () => {
  let app: NestExpressApplication;
  let crcValeOrgId: string;
  let otherOrgId: string;
  let staffEmail: string;
  let staffUserId: string;

  beforeAll(async () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = "1000";
    app = await createTestApp({ authRateLimitMax: 1000 });
    crcValeOrgId = await ensureCrcValeOrg();

    const otherOrg = await prisma.organization.findUnique({
      where: { slug: "academia-fit" },
    });
    if (!otherOrg) {
      throw new Error(
        "Organizacao academia-fit em falta. Corre pnpm db:seed antes dos testes E2E.",
      );
    }
    otherOrgId = otherOrg.id;

    const staff = await createStaffUser({
      role: "administrador",
      organizationId: crcValeOrgId,
    });
    staffEmail = staff.email;
    staffUserId = staff.userId;
  }, 90_000);

  afterAll(async () => {
    await prisma.organizationMember
      .deleteMany({ where: { userId: staffUserId } })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({ where: { email: staffEmail } })
      .catch(() => undefined);
    await app?.close();
    await prisma.$disconnect();
  });

  it("GET /api/me/organizations responde sem tenant activo (@NoOrgContext)", async () => {
    const agent = request.agent(app.getHttpServer());
    const signIn = await agent.post("/api/auth/sign-in/email").send({
      email: staffEmail,
      password: E2E_PASSWORD,
    });
    expect(signIn.status).toBe(200);

    const orgs = await agent.get("/api/me/organizations");
    expect(orgs.status).toBe(200);
    expect(Array.isArray(orgs.body)).toBe(true);
  });

  it("pedido tenant-aware com org invalida devolve 403", async () => {
    const agent = await loginWithOrg(
      app,
      staffEmail,
      E2E_PASSWORD,
      crcValeOrgId,
    );
    const members = await agent
      .get("/api/members")
      .set("x-organization-id", otherOrgId);
    expect(members.status).toBe(403);
    expect(members.body?.message).toMatch(/organizacao|permissao/i);
  });

  it("staff sem membership nao acede a rotas tenant-aware", async () => {
    const orphanEmail = `e2e-orphan-${randomUUID()}@test.clubos.local`;
    await auth.api.signUpEmail({
      body: {
        email: orphanEmail,
        password: E2E_PASSWORD,
        name: "Orphan Staff",
      },
    });
    await prisma.user.update({
      where: { email: orphanEmail },
      data: { role: "administrador", emailVerified: true },
    });

    const agent = request.agent(app.getHttpServer());
    const signIn = await agent.post("/api/auth/sign-in/email").send({
      email: orphanEmail,
      password: E2E_PASSWORD,
    });
    expect(signIn.status).toBe(200);

    const members = await agent.get("/api/members");
    expect(members.status).toBe(403);
    expect(members.body?.message).toMatch(/organizacoes|organizacao/i);

    await prisma.user
      .deleteMany({ where: { email: orphanEmail } })
      .catch(() => undefined);
  });

  it("GET /api/public/host-org devolve platform em localhost", async () => {
    const res = await request(app.getHttpServer()).get("/api/public/host-org");
    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("platform");
  });

  it("X-Forwarded-Host com dominio do clube trava staff na org do host", async () => {
    const domain = `e2e-vale-${randomUUID()}.test`;
    await prisma.organization.update({
      where: { id: crcValeOrgId },
      data: { domain },
    });

    try {
      const publicRes = await request(app.getHttpServer())
        .get("/api/public/host-org")
        .set("X-Forwarded-Host", domain);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.kind).toBe("org");
      expect(publicRes.body.id).toBe(crcValeOrgId);

      const agent = await loginWithOrg(
        app,
        staffEmail,
        E2E_PASSWORD,
        crcValeOrgId,
      );
      const members = await agent
        .get("/api/members")
        .set("X-Forwarded-Host", domain)
        .set("x-organization-id", otherOrgId);
      expect(members.status).toBe(200);

      const switchAway = await agent
        .post("/api/me/active-organization")
        .set("X-Forwarded-Host", domain)
        .send({ organizationId: otherOrgId });
      expect(switchAway.status).toBe(403);
    } finally {
      await prisma.organization.update({
        where: { id: crcValeOrgId },
        data: { domain: null },
      });
    }
  });

  it("staff de outro clube e rejeitado no dominio custom", async () => {
    const domain = `e2e-fit-${randomUUID()}.test`;
    await prisma.organization.update({
      where: { id: otherOrgId },
      data: { domain },
    });

    try {
      const agent = await loginWithOrg(
        app,
        staffEmail,
        E2E_PASSWORD,
        crcValeOrgId,
      );
      const members = await agent
        .get("/api/members")
        .set("X-Forwarded-Host", domain);
      expect(members.status).toBe(403);
      expect(members.body?.message).toMatch(/nao pertence a este clube/i);
    } finally {
      await prisma.organization.update({
        where: { id: otherOrgId },
        data: { domain: null },
      });
    }
  });
});

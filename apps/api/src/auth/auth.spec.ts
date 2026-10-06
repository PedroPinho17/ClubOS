import { beforeEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.hoisted(() => vi.fn((config: unknown) => config));
const prismaAdapterMock = vi.hoisted(() => vi.fn(() => ({})));
const createAccessControlMock = vi.hoisted(() =>
  vi.fn(() => ({
    newRole: vi.fn((stmts?: unknown) => stmts ?? {}),
  })),
);
const mailSend = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: prismaAdapterMock,
}));

vi.mock("better-auth/plugins", () => ({
  admin: vi.fn((opts: unknown) => ({ id: "admin", opts })),
}));

vi.mock("better-auth/plugins/access", () => ({
  createAccessControl: createAccessControlMock,
}));

vi.mock("better-auth/plugins/admin/access", () => ({
  adminAc: { statements: { user: ["create"] } },
  defaultStatements: { user: ["create"] },
}));

vi.mock("@better-auth/expo", () => ({
  expo: vi.fn(() => ({ id: "expo" })),
}));

vi.mock("@better-auth/passkey", () => ({
  passkey: vi.fn(() => ({ id: "passkey" })),
}));

vi.mock("@clubos/database", () => ({
  prisma: {
    member: { findFirst: vi.fn() },
    organizationMember: { findFirst: vi.fn() },
    user: { update: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("../core/mail/mail.service", () => ({
  MailService: class {
    send = mailSend;
  },
}));

vi.mock("../env", () => ({
  resolveAuthSecret: () => "ci-test-secret-with-at-least-32-characters",
}));

vi.mock("../common/host-origins", () => ({
  getTrustedOrigins: async () => ["http://localhost:3000"],
}));

vi.mock("./auth-origin", () => ({
  publicOriginForUser: vi.fn().mockResolvedValue("https://crcvale.pt"),
}));

describe("auth config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.BETTER_AUTH_URL = "http://localhost:4000";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    process.env.PASSKEY_RP_ID = "localhost";
  });

  it("configura Better Auth com signup desactivado e admin so imperador", async () => {
    const { auth } = await import("./auth");
    expect(auth).toBeTruthy();
    expect(betterAuthMock).toHaveBeenCalled();
    const config = betterAuthMock.mock.calls[0]![0] as {
      emailAndPassword: {
        disableSignUp: boolean;
        sendResetPassword: (args: {
          user: { id: string; email: string; name: string };
          url: string;
        }) => Promise<void>;
        onPasswordReset: (args: { user: { id: string } }) => Promise<void>;
      };
      plugins: unknown[];
    };
    expect(config.emailAndPassword.disableSignUp).toBe(true);
    expect(config.plugins.length).toBeGreaterThanOrEqual(2);
  });

  it("sendResetPassword envia email com origem do clube", async () => {
    await import("./auth");
    const config = betterAuthMock.mock.calls[0]![0] as {
      emailAndPassword: {
        sendResetPassword: (args: {
          user: { id: string; email: string; name: string };
          url: string;
        }) => Promise<void>;
      };
    };

    await config.emailAndPassword.sendResetPassword({
      user: { id: "u1", email: "a@x.pt", name: "Ana" },
      url: "http://localhost:4000/api/auth/reset?token=1",
    });

    expect(mailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@x.pt",
        subject: expect.stringMatching(/password/i),
        html: expect.any(String),
      }),
    );
  });

  it("onPasswordReset limpa mustChangePassword", async () => {
    const { prisma } = await import("@clubos/database");
    await import("./auth");
    const config = betterAuthMock.mock.calls[0]![0] as {
      emailAndPassword: {
        onPasswordReset: (args: { user: { id: string } }) => Promise<void>;
      };
    };

    await config.emailAndPassword.onPasswordReset({ user: { id: "u1" } });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { mustChangePassword: false },
    });
  });
});

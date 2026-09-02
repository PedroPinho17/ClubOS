import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@clubos/database";
import { MailService } from "../core/mail/mail.service";
import { passwordResetEmail } from "../core/mail/templates/password-reset";
import { getTrustedOrigins } from "../common/host-origins";
import { publicOriginForOrg, replaceUrlOrigin } from "../common/public-origin";

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const mail = new MailService();

async function publicOriginForUser(userId: string): Promise<string> {
  const member = await prisma.member.findFirst({
    where: { userId },
    select: { organization: { select: { domain: true } } },
  });
  if (member?.organization) {
    return publicOriginForOrg(member.organization);
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organization: { select: { domain: true } } },
  });
  return publicOriginForOrg(membership?.organization ?? {});
}

// Access control: roles da plataforma (PDF V1).
// imperador = super admin; administrador = admin do clube; tesoureiro = pagamentos; socio = base.
const ac = createAccessControl(defaultStatements);
const roles = {
  imperador: ac.newRole(adminAc.statements),
  administrador: ac.newRole(adminAc.statements),
  tesoureiro: ac.newRole({}),
  socio: ac.newRole({}),
};

/**
 * Instancia Better Auth (fonte unica de verdade da autenticacao).
 * - Email + password (+ reset por email via SMTP)
 * - Passkey / WebAuthn
 * - Admin plugin (roles: imperador | administrador | tesoureiro | socio)
 */
export const auth = betterAuth({
  appName: "ClubOS",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me",
  trustedOrigins: async () => getTrustedOrigins(),

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const origin = await publicOriginForUser(user.id);
      const resetUrl = replaceUrlOrigin(url, origin);
      const rendered = passwordResetEmail({
        userName: user.name || user.email,
        resetUrl,
      });
      await mail.send({
        to: user.email,
        subject: "Redefinir password — ClubOS",
        text: rendered.text,
        html: rendered.html,
      });
    },
    onPasswordReset: async ({ user }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { mustChangePassword: false },
      });
    },
  },

  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  plugins: [
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? "localhost",
      rpName: "ClubOS",
      origin: webOrigin,
    }),
    admin({
      ac,
      roles,
      adminRoles: ["imperador", "administrador"],
      defaultRole: "socio",
    }),
  ],
});

export type Auth = typeof auth;

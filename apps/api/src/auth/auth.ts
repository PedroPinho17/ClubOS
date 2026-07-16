import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@clubos/database";
import { MailService } from "../core/mail/mail.service";
import { passwordResetEmail } from "../core/mail/templates/password-reset";

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const mail = new MailService();

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
  trustedOrigins: webOrigin.split(",").map((o) => o.trim()),

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const rendered = passwordResetEmail({
        userName: user.name || user.email,
        resetUrl: url,
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

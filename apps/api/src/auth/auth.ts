import { expo } from "@better-auth/expo";
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
import { replaceUrlOrigin } from "../common/public-origin";
import { resolveAuthSecret } from "../env";
import { publicOriginForUser } from "./auth-origin";

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const mail = new MailService();

// Access control: roles da plataforma (PDF V1).
// imperador = super admin (unico com endpoints Better Auth admin: list-users, set-role, …).
// administrador = admin do clube via NestJS (UsersService / guards por org) — SEM user:list/set-role
// no plugin, senao consegue promover-se a imperador e listar utilizadores de todos os clubes.
const ac = createAccessControl(defaultStatements);
const roles = {
  imperador: ac.newRole(adminAc.statements),
  administrador: ac.newRole({}),
  tesoureiro: ac.newRole({}),
  socio: ac.newRole({}),
};

/**
 * Instancia Better Auth (fonte unica de verdade da autenticacao).
 * - Email + password (+ reset por email via SMTP)
 * - Passkey / WebAuthn
 * - Admin plugin (roles: imperador | administrador | tesoureiro | socio)
 * - Expo plugin (app nativa clubos://)
 * - Registo publico desactivado (contas via convite / portal / seed interno)
 */
export const auth = betterAuth({
  appName: "ClubOS",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  basePath: "/api/auth",
  secret: resolveAuthSecret(),
  trustedOrigins: async () => getTrustedOrigins(),

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
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
    expo(),
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? "localhost",
      rpName: "ClubOS",
      origin: webOrigin,
    }),
    admin({
      ac,
      roles,
      // Apenas o imperador tem acesso ao plugin admin do Better Auth.
      // Gestao de staff do clube fica no NestJS (UsersService / guards por org).
      adminRoles: ["imperador"],
      defaultRole: "socio",
    }),
  ],
});

export type Auth = typeof auth;

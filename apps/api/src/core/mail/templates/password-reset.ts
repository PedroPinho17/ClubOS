import {
  baseLayout,
  type OrgBranding,
  type RenderedEmail,
} from "./base.layout";

export function passwordResetEmail(opts: {
  branding?: OrgBranding;
  userName: string;
  resetUrl: string;
}): RenderedEmail {
  const branding = opts.branding ?? { name: "ClubOS", primaryColor: "#2563eb" };
  const bodyHtml = `
    <p>Olá <strong>${opts.userName}</strong>,</p>
    <p>Recebemos um pedido para redefinir a password da sua conta ClubOS.</p>
    <p style="margin-top:24px;">
      <a href="${opts.resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">
        Redefinir password
      </a>
    </p>
    <p style="margin-top:16px;font-size:13px;color:#71717a;">
      Se não pediu esta alteração, ignore este email. O link expira em 1 hora.
    </p>
  `;

  return baseLayout({
    branding,
    title: "Redefinir password",
    bodyHtml,
  });
}

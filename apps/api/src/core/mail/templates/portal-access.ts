import {
  baseLayout,
  type OrgBranding,
  type RenderedEmail,
} from "./base.layout";

export function portalAccessEmail(opts: {
  branding: OrgBranding;
  memberName: string;
  email: string;
  loginUrl: string;
}): RenderedEmail {
  const bodyHtml = `
    <p>Olá <strong>${opts.memberName}</strong>,</p>
    <p>A sua conta de acesso ao <strong>Portal do Sócio</strong> foi criada.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f4f4f5;border-radius:6px;width:100%;">
      <tr><td style="padding:12px 16px;font-size:14px;">
        <div><strong>Email:</strong> ${opts.email}</div>
        <div style="margin-top:8px;">A password inicial foi definida pela administração do clube.</div>
      </td></tr>
    </table>
    <p>No <strong>primeiro acesso</strong> será obrigatório definir uma nova password (mínimo 12 caracteres).</p>
    <p style="margin-top:24px;">
      <a href="${opts.loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">
        Entrar no portal
      </a>
    </p>
  `;

  return baseLayout({
    branding: opts.branding,
    title: "Acesso ao Portal do Sócio",
    bodyHtml,
  });
}

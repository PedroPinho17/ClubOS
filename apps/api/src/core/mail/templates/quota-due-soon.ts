import { baseLayout, type OrgBranding, type RenderedEmail } from './base.layout';

export function quotaDueSoonEmail(opts: {
  branding: OrgBranding;
  memberName: string;
  days: number;
  dueDate: string;
  portalUrl: string;
}): RenderedEmail {
  const bodyHtml = `
    <p>Olá <strong>${opts.memberName}</strong>,</p>
    <p>A sua quota em <strong>${opts.branding.name}</strong> vence em <strong>${opts.days} dia(s)</strong>.</p>
    <p>Data de vencimento: <strong>${opts.dueDate}</strong></p>
    <p>Por favor regularize a situação o mais breve possível.</p>
    <p style="margin-top:24px;">
      <a href="${opts.portalUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">
        Aceder ao portal do sócio
      </a>
    </p>
  `;

  return baseLayout({
    branding: opts.branding,
    title: 'Quota a vencer em breve',
    bodyHtml,
    footerText: `Com os melhores cumprimentos,\n${opts.branding.name}`,
  });
}

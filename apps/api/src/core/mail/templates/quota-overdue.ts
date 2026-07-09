import { baseLayout, type OrgBranding, type RenderedEmail } from './base.layout';

export function quotaOverdueEmail(opts: {
  branding: OrgBranding;
  memberName: string;
  days: number;
  dueDate: string;
  portalUrl: string;
}): RenderedEmail {
  const bodyHtml = `
    <p>Olá <strong>${opts.memberName}</strong>,</p>
    <p>A sua quota em <strong>${opts.branding.name}</strong> encontra-se em atraso há <strong>${opts.days} dia(s)</strong>.</p>
    <p>Vencimento: <strong>${opts.dueDate}</strong></p>
    <p>Por favor regularize a situação o mais breve possível.</p>
    <p style="margin-top:24px;">
      <a href="${opts.portalUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">
        Aceder ao portal do sócio
      </a>
    </p>
  `;

  return baseLayout({
    branding: opts.branding,
    title: 'Quota em atraso',
    bodyHtml,
    footerText: `Com os melhores cumprimentos,\n${opts.branding.name}`,
  });
}

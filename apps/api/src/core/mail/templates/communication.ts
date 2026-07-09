import { baseLayout, type OrgBranding, type RenderedEmail } from './base.layout';

export function communicationEmail(opts: {
  branding: OrgBranding;
  memberName: string;
  subject: string;
  body: string;
}): RenderedEmail {
  const bodyHtml = `
    <p>Olá <strong>${opts.memberName}</strong>,</p>
    <div>${opts.body.replace(/\n/g, '<br/>')}</div>
  `;

  return baseLayout({
    branding: opts.branding,
    title: opts.subject,
    bodyHtml,
  });
}

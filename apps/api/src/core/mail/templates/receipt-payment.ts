import { baseLayout, type OrgBranding, type RenderedEmail } from './base.layout';

export function receiptPaymentEmail(opts: {
  branding: OrgBranding;
  memberName: string;
  amount: string;
}): RenderedEmail {
  const bodyHtml = `
    <p>Olá <strong>${opts.memberName}</strong>,</p>
    <p>Segue em anexo o comprovativo do seu pagamento de <strong>${opts.amount} EUR</strong>.</p>
    <p>Obrigado.</p>
  `;

  return baseLayout({
    branding: opts.branding,
    title: 'Comprovativo de pagamento',
    bodyHtml,
    footerText: `Com os melhores cumprimentos,\n${opts.branding.name}`,
  });
}

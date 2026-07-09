export interface OrgBranding {
  name: string;
  primaryColor?: string | null;
  logoUrl?: string | null;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function baseLayout(opts: {
  branding: OrgBranding;
  title: string;
  bodyHtml: string;
  footerText?: string;
}): RenderedEmail {
  const color = opts.branding.primaryColor?.trim() || '#2563eb';
  const logo = opts.branding.logoUrl?.trim();

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:${color};padding:20px 24px;color:#ffffff;">
            ${logo ? `<img src="${logo}" alt="${opts.branding.name}" height="40" style="display:block;margin-bottom:8px;max-height:40px;">` : ''}
            <div style="font-size:18px;font-weight:bold;">${opts.branding.name}</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">${opts.title}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;color:#18181b;font-size:14px;line-height:1.6;">
            ${opts.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;line-height:1.5;">
            ${opts.footerText ?? `Mensagem enviada por ${opts.branding.name} via ClubOS.`}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = stripHtml(
    `${opts.branding.name}\n${opts.title}\n\n${opts.bodyHtml}\n\n${opts.footerText ?? `Mensagem enviada por ${opts.branding.name} via ClubOS.`}`,
  );

  return { html, text };
}

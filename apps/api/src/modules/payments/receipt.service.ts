import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface ReceiptData {
  organizationName: string;
  organizationColor?: string;
  receiptNumber: string;
  date: Date;
  memberName: string;
  memberNumber: string;
  planName?: string | null;
  amount: number;
  method: string;
  status: string;
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Numerario',
  TRANSFER: 'Transferencia',
  CARD: 'Cartao',
  MBWAY: 'MB WAY',
  OTHER: 'Outro',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

function hexToRgb(hex?: string) {
  const fallback = rgb(0.15, 0.39, 0.92);
  if (!hex) return fallback;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return fallback;
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

@Injectable()
export class ReceiptService {
  /** Gera o comprovativo de pagamento em PDF (A4) e devolve o buffer. */
  async generate(data: ReceiptData): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const color = hexToRgb(data.organizationColor);
    const dark = rgb(0.1, 0.1, 0.12);
    const grey = rgb(0.42, 0.45, 0.5);

    const { width, height } = page.getSize();
    const marginX = 50;
    let y = height - 60;

    // Cabecalho
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color });
    page.drawText(data.organizationName, { x: marginX, y, size: 20, font: bold, color: dark });
    y -= 24;
    page.drawText('Comprovativo de Pagamento', { x: marginX, y, size: 12, font, color: grey });

    // Numero + data (direita)
    page.drawText(`Recibo Nº ${data.receiptNumber}`, {
      x: width - marginX - 200,
      y: height - 60,
      size: 11,
      font: bold,
      color: dark,
    });
    page.drawText(
      `Data: ${data.date.toLocaleDateString('pt-PT')}`,
      { x: width - marginX - 200, y: height - 76, size: 10, font, color: grey },
    );

    y -= 50;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: width - marginX, y },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.92),
    });
    y -= 40;

    // Dados do socio
    const row = (label: string, value: string) => {
      page.drawText(label, { x: marginX, y, size: 10, font, color: grey });
      page.drawText(value, { x: marginX + 160, y, size: 11, font: bold, color: dark });
      y -= 26;
    };

    row('Socio', `${data.memberName} (Nº ${data.memberNumber})`);
    row('Plano', data.planName ?? '-');
    row('Metodo', METHOD_LABEL[data.method] ?? data.method);
    row('Estado', STATUS_LABEL[data.status] ?? data.status);

    y -= 20;
    // Caixa do valor
    page.drawRectangle({
      x: marginX,
      y: y - 40,
      width: width - marginX * 2,
      height: 56,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: color,
      borderWidth: 1,
    });
    page.drawText('Valor Total', { x: marginX + 16, y: y - 12, size: 11, font, color: grey });
    page.drawText(`${data.amount.toFixed(2)} EUR`, {
      x: width - marginX - 140,
      y: y - 18,
      size: 20,
      font: bold,
      color,
    });

    // Rodape
    page.drawText(
      'Documento gerado automaticamente pelo ClubOS.',
      { x: marginX, y: 50, size: 9, font, color: grey },
    );

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }
}

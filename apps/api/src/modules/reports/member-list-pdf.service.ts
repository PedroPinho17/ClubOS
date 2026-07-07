import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Injectable()
export class MemberListPdfService {
  async generate(
    title: string,
    organizationName: string,
    headers: string[],
    rows: string[][],
  ): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const dark = rgb(0.1, 0.1, 0.12);
    const grey = rgb(0.42, 0.45, 0.5);
    const lineColor = rgb(0.88, 0.9, 0.92);

    const marginX = 40;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const colWidth = (pageWidth - marginX * 2) / headers.length;

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 50;

    const drawHeader = () => {
      page.drawText(organizationName, { x: marginX, y, size: 14, font: bold, color: dark });
      y -= 18;
      page.drawText(title, { x: marginX, y, size: 11, font, color: grey });
      y -= 10;
      page.drawText(`Gerado em ${new Date().toLocaleString('pt-PT')}`, {
        x: marginX,
        y: y - 12,
        size: 9,
        font,
        color: grey,
      });
      y -= 36;

      headers.forEach((h, i) => {
        page.drawText(h, {
          x: marginX + i * colWidth,
          y,
          size: 8,
          font: bold,
          color: dark,
          maxWidth: colWidth - 4,
        });
      });
      y -= 14;
      page.drawLine({
        start: { x: marginX, y },
        end: { x: pageWidth - marginX, y },
        thickness: 1,
        color: lineColor,
      });
      y -= 12;
    };

    drawHeader();

    for (const row of rows) {
      if (y < 60) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
        drawHeader();
      }

      row.forEach((cell, i) => {
        page.drawText(cell.slice(0, 28), {
          x: marginX + i * colWidth,
          y,
          size: 8,
          font,
          color: dark,
          maxWidth: colWidth - 4,
        });
      });
      y -= 14;
    }

    return Buffer.from(await pdf.save());
  }
}

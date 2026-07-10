import type { CardData } from "./types";

/** Tamanho CR80 em mm (ISO/IEC 7810). */
export const CARD_MM: [number, number] = [85.6, 53.98];

export async function waitForCardImages(el: HTMLElement | null): Promise<void> {
  if (!el) return;
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
  await new Promise((r) => setTimeout(r, 60));
}

export async function captureCardElement(el: HTMLElement): Promise<string> {
  await waitForCardImages(el);
  const { toPng } = await import("html-to-image");
  return toPng(el, { pixelRatio: 4, cacheBust: true });
}

export async function downloadCardPng(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  await waitForCardImages(el);
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function downloadMemberCardPdf(
  cardData: CardData,
  getCaptureElement: (
    data: CardData,
    side: "front" | "back",
  ) => Promise<HTMLElement | null>,
  filename: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: CARD_MM,
  });
  const isCrcVale = cardData.layout.template === "crc_vale";

  const frontEl = await getCaptureElement(cardData, "front");
  if (!frontEl) return;
  pdf.addImage(
    await captureCardElement(frontEl),
    "PNG",
    0,
    0,
    CARD_MM[0],
    CARD_MM[1],
  );

  if (isCrcVale) {
    const backEl = await getCaptureElement(cardData, "back");
    if (backEl) {
      pdf.addPage(CARD_MM, "landscape");
      pdf.addImage(
        await captureCardElement(backEl),
        "PNG",
        0,
        0,
        CARD_MM[0],
        CARD_MM[1],
      );
    }
  }

  pdf.save(filename);
}

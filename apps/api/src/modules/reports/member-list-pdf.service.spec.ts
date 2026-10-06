import { describe, expect, it } from "vitest";
import { MemberListPdfService } from "./member-list-pdf.service";

describe("MemberListPdfService", () => {
  const service = new MemberListPdfService();

  it("gera PDF com cabecalho e linhas", async () => {
    const buf = await service.generate(
      "Lista de socios",
      "CRC Vale",
      ["N.º", "Nome", "Email"],
      [
        ["1", "Ana", "a@x.pt"],
        ["2", "Bruno", "b@x.pt"],
      ],
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(400);
  });

  it("cria pagina extra quando ha muitas linhas", async () => {
    const rows = Array.from({ length: 80 }, (_, i) => [
      String(i),
      `Socio ${i}`,
      `s${i}@x.pt`,
    ]);
    const buf = await service.generate(
      "Muitos",
      "Org",
      ["N", "Nome", "Email"],
      rows,
    );
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
    expect(buf.length).toBeGreaterThan(2000);
  });
});

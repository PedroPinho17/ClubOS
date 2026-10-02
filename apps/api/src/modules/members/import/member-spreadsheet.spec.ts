import { describe, expect, it } from "vitest";
import {
  InvalidSpreadsheetError,
  buildSpreadsheetBuffer,
  readSpreadsheetRows,
} from "./member-spreadsheet";

describe("member-spreadsheet", () => {
  it("le um .xlsx gerado pelo proprio helper", async () => {
    const buffer = await buildSpreadsheetBuffer([
      ["Nome", "Numero"],
      ["Ana", "1"],
    ]);
    const rows = await readSpreadsheetRows(buffer);
    expect(rows.length).toBe(2);
    expect(rows[0]?.[0]).toBe("Nome");
  });

  it("rejeita texto renomeado para .xlsx sem 500", async () => {
    const fake = Buffer.from("isto nao e um excel", "utf8");
    await expect(readSpreadsheetRows(fake)).rejects.toBeInstanceOf(
      InvalidSpreadsheetError,
    );
  });
});

import ExcelJS from "exceljs";
import {
  TEMPLATE_EXAMPLE_ROWS,
  TEMPLATE_HEADERS,
} from "./member-import-column-map";

export async function readSpreadsheetRows(
  buffer: Buffer,
): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs tipa Buffer de forma incompatível com @types/node recentes
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map(cellValue));
  });
  return rows.filter((row) => rowHasContent(row));
}

export async function buildImportTemplateBuffer(): Promise<Buffer> {
  return buildSpreadsheetBuffer([
    [...TEMPLATE_HEADERS],
    ...TEMPLATE_EXAMPLE_ROWS,
  ]);
}

export async function buildSpreadsheetBuffer(
  rows: string[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Socios");
  for (const row of rows) {
    sheet.addRow(row);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function cellValue(value: unknown): unknown {
  if (value == null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value;
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  if (typeof value === "object" && "result" in value) {
    return (value as { result: unknown }).result ?? null;
  }
  return value;
}

function rowHasContent(row: unknown[]): boolean {
  return row.some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return true;
    if (value instanceof Date) return true;
    return false;
  });
}

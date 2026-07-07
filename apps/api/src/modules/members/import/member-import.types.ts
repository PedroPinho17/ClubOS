export interface MemberImportError {
  row: number;
  message: string;
}

export interface MemberImportResult {
  created: number;
  updated: number;
  payments: number;
  skipped: number;
  errors: MemberImportError[];
}

export function emptyImportResult(): MemberImportResult {
  return { created: 0, updated: 0, payments: 0, skipped: 0, errors: [] };
}

export type ImportRowData = Record<string, unknown>;

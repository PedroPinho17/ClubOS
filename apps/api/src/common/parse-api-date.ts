import { BadRequestException } from "@nestjs/common";
import { parseDate } from "../modules/members/import/member-import-parse";

export function parseApiDate(value: string, fieldName: string): Date {
  const parsed = parseDate(value);
  if (!parsed) {
    throw new BadRequestException(`${fieldName} inválida (use AAAA-MM-DD).`);
  }
  return parsed;
}

/** `undefined` = omitir; `null` = limpar; string = gravar data parseada. */
export function parseOptionalApiDate(
  value: string | null | undefined,
  fieldName: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return parseApiDate(value, fieldName);
}

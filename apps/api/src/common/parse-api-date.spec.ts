import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { parseApiDate, parseOptionalApiDate } from "./parse-api-date";

describe("parseApiDate", () => {
  it("aceita YYYY-MM-DD", () => {
    const d = parseApiDate("2020-01-15", "Data de adesão");
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it("rejeita data inválida", () => {
    expect(() => parseApiDate("não-é-data", "Data de adesão")).toThrow(
      BadRequestException,
    );
  });

  it("parseOptionalApiDate distingue omitir, limpar e gravar", () => {
    expect(parseOptionalApiDate(undefined, "Validade")).toBeUndefined();
    expect(parseOptionalApiDate(null, "Validade")).toBeNull();
    expect(parseOptionalApiDate("2030-12-31", "Validade")?.getFullYear()).toBe(
      2030,
    );
  });
});

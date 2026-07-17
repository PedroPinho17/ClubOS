import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { downloadErrorMessage } from "./safe-download";

describe("downloadErrorMessage", () => {
  it("mapeia 403 e 401", () => {
    expect(downloadErrorMessage(new ApiError(403, "Forbidden"))).toBe(
      "Sem permissão para esta acção.",
    );
    expect(downloadErrorMessage(new ApiError(401, "Unauthorized"))).toBe(
      "Sessão expirada. Entre novamente.",
    );
  });

  it("usa mensagem da ApiError quando disponivel", () => {
    expect(downloadErrorMessage(new ApiError(500, "Falha no recibo"))).toBe(
      "Falha no recibo",
    );
  });

  it("tem fallback generico", () => {
    expect(downloadErrorMessage("boom")).toBe(
      "Não foi possível concluir o download.",
    );
    expect(downloadErrorMessage(new Error("rede"))).toBe("rede");
  });
});

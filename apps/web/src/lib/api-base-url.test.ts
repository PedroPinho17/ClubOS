import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConfiguredApiUrl } from "./api-base-url";

describe("api-base-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("em producao sem env usa same-origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    const prev = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(resolveConfiguredApiUrl()).toBe("same-origin");
    if (prev !== undefined) process.env.NEXT_PUBLIC_API_URL = prev;
  });

  it("trata vazio e same-origin como same-origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(resolveConfiguredApiUrl()).toBe("same-origin");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "same-origin");
    expect(resolveConfiguredApiUrl()).toBe("same-origin");
  });

  it("mantem URL absoluta em dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:4000/");
    expect(resolveConfiguredApiUrl()).toBe("http://localhost:4000");
  });

  it("same-origin no SSR nao devolve URL vazio (Better Auth)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "same-origin");
    const { apiBaseUrl } = await import("./api-base-url");
    expect(apiBaseUrl()).toMatch(/^https?:\/\//);
  });
});

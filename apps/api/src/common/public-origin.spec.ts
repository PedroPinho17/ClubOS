import { afterEach, describe, expect, it, vi } from "vitest";
import {
  originsFromHostname,
  platformOrigin,
  publicOriginForOrg,
  replaceUrlOrigin,
} from "./public-origin";

describe("public-origin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa o dominio do clube quando existe", () => {
    expect(publicOriginForOrg({ domain: "www.crcvale.pt" })).toBe(
      "https://www.crcvale.pt",
    );
  });

  it("cai para WEB_ORIGIN sem dominio", () => {
    vi.stubEnv("WEB_ORIGIN", "https://app.clubos.cloud,http://localhost:3000");
    expect(publicOriginForOrg({})).toBe("https://app.clubos.cloud");
    expect(platformOrigin()).toBe("https://app.clubos.cloud");
  });

  it("inclui variante www/apex nas origens", () => {
    expect(originsFromHostname("crcvale.pt")).toEqual([
      "https://crcvale.pt",
      "https://www.crcvale.pt",
    ]);
  });

  it("substitui a origem de um URL de reset", () => {
    const url =
      "http://localhost:4000/api/auth/reset-password/TOKEN?callbackURL=/login";
    expect(replaceUrlOrigin(url, "https://www.crcvale.pt")).toBe(
      "https://www.crcvale.pt/api/auth/reset-password/TOKEN?callbackURL=/login",
    );
  });
});

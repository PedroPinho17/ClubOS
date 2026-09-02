import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hostnameAliases,
  isPlatformHost,
  isValidClubHostname,
  normalizeHostname,
  parsePlatformHosts,
  parseRequestHost,
} from "./host-hostname";

describe("host-hostname", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normaliza protocolo, path, porta e case", () => {
    expect(normalizeHostname("HTTPS://WWW.CrcVale.PT:443/login")).toBe(
      "www.crcvale.pt",
    );
    expect(normalizeHostname("www.crcvale.pt.")).toBe("www.crcvale.pt");
  });

  it("gera aliases www / apex", () => {
    expect(hostnameAliases("crcvale.pt")).toEqual([
      "crcvale.pt",
      "www.crcvale.pt",
    ]);
    expect(hostnameAliases("www.crcvale.pt")).toEqual([
      "www.crcvale.pt",
      "crcvale.pt",
    ]);
  });

  it("localhost e 127.0.0.1 sao sempre plataforma", () => {
    expect(isPlatformHost("localhost")).toBe(true);
    expect(isPlatformHost("127.0.0.1")).toBe(true);
    expect(isPlatformHost("www.crcvale.pt")).toBe(false);
  });

  it("PLATFORM_HOSTS marca o demo como plataforma", () => {
    const platform = parsePlatformHosts("app.clubos.cloud");
    expect(isPlatformHost("app.clubos.cloud", platform)).toBe(true);
    expect(isPlatformHost("www.app.clubos.cloud", platform)).toBe(true);
    expect(isValidClubHostname("app.clubos.cloud", platform)).toBe(false);
    expect(isValidClubHostname("www.crcvale.pt", platform)).toBe(true);
  });

  it("rejeita hostname invalido", () => {
    expect(isValidClubHostname("not a host")).toBe(false);
    expect(isValidClubHostname("localhost")).toBe(false);
    expect(isValidClubHostname("-bad.com")).toBe(false);
  });

  it("prefere X-Forwarded-Host ao Host", () => {
    expect(
      parseRequestHost({
        host: "localhost:4000",
        "x-forwarded-host": "www.crcvale.pt, other.example",
      }),
    ).toBe("www.crcvale.pt");
  });
});

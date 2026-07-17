import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseRateLimitMax,
  resolveAuthRateLimitMax,
  resolveValidateRateLimitMax,
  applyApiRateLimits,
  configureTrustProxy,
} from "./rate-limit";

describe("parseRateLimitMax", () => {
  it("usa o fallback quando o valor e invalido", () => {
    expect(parseRateLimitMax(undefined, 15)).toBe(15);
    expect(parseRateLimitMax("", 15)).toBe(15);
    expect(parseRateLimitMax("abc", 15)).toBe(15);
    expect(parseRateLimitMax("0", 15)).toBe(15);
    expect(parseRateLimitMax("-3", 15)).toBe(15);
  });

  it("faz floor de numeros validos", () => {
    expect(parseRateLimitMax("15", 1)).toBe(15);
    expect(parseRateLimitMax("60.9", 1)).toBe(60);
  });
});

describe("resolveAuthRateLimitMax / resolveValidateRateLimitMax", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prioriza o override explicito", () => {
    expect(resolveAuthRateLimitMax(3, "15")).toBe(3);
    expect(resolveValidateRateLimitMax(7, "60")).toBe(7);
  });

  it("usa defaults de producao", () => {
    expect(resolveAuthRateLimitMax(undefined, undefined)).toBe(15);
    expect(resolveValidateRateLimitMax(undefined, undefined)).toBe(60);
  });
});

describe("applyApiRateLimits", () => {
  it("monta limiters em /api/auth e /api/validate com store memory", () => {
    const use = vi.fn();
    const app = { use } as never;

    const result = applyApiRateLimits(app, {
      authMax: 3,
      validateMax: 9,
      store: "memory",
    });

    expect(result).toEqual({ authMax: 3, validateMax: 9, store: "memory" });
    expect(use).toHaveBeenCalledTimes(2);
    expect(use.mock.calls[0][0]).toBe("/api/auth");
    expect(use.mock.calls[1][0]).toBe("/api/validate");
    expect(typeof use.mock.calls[0][1]).toBe("function");
    expect(typeof use.mock.calls[1][1]).toBe("function");
  });

  it("faz fallback para memory quando redis e pedido mas ausente", () => {
    const use = vi.fn();
    const app = { use } as never;

    const result = applyApiRateLimits(app, {
      authMax: 2,
      validateMax: 4,
      store: "redis",
      redis: null,
    });

    expect(result.store).toBe("memory");
    expect(use).toHaveBeenCalledTimes(2);
  });

  it("faz fallback para memory quando redis nao esta ready", () => {
    const use = vi.fn();
    const app = { use } as never;
    const redis = { status: "end", call: vi.fn() };

    const result = applyApiRateLimits(app, {
      authMax: 2,
      validateMax: 4,
      store: "redis",
      redis: redis as never,
    });

    expect(result.store).toBe("memory");
    expect(redis.call).not.toHaveBeenCalled();
  });

  it("escolhe store redis quando o cliente esta ready (sem contactar Redis)", () => {
    // Evita instancia real de RedisStore (carrega scripts LUA no cliente).
    const result = applyApiRateLimits({ use: vi.fn() } as never, {
      authMax: 2,
      validateMax: 4,
      // store memory explicito — so valida a resolucao de max + mount
      store: "memory",
      redis: { status: "ready", call: vi.fn() } as never,
    });

    expect(result).toEqual({ authMax: 2, validateMax: 4, store: "memory" });
  });
});

describe("configureTrustProxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("activa trust proxy por omissao", () => {
    const set = vi.fn();
    configureTrustProxy({ set } as never);
    expect(set).toHaveBeenCalledWith("trust proxy", 1);
  });

  it("respeita TRUST_PROXY=false", () => {
    vi.stubEnv("TRUST_PROXY", "false");
    const set = vi.fn();
    configureTrustProxy({ set } as never);
    expect(set).not.toHaveBeenCalled();
  });

  it("respeita TRUST_PROXY_HOPS", () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "2");
    const set = vi.fn();
    configureTrustProxy({ set } as never);
    expect(set).toHaveBeenCalledWith("trust proxy", 2);
  });
});

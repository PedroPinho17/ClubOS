import { Logger, type INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import rateLimit, { type Options, type Store } from "express-rate-limit";
import type { Redis } from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { KEY_PREFIX } from "../redis/redis.constants";

const logger = new Logger("RateLimit");

export type RateLimitMountOptions = {
  /** Max pedidos/min em `/api/auth` (default env ou 15). */
  authMax?: number;
  /** Max pedidos/min em `/api/validate` (default env ou 60). */
  validateMax?: number;
  /**
   * Cliente Redis para store partilhado entre instancias.
   * Se omitido ou `store: "memory"`, usa memoria (OK em single-instance / E2E).
   */
  redis?: Redis | null;
  /**
   * `redis` = store Redis (producao multi-instancia).
   * `memory` = store em processo (E2E / fallback).
   * Default: redis se `redis` estiver definido, senao memory.
   */
  store?: "redis" | "memory";
};

export function parseRateLimitMax(
  value: string | undefined,
  fallback: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function resolveAuthRateLimitMax(
  override?: number,
  envValue = process.env.RATE_LIMIT_AUTH_PER_MIN,
): number {
  return override ?? parseRateLimitMax(envValue, 15);
}

export function resolveValidateRateLimitMax(
  override?: number,
  envValue = process.env.RATE_LIMIT_VALIDATE_PER_MIN,
): number {
  return override ?? parseRateLimitMax(envValue, 60);
}

function createRedisStore(redis: Redis, prefix: string): Store {
  return new RedisStore({
    prefix,
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
  });
}

function buildLimiterOptions(input: {
  max: number;
  message: string;
  store?: Store;
}): Partial<Options> {
  return {
    windowMs: 60_000,
    max: input.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: input.message },
    ...(input.store ? { store: input.store } : {}),
  };
}

/**
 * Aplica rate limits de producao em `/api/auth` e `/api/validate`.
 * Com Redis, os contadores sao partilhados entre replicas (Coolify / multi-pod).
 */
export function applyApiRateLimits(
  app: INestApplication | NestExpressApplication,
  opts: RateLimitMountOptions = {},
): { authMax: number; validateMax: number; store: "redis" | "memory" } {
  const authMax = resolveAuthRateLimitMax(opts.authMax);
  const validateMax = resolveValidateRateLimitMax(opts.validateMax);

  const redisReady =
    !!opts.redis &&
    (opts.redis.status === "ready" ||
      opts.redis.status === "connect" ||
      opts.redis.status === "wait");
  const preferRedis =
    opts.store === "redis" || (opts.store !== "memory" && !!opts.redis);
  const useRedis = preferRedis && !!opts.redis && redisReady;
  const storeMode: "redis" | "memory" = useRedis ? "redis" : "memory";

  if (preferRedis && !useRedis) {
    logger.warn(
      "RATE_LIMIT: Redis indisponivel — a usar store em memoria (limites nao partilhados entre instancias).",
    );
  } else if (useRedis) {
    logger.log("RATE_LIMIT: store Redis activo (multi-instancia).");
  }

  const authStore = useRedis
    ? createRedisStore(opts.redis!, `${KEY_PREFIX}:rl:auth:`)
    : undefined;
  const validateStore = useRedis
    ? createRedisStore(opts.redis!, `${KEY_PREFIX}:rl:validate:`)
    : undefined;

  app.use(
    "/api/auth",
    rateLimit(
      buildLimiterOptions({
        max: authMax,
        message:
          "Demasiados pedidos de autenticacao. Tente novamente em breve.",
        store: authStore,
      }),
    ),
  );
  app.use(
    "/api/validate",
    rateLimit(
      buildLimiterOptions({
        max: validateMax,
        message: "Demasiados pedidos de validacao. Tente novamente em breve.",
        store: validateStore,
      }),
    ),
  );

  return { authMax, validateMax, store: storeMode };
}

/**
 * Confia no proxy reverso (Coolify / Traefik / Caddy) para IP real do cliente.
 * Sem isto, o rate limit em multi-instancia conta o IP do proxy, nao do user.
 */
export function configureTrustProxy(
  app: NestExpressApplication,
  enabled = process.env.TRUST_PROXY !== "false",
): void {
  if (!enabled) return;
  // 1 = confiar no primeiro hop (proxy imediato). Ajustavel via TRUST_PROXY_HOPS.
  const hops = parseRateLimitMax(process.env.TRUST_PROXY_HOPS, 1);
  app.set("trust proxy", hops);
}

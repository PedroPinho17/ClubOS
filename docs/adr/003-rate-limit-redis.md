# ADR 003 — Rate limit com Redis e trust proxy

- **Estado:** Aceite
- **Data:** 2026-07-17

## Contexto

Rotas públicas sensíveis (`/api/auth/*`, `/api/validate/*`) precisam de rate limit por IP para mitigar brute-force e abuso de validação QR.

Em desenvolvimento / E2E uma store **em memória** por processo chega. Em produção (Coolify, várias réplicas da API) a store em memória:

- conta limites **por instância** (um atacante multiplica o budget pelo nº de pods)
- perde contadores em restart
- atrás de Traefik/Caddy/Coolify, sem `trust proxy`, o Express vê o IP do **proxy**, não do cliente — todos os users partilham o mesmo balde

## Decisão

1. **Store Redis por omissão em produção** (`RATE_LIMIT_STORE=redis`) via `rate-limit-redis` + cliente ioredis já usado pelas filas. Prefixos: `clubos:rl:auth:` / `clubos:rl:validate:`.
2. **Fallback para memória** se Redis estiver indisponível (warn no log) ou se `RATE_LIMIT_STORE=memory` (E2E).
3. **`configureTrustProxy`** com `TRUST_PROXY!==false` e `TRUST_PROXY_HOPS` (default `1`) para o IP real chegar ao limiter.
4. Implementação em `apps/api/src/common/rate-limit.ts`, montada em `main.ts`.

Limites configuráveis: `RATE_LIMIT_AUTH_PER_MIN` (15), `RATE_LIMIT_VALIDATE_PER_MIN` (60).

## Consequências

**Positivas**

- Limites correctos com várias réplicas
- Mesma infra Redis já exigida por BullMQ / ready check
- E2E pode forçar memória + limites altos sem Redis dedicado ao rate limit

**Negativas / trade-offs**

- Dependência operacional de Redis (já existia)
- `TRUST_PROXY` mal configurado (hops a mais) pode permitir spoof de `X-Forwarded-For` — manter hops = 1 atrás de um único proxy conhecido

**Não fazer**

- Não desactivar trust proxy em produção atrás de reverse proxy
- Não usar só memória em multi-instância e assumir que o limite “global” está correcto

Detalhe: [Autenticação e RBAC](../AUTENTICACAO-RBAC.md) · [API Backend](../API-BACKEND.md) · [Observabilidade](../OBSERVABILIDADE.md).

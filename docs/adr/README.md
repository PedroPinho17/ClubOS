# Architecture Decision Records (ADRs)

Registo de decisões de arquitectura importantes do ClubOS.

Formato leve (inspirado em [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)): contexto → decisão → consequências.  
Novas decisões: copiar o modelo abaixo para `NNNN-titulo-curto.md` e acrescentar à tabela.

## Índice (completo)

As 5 decisões grandes do MVP V1:

| ADR                                  | Título                                  | Estado | Tema              |
| ------------------------------------ | --------------------------------------- | ------ | ----------------- |
| [001](001-better-auth.md)            | Better Auth como camada de autenticação | Aceite | Auth              |
| [002](002-effective-role-por-org.md) | Papel efectivo por organização          | Aceite | RBAC multi-tenant |
| [003](003-rate-limit-redis.md)       | Rate limit com Redis e trust proxy      | Aceite | Segurança / ops   |
| [004](004-monorepo-pnpm-turbo.md)    | Monorepo pnpm + Turborepo               | Aceite | Estrutura do repo |
| [005](005-prisma-postgresql.md)      | Prisma + PostgreSQL                     | Aceite | Persistência      |

## Modelo

```markdown
# ADR NNNN — Título

- **Estado:** Proposto | Aceite | Substituído por ADR-XXXX
- **Data:** AAAA-MM-DD

## Contexto

…

## Decisão

…

## Consequências

…
```

Ver também: [Autenticação e RBAC](../AUTENTICACAO-RBAC.md), [Arquitectura](../ARQUITETURA.md), [SECURITY](../../SECURITY.md).

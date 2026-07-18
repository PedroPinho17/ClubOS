# ADR 005 — Prisma + PostgreSQL como fonte de verdade

- **Estado:** Aceite
- **Data:** 2026-07-16

## Contexto

O domínio (sócios, quotas, pagamentos, multi-tenant por `organizationId`, auth Better Auth) precisa de:

- schema versionado e migrável
- SQL relacional (joins, constraints, isolation por tenant)
- tipagem TypeScript alinhada com o schema

Alternativas: MongoDB/Mongoose (menos natural para quotas/recibos), Drizzle/Kysely (mais SQL manual), TypeORM (ecossistema Nest clássico mas migrations menos ergonómicas para o time).

## Decisão

- **PostgreSQL** como base de dados de produção e local (Docker `clubos-postgres`).
- **Prisma** em `@clubos/database`: schema único, migrations canónicas (`pnpm db:migrate` / `pnpm db:deploy`), seed separado do deploy de produção.
- Redis e MinIO/S3 ficam para filas/cache e ficheiros — **não** substituem a BD de negócio.

## Consequências

**Positivas**

- Isolamento multi-tenant por coluna + queries tipadas
- Migrations revísiveis em PR com o código
- Better Auth usa o mesmo Prisma adapter

**Negativas / trade-offs**

- Relatórios muito pesados podem precisar de SQL raw / views no futuro
- `db:push` só para protótipos — produção usa sempre migrate deploy

**Não fazer**

- Não correr `pnpm db:seed` em produção (dados demo + passwords de seed)
- Não usar `db:push` como caminho de deploy

Ver: [Base de dados](../BASE-DE-DADOS.md) · [SECURITY](../../SECURITY.md).

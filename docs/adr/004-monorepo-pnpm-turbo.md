# ADR 004 — Monorepo pnpm + Turborepo

- **Estado:** Aceite
- **Data:** 2026-07-16

## Contexto

O ClubOS tem API NestJS, web Next.js, schema Prisma e contratos partilhados (roles, paginação, tipos de domínio). Separar em repositórios distintos cedo implicaria:

- versionar e publicar pacotes internos só para o próprio produto
- drift entre tipos API ↔ Web
- CI e tooling duplicados

## Decisão

Um **monorepo** com:

| Pacote             | Papel                              |
| ------------------ | ---------------------------------- |
| `@clubos/api`      | NestJS REST, cron, filas           |
| `@clubos/web`      | Next.js backoffice + portal        |
| `@clubos/database` | Prisma schema, migrations, seed    |
| `@clubos/shared`   | Contratos e constantes partilhados |

- **pnpm workspaces** + **Turborepo** para `dev` / `build` / `test` / `typecheck`
- Pacotes internos referenciados por workspace protocol; `@clubos/shared` e `@clubos/database` buildados antes dos apps (CI e `transpilePackages` no Next)

## Consequências

**Positivas**

- Uma PR pode alterar contrato + API + UI juntos
- Um só CI (`.github/workflows/ci.yml`) e um só `.env.example`
- Menos risco de `STAFF_ROLES` divergir entre apps

**Negativas / trade-offs**

- Checkout e `pnpm install` mais pesados que um repo só-frontend
- Disciplina necessária para não acoplar UI à implementação Nest

**Não fazer**

- Não duplicar arrays de roles ou DTOs críticos fora de `@clubos/shared`
- Não publicar `@clubos/*` no npm público sem decisão explícita

Ver: [Arquitectura](../ARQUITETURA.md) · [Convenções](../CONVENCOES.md).

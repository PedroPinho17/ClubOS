# Arquitetura

## Visão geral

ClubOS é uma plataforma **SaaS multi-tenant** para gestão de clubes e associações. Uma única instância serve todos os clientes; cada cliente é uma **Organization**.

```
                    ┌─────────────┐
                    │  Browser    │
                    │  Next.js    │
                    │  :3000      │
                    └──────┬──────┘
                           │ HTTP + cookies (sessão)
                           │ header x-organization-id
                    ┌──────▼──────┐
                    │  NestJS API │
                    │  :4000      │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
      PostgreSQL        Redis           MinIO/S3
      (Prisma)       (filas)         (ficheiros)
```

## Camadas funcionais

| Camada | Descrição | Exemplos |
|--------|-----------|----------|
| **Core** | Sempre presente; não se desactiva | Auth, orgs, users, audit, modules |
| **Módulos base** | Activáveis por organização | members, payments, cards, reports |
| **Plugins** | Modalidades específicas (futuro) | football, padel — só no seed |

## Multi-tenancy

- **Isolamento por linha**: tabelas de negócio têm `organizationId`.
- **Nunca** confiar só no `organizationId` vindo do cliente — o `OrganizationContextGuard` valida membership.
- **Módulos**: `OrganizationModule.enabled` controla o que cada org pode usar.

## Multi-organização (staff)

Um utilizador pode ter várias memberships (`OrganizationMember`). A **org activa** resolve-se por:

1. Header `x-organization-id` (enviado pelo web)
2. Cookie `clubos_active_org`
3. `Session.activeOrganizationId` (Better Auth)
4. Primeira membership (fallback)

Sócios (`role: socio`) usam a org do registo `Member` ligado ao `User`.

## Fluxo de um pedido API autenticado

```
1. AuthGuard (Better Auth)     → req.user, req.session
2. OrganizationContextGuard    → req.activeOrganizationId
3. RolesGuard                  → @StaffOnly / @AdminOnly / …
4. ModuleGuard (se @RequireModule) → módulo activo na org
5. Controller → Service → Prisma (sempre filtrar por organizationId)
```

## Monorepo (pnpm + Turbo)

| Pacote | Responsabilidade |
|--------|------------------|
| `@clubos/api` | REST API, cron, filas |
| `@clubos/web` | UI backoffice + portal |
| `@clubos/database` | Schema Prisma, migrations, seed |

Comandos via root: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm db:*`.

## Ficheiros de entrada

| Ficheiro | Papel |
|----------|-------|
| `apps/api/src/main.ts` | Bootstrap NestJS, CORS, rate limit, validation pipe |
| `apps/api/src/app.module.ts` | Registo de todos os módulos |
| `apps/web/src/app/layout.tsx` | Root layout + providers |
| `packages/database/prisma/schema.prisma` | Modelo de dados |

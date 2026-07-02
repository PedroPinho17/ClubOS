# ClubOS

Plataforma **SaaS modular multi-tenant** para gestao de organizacoes (clubes, academias, associacoes, escolas). Uma unica aplicacao e base de dados servem todos os clientes; cada cliente e uma **Organization** (tenant). As funcionalidades sao entregues como **modulos** que se ativam por organizacao.

Sucessor do projeto `gestao_socios` (Laravel/Filament), reconstruido com uma stack moderna e escalavel.

## Arquitetura

```
                         ClubOS
                            |
     +----------------------+----------------------+
     |                      |                      |
   CORE               MODULOS BASE             PLUGINS
     |                      |                      |
  Auth                  Members               Football
  Organizations         Payments              Kickboxing
  Users                 Documents             Dance
  Roles & Permissions   Dashboard             Padel
  Settings              Calendar              Gym
  Files                 Events                ...
  Notifications         Reports
  Audit
```

- **Core** — o coracao da plataforma; nunca muda e e usado por qualquer organizacao.
- **Modulos base** — universais, servem praticamente qualquer organizacao (ativaveis).
- **Plugins** — especificos por modalidade; ativados apenas para quem precisa.

O objetivo nao e ter 30 modulos, mas sim uma plataforma onde adicionar o 31.o modulo daqui a 5 anos seja facil.

### Multi-tenancy

Base de dados unica, schema unico, isolamento por linha via `organizationId` em todas as tabelas de negocio. A ativacao de modulos e feita na tabela `OrganizationModule`. Guards no backend (`ModuleGuard`) e navegacao no frontend so expoem os modulos ativos por organizacao.

## Stack

| Camada        | Tecnologia                                  |
| ------------- | ------------------------------------------- |
| Frontend      | Next.js 15 + React 19 + shadcn/ui + Tailwind |
| Data fetching | TanStack Query                              |
| Backend       | NestJS 11 (modular)                         |
| ORM / BD      | Prisma + PostgreSQL *(dev atual: MySQL)*    |
| Cache/filas   | Redis + BullMQ *(preparado)*                |
| Ficheiros     | S3 / MinIO *(preparado)*                    |
| Auth          | **Better Auth** (email+password, passkey/WebAuthn, roles/admin) |
| Observabilidade | Sentry *(preparado)*                      |
| Deploy        | Docker / Coolify                            |

> **Nota sobre a BD:** o alvo do projeto e PostgreSQL. Em desenvolvimento estamos
> a usar o MySQL local (phpMyAdmin) por ser o que estava disponivel. Para migrar
> para Postgres: mudar `provider` em `packages/database/prisma/schema.prisma` para
> `postgresql`, remover os `@db.Text` (nao sao precisos no Postgres) e atualizar `DATABASE_URL`.

### Autenticacao (Better Auth)

- Instancia em `apps/api/src/auth/auth.ts` (fonte unica de verdade).
- Rotas montadas em `/api/auth/*` via `@thallesp/nestjs-better-auth` (AuthGuard global).
- Metodos: **email + password** e **passkey / WebAuthn** (`@better-auth/passkey`).
- Roles (admin plugin): `imperador` (super admin), `administrador`, `tesoureiro`, `socio`.
  Endpoints protegidos com `@Roles([...])`; modulos com `@RequireModule('slug')` + `ModuleGuard`.

## Estrutura do monorepo

```
ClubOS/
  apps/
    api/            # NestJS (core/ + modules/)
    web/            # Next.js 15 (app router)
  packages/
    database/       # Prisma schema, client, seed
  docker-compose.yml
```

Backend organizado em `src/core` (Core), `src/modules` (modulos base) e — futuramente — `src/plugins` (modalidades).

## Como correr (desenvolvimento)

Pre-requisitos: Node 20+, pnpm 9+, Docker (para Postgres/Redis/MinIO).

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Variaveis de ambiente (copiar e ajustar DATABASE_URL)
Copy-Item .env.example .env

# 3. Base de dados
#    - Dev atual: MySQL local (phpMyAdmin), DATABASE_URL="mysql://root@localhost:3306/clubos"
#    - Alternativa: pnpm docker:up  (Postgres + Redis + MinIO do docker-compose)

# 4. Gerar client Prisma + criar schema na BD
pnpm db:generate
pnpm db:push

# 5. Popular dados demo (catalogo de modulos + CRC Vale + socios + utilizador Imperador)
pnpm db:seed

# 6. Arrancar API + Web
pnpm dev
```

- API: http://localhost:4000/api
- Web: http://localhost:3000

### Credenciais demo

| Utilizador                 | Password         | Role          |
| -------------------------- | ---------------- | ------------- |
| `pedropinho364@gmail.com`  | `Gestao2026!dev` | `imperador`   |
| `admin@crcvale.pt`         | `Password123!`   | `administrador` |

## Roadmap por fases (conforme documento de stack)

- **Fase 1 (MVP)** — Next.js + NestJS + PostgreSQL + Prisma + Auth JWT. ✅ *(este repositorio)*
- **Fase 2 (crescimento)** — Redis + BullMQ + S3.
- **Fase 3 (escala)** — Sentry + WAF + backups + React Native.
- **Fase 4 (enterprise)** — Keycloak + Kubernetes + microservicos.

## Adicionar um novo modulo/plugin

1. Adicionar o registo no catalogo (`packages/database/prisma/seed.ts` -> `MODULES`).
2. Backend: criar `apps/api/src/modules/<slug>` (ou `plugins/<slug>`) e decorar o controller com `@RequireModule('<slug>')`.
3. Frontend: adicionar a entrada em `apps/web/src/lib/nav.ts` com o `module: '<slug>'`.
4. Ativar o modulo por organizacao na pagina **Modulos** do backoffice.

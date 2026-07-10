# Desenvolvimento local — ClubOS

Guia rápido para arrancar, testar e operar o ambiente local (Windows / PowerShell).

---

## URLs

| Serviço       | URL                              |
| ------------- | -------------------------------- |
| Frontend      | http://localhost:3000            |
| API           | http://localhost:4000/api        |
| Health        | http://localhost:4000/api/health |
| Swagger       | http://localhost:4000/api/docs   |
| MinIO console | http://localhost:9001            |

---

## Arranque (primeira vez)

```powershell
cd C:\Projetos_WEB\ClubOS

pnpm install
Copy-Item .env.example .env
# Editar .env: DATABASE_URL, BETTER_AUTH_SECRET, SEED_DEMO_PASSWORD, SMTP se necessário

pnpm docker:up          # Postgres + Redis + MinIO
pnpm db:generate
pnpm db:push
pnpm db:seed            # catálogo + orgs + pnpm --filter @clubos/api seed:users

pnpm dev                # API :4000 + Web :3000
```

> **Infra:** só precisas de `pnpm docker:up` se Postgres, Redis ou MinIO não estiverem a correr.

---

## Arranque (dia a dia)

```powershell
cd C:\Projetos_WEB\ClubOS

# 1. Infra (só se Redis/MinIO/Postgres não estiverem a correr)
pnpm docker:up

# 2. Arrancar API + Web
pnpm dev
```

Reinicia `pnpm dev` depois de instalar novas dependências na API (ex.: `xlsx`, `@nestjs/schedule`).

---

## Credenciais demo

Defina **`SEED_DEMO_PASSWORD`** no `.env` local **antes** de `pnpm db:seed`.  
Todas as contas abaixo usam essa mesma password (ver `apps/api/src/scripts/seed-users.ts`).

| Role                  | Email                      |
| --------------------- | -------------------------- |
| Imperador             | `pedropinho364@gmail.com`  |
| Imperador (2.ª conta) | `joao.imperador@clubos.pt` |
| Administrador         | `admin@crcvale.pt`         |
| Tesoureiro            | `tesoureiro@crcvale.pt`    |
| Sócio (portal)        | `joao@example.com`         |

> **Nunca commitar** `.env` com passwords reais. As passwords que usas localmente ficam só no teu `.env`.

---

## Lembretes de quota

Requer **Redis** a correr (`pnpm docker:up`).

```powershell
# Manual (fora do cron)
pnpm --filter @clubos/api reminders:run

# Cron automático: REMINDERS_ENABLED=true no .env (09:00 diário)
```

---

## Base de dados

```powershell
# Seed completo (catálogo + utilizadores)
pnpm db:seed

# Só utilizadores (após seed do catálogo)
pnpm --filter @clubos/api seed:users

# Backup
pnpm db:backup
# -> backups/clubos-YYYYMMDD-HHMMSS.dump

# Restore (substitui dados da BD clubos)
pnpm db:restore -- backups/clubos-20260708-120000.dump
```

---

## Testes

### API (unit + E2E HTTP)

```powershell
pnpm --filter @clubos/api test
pnpm --filter @clubos/api test:unit
pnpm --filter @clubos/api test:e2e
```

Requer `DATABASE_URL` e, para a maioria dos E2E, `pnpm db:seed` já corrido.

### Web (Playwright)

Requer `pnpm db:seed`, Redis para o teste de pagamentos.

**Opção A — Playwright arranca API + Web** (após build; sem `pnpm dev`):

```powershell
pnpm --filter @clubos/api build
pnpm --filter @clubos/web build
Remove-Item Env:E2E_SKIP_WEBSERVER -ErrorAction SilentlyContinue
pnpm --filter @clubos/web test:e2e
```

**Opção B — Com `pnpm dev` já a correr** (recomendado no dia a dia):

```powershell
# Terminal 1
pnpm dev

# Terminal 2 — opcional: evitar rate limit nos testes de login
# RATE_LIMIT_AUTH_PER_MIN=1000 no .env
$env:E2E_SKIP_WEBSERVER="true"
pnpm --filter @clubos/web test:e2e
```

### Validação local (antes de PR / deploy)

```powershell
pnpm --filter @clubos/api test
pnpm --filter @clubos/api build
pnpm --filter @clubos/web build
pnpm --filter @clubos/web test:e2e
```

---

## Referência rápida

| Comando                                   | Descrição                         |
| ----------------------------------------- | --------------------------------- |
| `pnpm dev`                                | API + Web em modo desenvolvimento |
| `pnpm docker:up`                          | Postgres, Redis, MinIO            |
| `pnpm db:seed`                            | Dados demo + utilizadores         |
| `pnpm db:backup`                          | Dump PostgreSQL                   |
| `pnpm --filter @clubos/api reminders:run` | Lembretes manuais                 |
| `pnpm --filter @clubos/api test`          | Testes API                        |
| `pnpm --filter @clubos/web test:e2e`      | Testes Playwright                 |

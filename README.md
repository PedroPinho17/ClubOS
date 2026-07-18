# ClubOS

Plataforma **SaaS modular multi-tenant** para gestao de organizacoes (clubes, academias, associacoes, escolas). Uma unica aplicacao e base de dados servem todos os clientes; cada cliente e uma **Organization** (tenant). As funcionalidades sao entregues como **modulos** que se ativam por organizacao.

> **Documentacao para desenvolvedores:** [docs/README.md](docs/README.md) — arquitectura, API, frontend, base de dados, auth/RBAC e convencoes (estilo Javadoc/TSDoc).
> **Contribuir:** [CONTRIBUTING.md](CONTRIBUTING.md) · **Decisoes:** [docs/adr/](docs/adr/) · **Alteracoes:** [CHANGELOG.md](CHANGELOG.md) · **Seguranca:** [SECURITY.md](SECURITY.md)

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

### Multi-organizacao (memberships)

Um utilizador staff pode pertencer a **varias organizacoes** via tabela `OrganizationMember` (N:N). A organizacao em que trabalha e a **organizacao activa**, guardada na sessao (`Session.activeOrganizationId`) e cookie `clubos_active_org`, validada em cada pedido API.

| Cenario                        | Comportamento                                  |
| ------------------------------ | ---------------------------------------------- |
| Imperador com 2+ orgs          | Selector na sidebar; so ve orgs com membership |
| Org partilhada (2 imperadores) | Cada um tem `OrganizationMember` na mesma org  |
| Admin / tesoureiro             | Normalmente 1 membership; sem selector         |
| Socio (portal)                 | Org implicita via `Member.userId`              |

Endpoints:

- `GET /api/me/organizations` — orgs do utilizador
- `POST /api/me/active-organization` — troca org activa
- `POST /api/organizations` — criar org (imperador) + memberships

## Stack

| Camada          | Tecnologia                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------ |
| Frontend        | Next.js 16 + React 19 + shadcn/ui + Tailwind                                               |
| Data fetching   | TanStack Query                                                                             |
| Backend         | NestJS 11 (modular)                                                                        |
| ORM / BD        | **Prisma + PostgreSQL**                                                                    |
| Cache/filas     | Redis + BullMQ _(preparado)_                                                               |
| Ficheiros       | S3 / MinIO _(em uso: logotipos, fotos)_                                                    |
| Auth            | **Better Auth** (email+password, passkey/WebAuthn, roles/admin)                            |
| PWA             | Manifest Next.js + service worker (`/sw.js`)                                               |
| Testes          | Vitest (API, unitarios)                                                                    |
| Observabilidade | Sentry (activo com `SENTRY_DSN`) + uptime externo ([UptimeRobot](docs/OBSERVABILIDADE.md)) |
| Deploy          | Docker / Coolify                                                                           |

## Estado do projeto

### Checklist (ordem sugerida inicial)

| #   | Tarefa                                                                       | Estado                    |
| --- | ---------------------------------------------------------------------------- | ------------------------- |
| 1   | Actualizar README (Postgres, Better Auth, feito vs preparado, sem passwords) | ✅                        |
| 2   | Testes (unit + E2E auth API)                                                 | ✅ ver secao Testes       |
| 3   | Import Excel (paridade `gestao_socios`)                                      | ✅                        |
| 4   | Limpar nav (`/events`, `/documents`, `/football`)                            | ✅                        |
| 5   | Paridade quotas (CRC Vale: plano + pagamentos + situacao)                    | ✅ suficiente para o Vale |
| 6   | Nao migrar CRC Vale ainda (1–2 meses em paralelo)                            | ⏳ decisao de produto     |

### Implementado (MVP V1)

| Area            | Funcionalidade                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Auth            | Better Auth — email+password, passkey, roles (`imperador`, `administrador`, `tesoureiro`, `socio`) |
| Multi-tenant    | `organizationId` por linha + `OrganizationMember` N:N + org activa na sessao                       |
| Core            | Organizacoes, utilizadores, convites, auditoria, definicoes (nome, cor, logotipo)                  |
| Membros         | CRUD, foto, quota em tempo real, **import/export Excel**, **import dry-run com painel de erros**   |
| Planos          | Quotas por periodicidade (mensal, trimestral, etc.)                                                |
| Pagamentos      | Registo, recibos PDF (fila BullMQ), estado de emissao                                              |
| Cartoes         | Layout CRC Vale, export PNG/PDF em lote, QR assinado                                               |
| Comunicacoes    | Email em massa (fila) + **WhatsApp `wa.me`** (links por socio)                                     |
| Relatorios      | Overview, CSV generico, **pagantes / em atraso** (PDF + Excel)                                     |
| Portal socio    | Quotas, cartao, recibos PDF, concessao de acesso pelo admin                                        |
| Lembretes       | Cron diario 09:00, `QuotaReminderSent`, **emails HTML** a vencer + atraso                          |
| Observabilidade | **Sentry** API + Web + guia uptime ([docs/OBSERVABILIDADE.md](docs/OBSERVABILIDADE.md))            |
| Seguranca       | **Rate limit** login (`/api/auth`) e validacao QR publica                                          |
| Branding        | Logotipo na sidebar + titulo/favicon dinamicos por organizacao                                     |
| PWA             | Instalavel no telemovel (manifest + cache de assets estaticos)                                     |
| Nav             | Apenas rotas com paginas reais (`apps/web/src/lib/nav.ts`)                                         |
| Deploy          | `Dockerfile.api`, `Dockerfile.web`, `docker-compose.prod.yml`                                      |

### Preparado (infra / catalogo, sem UI ou logica completa)

| Area                         | Estado                                                 |
| ---------------------------- | ------------------------------------------------------ |
| Redis + MinIO                | `docker-compose.yml`; Redis usado em lembretes e filas |
| BullMQ                       | Recibos PDF + comunicacoes + lembretes                 |
| Plugins (football, padel, …) | Registados no seed; **zero codigo** de modalidade      |
| OAuth Google/GitHub          | Variaveis no `.env.example`; opcional                  |

### Por fazer

| Funcionalidade                 | Notas                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| **Paridade quotas (CRC Vale)** | ✅ Planos mensal/anual, atribuicao ao socio, pagamentos, badges, relatorios, lembretes |
| **Eventos / Documentos**       | Modulos futuros — **nao estao no menu**                                                |
| **Testes e2e API**             | ✅ Vitest HTTP (`apps/api/test/e2e`)                                                   |
| **Testes e2e Web**             | ✅ Playwright — login, membros, import, public, **portal**, **pagamentos**             |
| **Migracao CRC Vale**          | Aguardar 1–2 meses; manter `gestao_socios` em producao                                 |
| **PWA offline**                | V1 so cache estatico; paginas e API precisam de rede                                   |
| **Domínios custom / billing**  | Fora do scope MVP (ex.: `app.clubos.pt`, Stripe)                                       |

### Proximos passos (ordem sugerida)

1. **CRC Vale** — validar em paralelo; nao migrar ate o ClubOS amadurecer (1–2 meses).
2. **Testes e2e** — API: `crc-vale-flow`, RBAC, import. Web Playwright: login, import, **portal**, **pagamentos**. ✅
3. **Plugins** — primeira modalidade quando houver cliente.
4. **Quotas avancadas** _(opcional)_ — dia fixo de vencimento, alerta "a vencer em X dias" (extras do Laravel).

---

## Membros: import, export e relatorios

Paridade com `gestao_socios` — modelo Excel de **14 colunas** (socio + linhas de pagamento).

| Accao               | Endpoint / UI                                                              |
| ------------------- | -------------------------------------------------------------------------- |
| Modelo importacao   | `GET /api/members/import/template`                                         |
| Importar            | `POST /api/members/import` (multipart: `file`, `updateExisting`, `dryRun`) |
| Exportar todos      | `GET /api/members/export` → `socios_YYYY-MM-DD.xlsx`                       |
| Pagantes PDF/Excel  | `GET /api/reports/members/paying.pdf` / `.csv`                             |
| Em atraso PDF/Excel | `GET /api/reports/members/overdue.pdf` / `.csv`                            |

UI em **Membros**:

- **Importar / Exportar** — modelo, simulacao dry-run com **painel de erros por linha**, import real, export completo
- **Relatorios de quota** — pagantes e em atraso (imperador, administrador, tesoureiro)

---

## Comunicacoes e WhatsApp (`wa.me`)

Paridade com `gestao_socios` — **nao envia WhatsApp automaticamente**; gera links para o operador abrir um a um.

### De onde vêm os numeros

| Origem         | Campo ClubOS                      | Coluna Excel import                |
| -------------- | --------------------------------- | ---------------------------------- |
| Ficha do socio | `Member.phone`                    | **Telefone**                       |
| Normalizacao   | 9 digitos PT → prefixo `351`      | Igual ao Laravel                   |
| Link           | `https://wa.me/{digits}?text=...` | Mensagem com «Olá {nome},» + texto |

So entram socios da **organizacao activa** com telemovel valido (audiencia seleccionada). Quem nao tem telefone ou tem numero invalido fica de fora — o preview mostra a contagem antes de gerar.

### Audiencias (iguais ao email)

| Audiencia | Quem inclui                            |
| --------- | -------------------------------------- |
| `ALL`     | Todos os socios da org (com telemovel) |
| `ACTIVE`  | So `status = ACTIVE`                   |
| `OVERDUE` | Quota em atraso                        |
| `PLAN`    | Socios do plano escolhido              |

### API / UI

| Accao                 | Onde                                                              |
| --------------------- | ----------------------------------------------------------------- |
| Preview destinatarios | `GET /api/communications/preview/whatsapp?audience=...`           |
| Gerar links           | `POST /api/communications/whatsapp` `{ body, audience, planId? }` |
| UI                    | **Comunicacoes → WhatsApp → Gerar links**                         |

> Envio automatico em massa por WhatsApp/SMS exige fornecedor pago (Twilio/Meta). O `wa.me` e gratuito e semi-manual.

---

## Lembretes automaticos

### Settings por organizacao (Definicoes → Lembretes de quota)

| Setting          | Chave                   | Default |
| ---------------- | ----------------------- | ------- |
| Dias de aviso    | `dias_aviso_quota`      | 7       |
| Lembretes on/off | `lembretes_automaticos` | false   |

### Job diario (cron 09:00)

Para cada org com lembretes activos:

- Socios activos com plano + email
- `nextDueDate` nos proximos X dias → email **«A sua quota vence em…»** (`DUE_SOON`)
- Quota em atraso → email **«Quota em atraso»** (`OVERDUE`)
- Registo em `QuotaReminderSent` (member + vencimento + tipo) — sem reenvio

### Servidor

| Variavel                          | Descricao                               |
| --------------------------------- | --------------------------------------- |
| `REMINDERS_ENABLED=true`          | Activa cron diario 09:00                |
| `REMINDERS_CRON`                  | Opcional; override do schedule          |
| `HEALTHCHECK_QUOTA_REMINDERS_URL` | Ping Healthchecks.io apos cada execucao |
| SMTP configurado                  | Envio real; sem SMTP → apenas log       |

Execucao manual:

```powershell
pnpm --filter @clubos/api reminders:run
# ou POST /api/reminders/run (autenticado)
```

Badge **A vencer** na lista de membros quando faltam ≤ X dias para o vencimento.

---

## Portal do socio

| Endpoint                               | Descricao                                    |
| -------------------------------------- | -------------------------------------------- |
| `GET /api/portal/me`                   | Dados do socio, quota, pagamentos, cartao    |
| `GET /api/portal/payments/:id/receipt` | Recibo PDF (so pagamentos PAID)              |
| `POST /api/portal/access/:memberId`    | Admin cria conta + envia password temporaria |

Frontend: `/portal` (role `socio`). Concessao de acesso em **Membros → Acesso portal**.

---

## PWA

- Manifest: `apps/web/src/app/manifest.ts` (servido automaticamente pelo Next.js)
- Service worker: `apps/web/public/sw.js` (cache de icones e assets estaticos)
- Registo: `PwaRegister` no layout raiz
- Instalar: Chrome → menu → **Instalar aplicacao** (util em telemovel para o portal)

Limitacao V1: sem offline para dados dinamicos nem push notifications.

---

## Quotas (CRC Vale)

Modelo operacional ja suportado — sem portar o `QuotaService` completo do Laravel:

| Passo                           | Onde                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| Criar planos (mensal, anual, …) | **Planos** (`/membership-plans`)                                    |
| Atribuir plano ao socio         | **Membros** — criar/editar, campo plano                             |
| Registar pagamentos             | **Pagamentos** ou import Excel                                      |
| Ver situacao                    | Badges **Em dia** / **Em atraso** / **Pendente** / **Sem plano**    |
| Relatorios                      | **Membros → Relatorios de quota** (pagantes / em atraso, PDF/Excel) |
| Lembretes email                 | Cron com `REMINDERS_ENABLED=true`                                   |

Calculo: ultimo pagamento (ou data de adesao) + periodicidade do plano. Validade manual do cartao pode prolongar "em dia".

Extras do `gestao_socios` **nao implementados** (opcionais): vencimento dia fixo do mes.

Estado **A vencer** (`due_soon`) e lembretes por email X dias antes do vencimento — ver [Lembretes automaticos](#lembretes-automaticos).

---

## Testes

```powershell
# Unit + E2E (requer Postgres acessivel via DATABASE_URL)
pnpm --filter @clubos/api test
```

### Unitarios (`src/**/*.spec.ts`)

| Ficheiro                           | Cobertura                              |
| ---------------------------------- | -------------------------------------- |
| `quota.util.spec.ts`               | Calculo de situacao de quota           |
| `member-import-*.spec.ts`          | Mapa de colunas e parsing Excel        |
| `member-export-rows.spec.ts`       | Linhas de exportacao (round-trip)      |
| `member-quota-report.util.spec.ts` | Dias em atraso nos relatorios          |
| `module.guard.spec.ts`             | Modulo activo / core / forbidden       |
| `portal.service.spec.ts`           | `getMe`, `getReceipt`, `grantAccess`   |
| `whatsapp.util.spec.ts`            | Normalizacao telefone PT + URL `wa.me` |
| `org-reminder-settings.spec.ts`    | Settings de lembretes por org          |
| `member-gdpr.service.spec.ts`      | Detecao de membro apagado RGPD         |

### E2E HTTP (`test/e2e/*.e2e-spec.ts`)

| Ficheiro                       | Cobertura                                                            |
| ------------------------------ | -------------------------------------------------------------------- |
| `auth.e2e-spec.ts`             | Sign-up, sign-in, sign-out, rota protegida sem sessao                |
| `protected-routes.e2e-spec.ts` | `/api/members` com org activa; `/api/validate` publico               |
| `auth-rate-limit.e2e-spec.ts`  | Rate limit em `/api/auth`                                            |
| `crc-vale-flow.e2e-spec.ts`    | **Fluxo negocio:** login → import dry-run → pagamento → portal socio |
| `member-gdpr.e2e-spec.ts`      | Export RGPD JSON + anonimizacao de dados pessoais                    |
| `rbac-isolation.e2e-spec.ts`   | Socio bloqueado no backoffice + isolamento entre orgs                |

Os E2E saltam automaticamente se `DATABASE_URL` nao estiver disponivel. `protected-routes` e `crc-vale-flow` assumem `pnpm db:seed` ja corrido (org `crc-vale`).

**CI (GitHub Actions):** `.github/workflows/ci.yml` — Postgres + Redis, seed, typecheck, build web, testes em cada push/PR.

```powershell
pnpm --filter @clubos/api test:unit   # 45 testes
pnpm --filter @clubos/api test:e2e    # 14 testes HTTP
pnpm --filter @clubos/api test        # ambos (61+ no total)
```

### Playwright (`apps/web/e2e/*.spec.ts`)

Requer `pnpm db:seed`, `seed:users` e **Redis** (`docker compose up -d redis`) para o teste de pagamentos.

| Ficheiro                 | Cobertura                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `login.spec.ts`          | Login valido + credenciais invalidas                       |
| `members.spec.ts`        | Lista de socios + navegacao                                |
| `import-dry-run.spec.ts` | Simulacao de import Excel + painel de resultado            |
| `portal.spec.ts`         | Portal do socio (quota, pagamentos, isolamento backoffice) |
| `payments.spec.ts`       | Registar pagamento no backoffice                           |
| `public.spec.ts`         | `/privacidade` e `/dpa`                                    |

```powershell
# Opcao A — Playwright arranca API+Web (apos build; sem pnpm dev)
pnpm --filter @clubos/api build
pnpm --filter @clubos/web build
Remove-Item Env:E2E_SKIP_WEBSERVER -ErrorAction SilentlyContinue
pnpm --filter @clubos/web test:e2e

# Opcao B — Com pnpm dev (e Redis opcional) ja a correr noutro terminal
# Recomendado para E2E: aumentar rate limit de auth no .env local
# RATE_LIMIT_AUTH_PER_MIN=1000
pnpm dev
# noutro terminal:
$env:E2E_SKIP_WEBSERVER="true"
pnpm --filter @clubos/web test:e2e
```

**CI:** Playwright corre apos build API/Web, com Chromium headless.

---

## Backups (PostgreSQL)

Scripts em `scripts/` — formato `pg_dump -Fc` (`.dump`).

```powershell
# Backup (Docker clubos-postgres ou pg_dump + DATABASE_URL)
pnpm db:backup
# -> backups/clubos-YYYYMMDD-HHMMSS.dump

# Restore (substitui dados da BD clubos)
pnpm db:restore -- backups/clubos-20260708-120000.dump
```

**Producao:** agendar `backup-db.sh` via cron (diario) e testar restore num ambiente de staging mensalmente. Guardar dumps fora do servidor (S3, NAS).

---

## Autenticacao (Better Auth)

- Instancia em `apps/api/src/auth/auth.ts` (fonte unica de verdade).
- Rotas montadas em `/api/auth/*` via `@thallesp/nestjs-better-auth` (AuthGuard global).
- Metodos: **email + password** e **passkey / WebAuthn** (`@better-auth/passkey`).
- Roles (admin plugin): `imperador` (super admin), `administrador`, `tesoureiro`, `socio`.
  Endpoints protegidos com `@Roles([...])`; modulos com `@RequireModule('slug')` + `ModuleGuard`.

### Variaveis de ambiente essenciais

Copiar `.env.example` → `.env`. **Nunca commitar** `.env` com segredos reais.

| Variavel                                 | Uso                                                |
| ---------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                           | PostgreSQL                                         |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Sessoes e auth                                     |
| `WEB_ORIGIN`                             | CORS + links em emails                             |
| `NEXT_PUBLIC_API_URL`                    | Frontend → API                                     |
| `REDIS_*`                                | Filas, lembretes, dedupe                           |
| `S3_*` / MinIO                           | Logotipos, fotos, recibos                          |
| `SMTP_*`                                 | Emails (portal, lembretes, comunicacoes)           |
| `QR_SIGNING_SECRET`                      | QR de validacao de cartoes                         |
| `REMINDERS_ENABLED`                      | Lembretes automaticos                              |
| `RATE_LIMIT_AUTH_PER_MIN`                | Limite pedidos/min em `/api/auth` (default 15)     |
| `RATE_LIMIT_VALIDATE_PER_MIN`            | Limite pedidos/min em `/api/validate` (default 60) |
| `RATE_LIMIT_STORE`                       | `redis` (prod) ou `memory` (local/E2E)             |
| `TRUST_PROXY`                            | Confiar no proxy para IP (`true` por omissão)      |

---

## RGPD (baseline)

- **Export:** `GET /api/members/:id/gdpr-export` — JSON com dados do socio, plano e pagamentos (imperador/administrador).
- **Apagamento:** `POST /api/members/:id/gdpr-erase` com `{ "confirm": true }` — anonimiza o membro, remove contactos/foto, desativa portal; mantem pagamentos para contabilidade.
- **UI:** area RGPD na edicao de membro + acao rapida de export na tabela (`/members`).
- **Paginas publicas:** `/privacidade` (politica modelo) e `/dpa` (acordo de tratamento modelo).
- **Auditoria:** acoes `member.gdpr_export` e `member.gdpr_erased` em `/audit`.

---

## Seguranca (baseline)

- **RBAC:** endpoints do backoffice exigem role `imperador`, `administrador` ou `tesoureiro`; portal socio limitado a `/api/portal/*`.
- **Isolamento multi-tenant:** org activa validada por membership (`OrganizationMember`) ou `Member` (socio).
- **Health:** `GET /api/health` (liveness) e `GET /api/ready` (PostgreSQL + Redis) — publicos, sem auth.
- **Sentry:** activo apenas com `SENTRY_DSN` (API: filtro global; Web: `@sentry/nextjs`). Sem DSN = zero impacto em dev/CI.
- **Uptime externo:** monitores HTTP em `/api/health`, `/api/ready` e `/login` — ver [docs/OBSERVABILIDADE.md](docs/OBSERVABILIDADE.md).

---

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

### Navegacao (frontend)

Itens em `apps/web/src/lib/nav.ts` — apenas modulos com pagina implementada:

Dashboard · Membros · Planos · Pagamentos · Cartoes · Comunicacoes · Relatorios · Auditoria · Definicoes · Modulos

**Removidos** ate existirem paginas: `/events`, `/documents`, `/football`.

---

## Como correr (desenvolvimento)

Pre-requisitos: Node 20+, pnpm 9+, Docker (Postgres + Redis + MinIO).

Guia completo com comandos do dia a dia, testes, backups e credenciais demo: **[docs/DESENVOLVIMENTO-LOCAL.md](docs/DESENVOLVIMENTO-LOCAL.md)**.

```powershell
pnpm install
Copy-Item .env.example .env   # SEED_DEMO_PASSWORD, BETTER_AUTH_SECRET, …
pnpm docker:up
pnpm db:generate && pnpm db:push && pnpm db:seed
pnpm dev
```

- API: http://localhost:4000/api — Swagger: http://localhost:4000/api/docs
- Web: http://localhost:3000
- MinIO console: http://localhost:9001

---

## Roadmap por fases (conforme documento de stack)

- **Fase 1 (MVP)** — Next.js + NestJS + PostgreSQL + Prisma + Better Auth. ✅ _(este repositorio)_
- **Fase 2 (crescimento)** — Redis + BullMQ + S3. 🟡 _(parcialmente em uso)_
- **Fase 3 (escala)** — Sentry + WAF + backups + React Native.
- **Fase 4 (enterprise)** — Keycloak + Kubernetes + microservicos.

---

## Adicionar um novo modulo/plugin

1. Adicionar o registo no catalogo (`packages/database/prisma/seed.ts` → `MODULES`).
2. Backend: criar `apps/api/src/modules/<slug>` (ou `plugins/<slug>`) e decorar o controller com `@RequireModule('<slug>')`.
3. Frontend: adicionar a entrada em `apps/web/src/lib/nav.ts` com o `module: '<slug>'` **e criar a pagina**.
4. Ativar o modulo por organizacao na pagina **Modulos** do backoffice.

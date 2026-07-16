# API Backend (NestJS)

Base URL em desenvolvimento: `http://localhost:4000/api`

> **Fonte de verdade dos endpoints:** Swagger em [http://localhost:4000/api/docs](http://localhost:4000/api/docs) (rotas, DTOs, auth).  
> Este documento é o **mapa de módulos e responsabilidades** — não precisa de listar todos os campos de cada DTO.

## Estrutura de pastas

```
apps/api/src/
├── auth/           # Instância Better Auth (fonte única)
├── common/         # Guards, decorators, org context, roles
├── core/           # Plataforma (orgs, users, audit, health, me)
├── modules/        # Negócio activável (members, payments, …)
├── prisma/         # PrismaModule (inject PrismaService)
├── redis/          # Cliente Redis
├── storage/        # S3/MinIO
└── main.ts         # Entry point
```

## Core

### Health — `HealthController`

| Método | Rota          | Auth    | Descrição                    |
| ------ | ------------- | ------- | ---------------------------- |
| GET    | `/api/health` | Público | Liveness                     |
| GET    | `/api/ready`  | Público | Readiness (Postgres + Redis) |

### Organizations — `OrganizationsController` (`/api/organization`)

Requer org activa (`@OrgId()`). Roles: `@StaffOnly` leitura, `@AdminOnly` escrita.

| Método | Rota        | Descrição                    |
| ------ | ----------- | ---------------------------- |
| GET    | `/`         | Perfil da org activa         |
| GET    | `/logo`     | Logotipo binário             |
| PATCH  | `/`         | Actualizar nome, cor, locale |
| POST   | `/logo`     | Upload logotipo              |
| GET    | `/settings` | Settings key/value           |
| PUT    | `/settings` | Upsert setting               |

### Organizations list — `OrganizationsListController` (`/api/organizations`)

`@NoOrgContext()` — não exige tenant. `@ImperadorOnly()`.

| Método | Rota | Descrição               |
| ------ | ---- | ----------------------- |
| GET    | `/`  | Listar todas as orgs    |
| POST   | `/`  | Criar org + memberships |

### Me — `MeController` (`/api/me`)

`@NoOrgContext()` — gestão de memberships do utilizador.

| Método | Rota                   | Descrição                           |
| ------ | ---------------------- | ----------------------------------- |
| GET    | `/organizations`       | Orgs a que o user tem acesso        |
| POST   | `/active-organization` | Trocar org activa (sessão + cookie) |

### Users — `UsersController` (`/api/users`)

`@AdminOnly()`. Convites de staff na org activa.

### Modules — `ModulesController` (`/api/modules`)

| Método | Rota       | Role      | Descrição                 |
| ------ | ---------- | --------- | ------------------------- |
| GET    | `/`        | Staff     | Catálogo + estado por org |
| GET    | `/enabled` | Staff     | Slugs activos             |
| PUT    | `/:slug`   | Imperador | Activar/desactivar módulo |

### Audit — `AuditController` (`/api/audit`)

`@AdminOnly()`. Lista acções auditadas na org.

## Módulos de negócio

Todos usam `@OrgId()` e `@RequireModule('slug')` + `ModuleGuard` (excepto onde indicado).

### Dashboard — `dashboard`

| GET | `/api/dashboard/stats` | KPIs (membros, pagamentos, receita) |

### Members — `members`

| Método | Rota               | Role  | Descrição                   |
| ------ | ------------------ | ----- | --------------------------- |
| GET    | `/`                | Staff | Listar sócios               |
| GET    | `/:id`             | Staff | Detalhe                     |
| POST   | `/`                | Admin | Criar                       |
| PATCH  | `/:id`             | Admin | Actualizar                  |
| DELETE | `/:id`             | Admin | Remover                     |
| POST   | `/:id/photo`       | Admin | Foto                        |
| GET    | `/import/template` | Admin | Modelo Excel                |
| POST   | `/import`          | Admin | Importar (dry-run opcional) |
| GET    | `/export`          | Staff | Exportar Excel              |
| GET    | `/:id/gdpr-export` | Admin | Export RGPD                 |
| POST   | `/:id/gdpr-erase`  | Admin | Apagar dados pessoais       |

**Import Excel** — orquestrado por `MemberImportService`; ver `import/`:

- `import-row-validator.ts` — validação pura
- `import-member-upsert.ts` — upsert sócio
- `import-payment-upsert.ts` — pagamentos
- `import-dry-run.ts` — simulação sem gravar

### Membership plans — `membership-plans`

CRUD de planos de quota (`QuotaPlan`).

### Payments — `payments`

Registo de pagamentos, recibos PDF (fila BullMQ).

### Cards — `cards`

Layout de cartão, QR assinado, settings por org. `@AdminOnly()`.

### QR Validation — `validate`

| GET | `/api/validate/:memberId` | Público (rate limit) | Validar cartão |

### Communications — `communications`

Emails em massa (fila) + links WhatsApp. `@AdminOnly()`.

### Reports — `reports`

Overview, CSV, PDF/Excel pagantes e em atraso.

### Portal — `member-portal`

| Rota                                   | Role  | Descrição              |
| -------------------------------------- | ----- | ---------------------- |
| GET `/api/portal/me`                   | socio | Dados do sócio         |
| GET `/api/portal/payments/:id/receipt` | socio | Recibo PDF             |
| POST `/api/portal/access/:memberId`    | Admin | Conceder acesso portal |

### Reminders — `reminders`

| POST | `/api/reminders/run` | Admin | Disparo manual de lembretes de quota |

Cron automático: `RemindersScheduler` (09:00 se `REMINDERS_ENABLED=true`).

## Auth (Better Auth)

Rotas em `/api/auth/*` — não são controllers NestJS.

Configuração: `apps/api/src/auth/auth.ts`

## Infra partilhada (`common/`)

| Ficheiro                          | Função                                     |
| --------------------------------- | ------------------------------------------ |
| `organization-context.guard.ts`   | Resolve org activa; 403 se inválida        |
| `organization-context.service.ts` | Lógica de resolução e membership           |
| `module.guard.ts`                 | Verifica módulo activo                     |
| `decorators.ts`                   | `@OrgId`, `@CurrentUser`, `@RequireModule` |
| `decorators/no-org-context.ts`    | `@NoOrgContext()`                          |
| `decorators/roles-shortcuts.ts`   | `@StaffOnly`, `@AdminOnly`, …              |
| `roles.ts`                        | Constantes `STAFF_ROLES`, `ADMIN_ROLES`, … |

## Testes

| Tipo     | Comando                               | Local              |
| -------- | ------------------------------------- | ------------------ |
| Unit     | `pnpm --filter @clubos/api test:unit` | `src/**/*.spec.ts` |
| E2E HTTP | `pnpm --filter @clubos/api test:e2e`  | `test/e2e/`        |

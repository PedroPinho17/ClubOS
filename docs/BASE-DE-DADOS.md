# Base de dados (Prisma)

Schema: `packages/database/prisma/schema.prisma`  
Cliente: `@clubos/database` → `packages/database/src/index.ts`

## Comandos

```bash
pnpm db:generate    # Gerar Prisma Client
pnpm db:migrate     # Criar/aplicar migration (dev) — caminho canónico
pnpm db:deploy      # Aplicar migrations existentes (CI / produção)
pnpm db:push        # Sync schema sem migration — só protótipos locais
pnpm db:seed        # Dados demo + módulos
pnpm db:studio      # UI visual
```

| Situação                                               | Comando                                                  |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Primeiro arranque / após pull com schema novo          | `pnpm db:migrate`                                        |
| Alteraste `schema.prisma` e queres commit da migration | `pnpm db:migrate` (cria ficheiro em `prisma/migrations`) |
| Produção / Coolify                                     | `pnpm db:deploy`                                         |
| Experimento local sem gravar migration                 | `pnpm db:push` (não usar em PRs)                         |

## Diagrama simplificado

```
User ──┬── Session (activeOrganizationId)
       ├── OrganizationMember ── Organization
       ├── Member (portal, 0..1)
       └── Passkey

Organization ──┬── Member ── QuotaPlan
               ├── Payment
               ├── OrganizationModule ── Module
               ├── OrganizationSetting
               ├── Communication
               └── AuditLog
```

## Modelos por área

### Autenticação (Better Auth)

| Modelo         | Descrição                                  |
| -------------- | ------------------------------------------ |
| `User`         | Conta de login; `role` global              |
| `Session`      | Sessão; `activeOrganizationId` para tenant |
| `Account`      | Credenciais OAuth/password                 |
| `Verification` | Tokens de verificação email                |
| `Passkey`      | Credenciais WebAuthn                       |

### Core multi-tenant

| Modelo                | Descrição                            |
| --------------------- | ------------------------------------ |
| `Organization`        | Tenant (nome, slug, branding, plano) |
| `OrganizationMember`  | Staff N:N user ↔ org                 |
| `OrganizationSetting` | KV por org (ex.: lembretes)          |
| `Module`              | Catálogo global de módulos           |
| `OrganizationModule`  | Módulo activo por org                |
| `AuditLog`            | Trilho de auditoria                  |

### Negócio

| Modelo              | Descrição                                     |
| ------------------- | --------------------------------------------- |
| `Member`            | Sócio do clube; opcional `userId` para portal |
| `QuotaPlan`         | Plano de quota (valor, periodicidade)         |
| `Payment`           | Pagamento registado                           |
| `QuotaReminderSent` | Dedup de emails de lembrete                   |
| `Communication`     | Campanha de email em massa                    |

## Enums importantes

| Enum                 | Valores                       |
| -------------------- | ----------------------------- |
| `MemberStatus`       | ACTIVE, INACTIVE              |
| `PaymentStatus`      | PENDING, PAID, …              |
| `Periodicity`        | MONTHLY, QUARTERLY, ANNUAL, … |
| `ModuleCategory`     | CORE, BASE, PLUGIN            |
| `OrganizationStatus` | ACTIVE, SUSPENDED, …          |

## Regras de isolamento

1. **Toda query de negócio** deve filtrar por `organizationId` obtido do guard — nunca do body do cliente.
2. **Cascade**: apagar `Organization` remove membros, pagamentos, etc. (ver `onDelete` no schema).
3. **Sócio**: um `Member` pode ligar a um `User`; a org do sócio vem do `Member`, não do header.

## Seed

`packages/database/prisma/seed.ts` cria:

- Catálogo de módulos (CORE + BASE)
- Organização demo **CRC Vale** (`slug: crc-vale`)
- Planos de quota, sócios exemplo

Utilizadores: `apps/api/src/scripts/seed-users.ts` (password em `SEED_DEMO_PASSWORD`).

## Convenções Prisma

Ver regra do workspace: IDs, `@relation` dos dois lados, `createdAt`/`updatedAt`, índices em campos frequentes.

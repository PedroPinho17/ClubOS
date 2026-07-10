# Documentação ClubOS

Guia para desenvolvedores — equivalente ao **Javadoc** neste stack TypeScript/NestJS/Next.js.

## Índice

| Documento                                         | Conteúdo                                               |
| ------------------------------------------------- | ------------------------------------------------------ |
| [Arquitetura](ARQUITETURA.md)                     | Visão geral, monorepo, multi-tenancy, fluxo de pedidos |
| [API Backend](API-BACKEND.md)                     | Módulos NestJS, endpoints, guards, serviços            |
| [Frontend Web](FRONTEND.md)                       | Rotas Next.js, layouts, auth client, navegação         |
| [Base de dados](BASE-DE-DADOS.md)                 | Modelos Prisma, relações, isolamento por tenant        |
| [Autenticação e RBAC](AUTENTICACAO-RBAC.md)       | Better Auth, roles, org activa, decorators             |
| [Convenções](CONVENCOES.md)                       | Como adicionar módulos, testes, TSDoc                  |
| [Observabilidade](OBSERVABILIDADE.md)             | Alertas Sentry, uptime externo, go-live                |
| [Desenvolvimento local](DESENVOLVIMENTO-LOCAL.md) | Arranque, credenciais demo, testes, backups            |

## Início rápido

```bash
pnpm install
cp .env.example .env          # editar segredos locais
pnpm docker:up                # Postgres + Redis + MinIO
pnpm db:migrate && pnpm db:seed
pnpm dev                      # API :4000 + Web :3000
```

## Onde está o quê

```
ClubOS/
├── apps/api/          → Backend NestJS (@clubos/api)
├── apps/web/          → Frontend Next.js (@clubos/web)
├── packages/database/ → Prisma schema + client (@clubos/database)
├── docs/              → Esta documentação
└── scripts/           → Backup DB, fixtures E2E
```

## Comentários no código (TSDoc)

Funções e classes públicas usam **TSDoc** (`/** ... */`), o equivalente ao Javadoc:

- `@param` — parâmetro de entrada
- `@returns` — valor de retorno
- `@throws` — excepções possíveis
- `@example` — uso típico

Procura comentários em:

- `apps/api/src/common/**` — infra partilhada (guards, decorators)
- `apps/api/src/auth/**` — configuração Better Auth
- `apps/web/src/lib/**` — cliente API e auth
- Cabeçalhos `/** @module ... */` nos serviços principais

## Glossário rápido

| Termo            | Significado                                                 |
| ---------------- | ----------------------------------------------------------- |
| **Organization** | Tenant (clube, ginásio, associação)                         |
| **Org activa**   | Organização em que o staff trabalha nesta sessão            |
| **Módulo**       | Funcionalidade activável por org (`members`, `payments`, …) |
| **Staff**        | imperador, administrador ou tesoureiro (backoffice)         |
| **Sócio**        | Utilizador do portal (`role: socio`)                        |
| **Imperador**    | Super-admin da plataforma; gere várias orgs                 |

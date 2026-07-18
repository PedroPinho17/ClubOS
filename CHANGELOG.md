# Changelog

Todas as alterações relevantes do ClubOS são documentadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projecto tenta aderir a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Documentação: ADRs 001–005 (Better Auth, papel efectivo, rate limit Redis, monorepo, Prisma/Postgres), `SECURITY.md`, `DEMO-TUNNEL.md`
- Análise UML: actores/casos de uso, diagramas de actividade e sequência (`docs/analise/`)
- Diagramas UML clássicos em PNG (PlantUML): casos de uso, sequência, actividade
- Pacote `@clubos/shared` — roles, `PaginatedResult` e tipos de domínio críticos API ↔ Web
- Query DTOs validados para listagens (members, payments, audit)
- Unit tests de isolamento por org: `members.service`, `payments.service`
- Reset de password por email (`/recuperar-password`, `/reset-password`) + template SMTP
- Rate limit Redis partilhado + `TRUST_PROXY` / `TRUST_PROXY_HOPS` (ADR 003)
- Husky: hook `commit-msg` remove atribuição Cursor (`Co-authored-by` / `Made-with`)
- Guias de ajuda no backoffice e formulário de settings de cartões
- Bootstrap da org activa e papel efectivo por organização (API + web)
- Testes E2E: recuperar password, settings/help, reforço RBAC / multi-org
- Onboarding: dialog **Novo clube** (Imperador, Módulos) + checklist «Primeiros passos» alargado
- Docs operacionais: [Como adicionar um clube](docs/COMO-ADICIONAR-CLUBE.md), [Import Excel — erros](docs/IMPORT-EXCEL-ERROS.md), [FAQ CRC Vale](docs/FAQ-CRC-VALE.md)
- `CONTRIBUTING.md` + changelog Keep a Changelog

### Changed

- Stack documentada: Next.js 16 (alinhado com `apps/web`)
- Caminho canónico de BD em docs: `pnpm db:migrate` (dev) / `pnpm db:deploy` (prod); `db:push` só para protótipos
- `API-BACKEND.md` / `AUTENTICACAO-RBAC.md` / `OBSERVABILIDADE.md`: rate limit Redis, password reset, `@clubos/shared`
- UI: páginas `settings`, `cards`, `communications`, `payments`, `members`, `membership-plans` e `member-card` partidas em componentes/hooks
- UI polish (16–17 Jul): skeletons, dialogs Escape/foco, cartões responsivos, dark mode, a11y em audit/dashboard/members, empty/error/loading alinhados
- Web `lib/types` reexporta contratos de `@clubos/shared` (menos drift API↔Web)
- Runbook: secção de **prova de restore** com data da última execução

### Fixed

- (registar aqui correcções user-facing à medida que saem)

### Release hygiene

- Manter este ficheiro actualizado em cada release: mover itens de `[Unreleased]` para a secção `## [x.y.z] — AAAA-MM-DD` e etiquetar no GitHub.

---

### Notas 16–17 Jul 2026 (resumo da semana)

| Área       | O quê                                              |
| ---------- | -------------------------------------------------- |
| Rate limit | Store Redis + trust proxy (`e1df957`)              |
| UI         | Polish empty/error/loading + a11y staff routes     |
| Shared     | `@clubos/shared` + pagination DTOs                 |
| Auth       | Password reset por email                           |
| Tooling    | Husky `commit-msg` anti-atribuição Cursor          |
| Tests      | Unit isolation members/payments + rate-limit specs |

---

## [0.1.0] — 2026-07 — MVP V1 (piloto CRC Vale)

Primeira linha de base estável para corrida em paralelo com `gestao_socios`.

### Added

- Auth Better Auth: email/password, passkeys, roles (`imperador`, `administrador`, `tesoureiro`, `socio`)
- Multi-tenant: `organizationId`, memberships N:N, org activa (sessão + cookie + header)
- Módulos base: membros (CRUD, import/export Excel, RGPD), planos, pagamentos + recibos PDF, cartões QR, comunicações, relatórios, portal do sócio, lembretes de quota
- Observabilidade: Sentry + guia de uptime; rate limit em login e validação QR
- Deploy: Dockerfiles + `docker-compose.prod.yml`; docs de go-live e runbook ops
- Testes: Vitest (API unit + e2e HTTP), Playwright (login, membros, import, portal, pagamentos, RBAC)

### Notes

- Plugins de modalidade (football, padel, …): só no catálogo seed — sem UI
- OAuth Google/GitHub: variáveis preparadas, não activas por defeito
- Domínios custom / billing SaaS: fora do scope deste MVP

[Unreleased]: https://github.com/PedroPinho17/ClubOS/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/PedroPinho17/ClubOS/releases/tag/v0.1.0

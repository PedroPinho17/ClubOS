# Changelog

Todas as alterações relevantes do ClubOS são documentadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projecto tenta aderir a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Documentação: ADRs (Better Auth, papel efectivo por org), `CONTRIBUTING.md`, changelog
- Análise UML: actores/casos de uso, diagramas de actividade e sequência (`docs/analise/`)
- Diagramas UML clássicos em PNG (PlantUML): casos de uso, sequência, actividade
- Reset de password por email (`/recuperar-password`, `/reset-password`) + template SMTP
- Guias de ajuda no backoffice e formulário de settings de cartões
- Bootstrap da org activa e papel efectivo por organização (API + web)
- Testes E2E: recuperar password, settings/help, reforço RBAC / multi-org

### Changed

- Stack documentada: Next.js 16 (alinhado com `apps/web`)
- Caminho canónico de BD em docs: `pnpm db:migrate` (dev) / `pnpm db:deploy` (prod); `db:push` só para protótipos
- `API-BACKEND.md`: Swagger como fonte de verdade dos endpoints

### Fixed

- (registar aqui correcções user-facing à medida que saem)

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

# Contribuir para o ClubOS

Obrigado por contribuires. Este ficheiro cobre o fluxo de contribuição; as regras de código estão em [docs/CONVENCOES.md](docs/CONVENCOES.md).

## Antes de começar

1. Lê [docs/README.md](docs/README.md) (índice) e [docs/DESENVOLVIMENTO-LOCAL.md](docs/DESENVOLVIMENTO-LOCAL.md) (arranque).
2. Decisões de arquitectura: [docs/adr/](docs/adr/).
3. Copia `.env.example` → `.env` e define `SEED_DEMO_PASSWORD` / `BETTER_AUTH_SECRET` locais.

```bash
pnpm install
pnpm docker:up
pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Fluxo de trabalho

1. Cria um branch a partir de `main` (ou da branch base do PR).
2. Faz alterações focadas — um problema / feature por PR quando possível.
3. Migrations Prisma no **mesmo PR** que altera o schema (`pnpm db:migrate`, não `db:push` em PRs).
4. **PR que muda comportamento → actualiza doc ou ADR** (obrigatório na checklist abaixo).
5. Se a mudança for uma decisão de arquitectura, acrescenta ou actualiza um [ADR](docs/adr/README.md).
6. Regista alterações relevantes no [CHANGELOG.md](CHANGELOG.md) (secção `[Unreleased]`).

## Checklist antes do PR

```bash
pnpm typecheck
pnpm test
# se tocares em UI / fluxos críticos:
pnpm --filter @clubos/web test:e2e
```

- [ ] Sem `.env`, credenciais ou dumps no commit
- [ ] Typecheck e testes a passar
- [ ] Novos endpoints / módulos seguem [convenções](docs/CONVENCOES.md)
- [ ] Guards correctos (`@StaffOnly` / `@RequireModule` / `@NoOrgContext` conforme o caso)
- [ ] **PR que muda comportamento → actualiza doc ou ADR** (rotas, auth, env, ops, decisões)
- [ ] CHANGELOG actualizado (se user-facing ou ops)
- [ ] Descrição do PR explica o _porquê_ e como testar

## Commits

- Mensagens em português ou inglês — **consistente dentro do mesmo PR**
- Prefixo útil: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Não uses `--no-verify` / force-push a `main` sem acordo explícito

## Onde pedir ajuda

| Tema                      | Documento                                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| Arranque local / testes   | [DESENVOLVIMENTO-LOCAL](docs/DESENVOLVIMENTO-LOCAL.md)                           |
| Auth / roles / org activa | [AUTENTICACAO-RBAC](docs/AUTENTICACAO-RBAC.md)                                   |
| Endpoints                 | Swagger `/api/docs` + [API-BACKEND](docs/API-BACKEND.md)                         |
| Deploy / incidente        | [RUNBOOK-OPS](docs/RUNBOOK-OPS.md), [GO-LIVE-CRC-VALE](docs/GO-LIVE-CRC-VALE.md) |
| Demo sem VPS              | [DEMO-TUNNEL](docs/DEMO-TUNNEL.md)                                               |
| Segurança                 | [SECURITY](SECURITY.md)                                                          |

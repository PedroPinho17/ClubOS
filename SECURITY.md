# Segurança

## Reportar vulnerabilidades

Se encontraste uma falha de segurança no ClubOS (auth, isolamento multi-tenant, exposição de dados, RCE, etc.):

1. **Não** abras uma issue pública no GitHub com detalhes exploráveis.
2. Contacta o maintainer por email privado: **pedropinho364@gmail.com** (assunto: `[ClubOS Security]`).
3. Inclui: descrição, impacto, passos de reprodução, versões/commit se possível.
4. Dá tempo razoável para correção antes de divulgação pública.

Agradecemos reports responsáveis; não pedimos exploração destrutiva em produção de terceiros.

## O que NÃO fazer em produção

| Não fazer                                                         | Porquê                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm db:seed` / `seed:users`                                     | Cria contas demo e passwords conhecidas do `.env` de desenvolvimento |
| Commitar `.env` com segredos reais                                | `BETTER_AUTH_SECRET`, SMTP, S3, DB — rotação imediata se vazar       |
| `BETTER_AUTH_SECRET` fraco ou default (`dev-secret-change-me`)    | Sessões forjáveis                                                    |
| Deixar `SEED_DEMO_PASSWORD` / credenciais E2E no servidor         | Contas de teste acessíveis                                           |
| Desactivar `TRUST_PROXY` atrás de reverse proxy                   | Rate limit conta IP do proxy; bypass efectivo                        |
| Expor Swagger / debug verbose ao público sem necessidade          | Superfície extra de ataque                                           |
| Correr a app com secrets em variáveis de CI partilhadas com forks | Fuga via logs/PRs                                                    |

Não existe flag `APP_DEBUG` no ClubOS; o equivalente é **não** pôr `NODE_ENV=development`, DSN/debug excessivo ou logs com PII em produção. Usar `NODE_ENV=production` e `SENTRY_ENVIRONMENT=production`.

## Hardening mínimo (checklist)

- [ ] Segredos só no `.env` do host / Coolify — nunca no git
- [ ] HTTPS no domínio público; `BETTER_AUTH_URL`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`, `PASSKEY_RP_ID` alinhados
- [ ] SMTP real para reset de password (sem SMTP o reset não chega ao utilizador)
- [ ] `RATE_LIMIT_STORE=redis` + Redis healthy; ver [ADR 003](docs/adr/003-rate-limit-redis.md)
- [ ] Backup diário + [prova de restore](docs/RUNBOOK-OPS.md#8-prova-de-restore-manutenção)
- [ ] Alertas Sentry filtrados a `production` — [Observabilidade](docs/OBSERVABILIDADE.md)

## Superfície sensível conhecida

- `/api/auth/*` — brute-force (rate limit)
- `/api/validate/*` — abuso de validação QR (rate limit + assinatura HMAC)
- Isolamento por `organizationId` — sempre via guards; nunca confiar só no header do cliente
- Export / erase RGPD — roles admin/imperador apenas

Detalhe de auth: [docs/AUTENTICACAO-RBAC.md](docs/AUTENTICACAO-RBAC.md).  
Deploy piloto: [docs/GO-LIVE-CRC-VALE.md](docs/GO-LIVE-CRC-VALE.md).

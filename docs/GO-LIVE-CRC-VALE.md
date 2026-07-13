# Go-live CRC Vale — ClubOS

**Cliente piloto:** CRC Vale  
**Estratégia:** 1–2 meses em paralelo com `gestao_socios` (Laravel) — não desligar o antigo de imediato  
**Última actualização:** 13 de julho de 2026

> Este documento regista URLs finais, contactos de alerta e datas — **sem passwords**. Preencher após deploy.

---

## URLs de produção

| Serviço           | URL                                  | Estado |
| ----------------- | ------------------------------------ | ------ |
| Web (login)       | `https://_______________/login`      | ⬜     |
| API health        | `https://_______________/api/health` | ⬜     |
| API ready         | `https://_______________/api/ready`  | ⬜     |
| Swagger (interno) | `https://_______________/api/docs`   | ⬜     |

**Domínio sugerido:** `socios.crcvale.pt`  
**DNS:** registo A → IP do VPS (configurar **48 h antes** da reunião/demo)

---

## Contactos de alerta

| Canal                       | Destino           | Configurado em  |
| --------------------------- | ----------------- | --------------- |
| Sentry (erros)              | _________________ | Sentry → Alerts |
| UptimeRobot (down)          | _________________ | uptimerobot.com |
| Healthchecks.io (lembretes) | _________________ | healthchecks.io |

---

## Fase 1 — Infraestrutura

### VPS / Coolify

- [ ] VPS ≥ 2 GB RAM, Ubuntu 22+
- [ ] Docker + Docker Compose
- [ ] Coolify ou deploy manual (`docker-compose.yml` + `docker-compose.prod.yml`)
- [ ] HTTPS (Let's Encrypt via Coolify / Traefik / Caddy)
- [ ] `.env` de produção preenchido (ver checklist abaixo)

### Primeiro arranque

```bash
# Infra (Postgres, Redis, MinIO)
docker compose up -d postgres redis minio

# App
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Migrações — NÃO correr seed demo em produção
pnpm db:deploy
```

### Checklist `.env` produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32+ caracteres aleatórios>
BETTER_AUTH_URL=https://socios.crcvale.pt
WEB_ORIGIN=https://socios.crcvale.pt
NEXT_PUBLIC_API_URL=https://socios.crcvale.pt
PASSKEY_RP_ID=socios.crcvale.pt

# SMTP real (obrigatório para lembretes e comunicações)
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="CRC Vale <no-reply@crcvale.pt>"

# S3 / MinIO
S3_ENDPOINT=...
S3_BUCKET=clubos-crcvale

REDIS_HOST=redis
REMINDERS_ENABLED=true

SENTRY_DSN=...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_DSN=...

HEALTHCHECK_QUOTA_REMINDERS_URL=https://hc-ping.com/...
```

Ver também: [Observabilidade](OBSERVABILIDADE.md) · [Runbook ops](RUNBOOK-OPS.md)

---

## Fase 2 — Dados CRC Vale

- [ ] Exportar sócios do `gestao_socios` (Excel ou SQL)
- [ ] Importar no ClubOS: **dry-run** → corrigir erros → import real (`/members`)
- [ ] Validar quotas: comparar 5–10 sócios amostra (em dia / atraso) com Laravel
- [ ] Upload logo CRC Vale em **Definições**
- [ ] Criar contas staff: administrador, tesoureiro

---

## Fase 3 — Validação com o clube (demo / reunião)

- [ ] Login admin → lista sócios paginada
- [ ] Registar pagamento → quota actualizada
- [ ] Imprimir cartão sócio
- [ ] Portal sócio: login, ver quota, PDF recibo
- [ ] Email lembrete (teste manual: `pnpm --filter @clubos/api reminders:run`)
- [ ] Relatório pagantes PDF

---

## Fase 4 — Paralelo (1–2 meses)

| Semana | Acção                                                                  |
| ------ | ---------------------------------------------------------------------- |
| 1–2    | Staff usa ClubOS para consultas; pagamentos ainda podem ser no Laravel |
| 3–4    | Pagamentos novos só no ClubOS                                          |
| 5–8    | Sócios com portal no ClubOS; desactivar portal Laravel                 |
| Fim    | Desligar `gestao_socios` quando confiança = 100%                       |

---

## Fase 5 — Ops

- [ ] Sentry: alertas activos ([Observabilidade](OBSERVABILIDADE.md))
- [ ] UptimeRobot: 3 monitores activos
- [ ] Backup PostgreSQL diário (`pnpm db:backup` em cron ou snapshot VPS)
- [ ] Runbook impresso/partilhado: [RUNBOOK-OPS.md](RUNBOOK-OPS.md)

---

## Riscos e mitigação

| Risco            | Mitigação                                                 |
| ---------------- | --------------------------------------------------------- |
| Perda de dados   | Backup antes de import; paralelo 2 meses                  |
| SMTP bloqueado   | Testar envio **antes** da demo                            |
| DNS / HTTPS      | Configurar 48 h antes da reunião                          |
| Passkeys em prod | `PASSKEY_RP_ID` = domínio exacto (sem `www` se não usado) |

---

## Critérios de sucesso

- [ ] URL produção activa com HTTPS
- [ ] ≥ 1 utilizador CRC Vale a usar semanalmente
- [ ] Import de sócios concluído
- [ ] 0 rollback por bug crítico em 30 dias
- [ ] `gestao_socios` disponível como fallback durante paralelo

---

## Registo de go-live

| Campo                | Valor             |
| -------------------- | ----------------- |
| Data go-live         | _________________ |
| Responsável técnico  | _________________ |
| Responsável CRC Vale | _________________ |
| Notas                |                   |

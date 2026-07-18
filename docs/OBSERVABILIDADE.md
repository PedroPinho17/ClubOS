# Observabilidade e alertas

Guia operacional para monitorizar o ClubOS em produção — **Sentry** (erros de aplicação) e **uptime externo** (disponibilidade).

Relacionado: [Go-live CRC Vale](GO-LIVE-CRC-VALE.md) · [Runbook ops](RUNBOOK-OPS.md)

---

## Ordem recomendada

| #   | Tarefa           | Quando                                          |
| --- | ---------------- | ----------------------------------------------- |
| 1   | Sentry alertas   | Assim que `SENTRY_DSN` estiver em prod/staging  |
| 2   | Uptime externo   | No mesmo dia do deploy (precisa de URL pública) |
| 3   | Go-live CRC Vale | Após VPS + domínio + reunião fechada            |

---

## Sentry — alertas automáticos

### Situação no código

- API e Web enviam erros quando `SENTRY_DSN` está definido.
- A API adiciona tags `environment`, `organizationId` e `endpoint` em cada excepção capturada.
- **Sem DSN** = zero impacto em dev local e CI (`NODE_ENV=test`).
- Variáveis em `.env` (ver `.env.example`):

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx   # opcional; Web client
```

### A) Painel Sentry (manual — não é código)

1. Criar ou usar projeto(s): **clubos-api** e **clubos-web** (ou um só).
2. **Alerts → Create Alert**

**Alerta A — Novo issue**

| Campo  | Valor                             |
| ------ | --------------------------------- |
| Tipo   | Issues → _A new issue is created_ |
| Filtro | `environment:production`          |
| Acção  | Email (Pedro) + Slack opcional    |
| Nome   | `ClubOS [production] — novo erro` |

**Alerta B — Spike**

| Campo  | Valor                                      |
| ------ | ------------------------------------------ |
| Tipo   | Number of events **> 10** em **5 minutes** |
| Filtro | `environment:production`                   |
| Acção  | Email urgente                              |
| Nome   | `ClubOS [production] — spike de erros`     |

3. **Project Settings → Environments** — confirmar que eventos de prod chegam com `environment:production`.

### B) Variáveis em produção (VPS / Coolify)

Garantir no `.env` do servidor:

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### C) Validar (obrigatório)

1. Em staging ou prod: provocar erro 500 controlado:
   - Opção segura: no painel Sentry → **Send test event**
   - Opção API: pedido que rebenta internamente (remover após teste)
2. Confirmar evento no Sentry com tag `environment:production`
3. Confirmar tag `organizationId` num erro multi-tenant (se aplicável)
4. Confirmar email do **Alerta A**
5. **Não** repetir em `development` — alertas devem estar filtrados por `production`

### D) Critérios de sucesso — Sentry

- [ ] Alerta "novo issue" testado em production — data: ___________
- [ ] Alerta spike configurado
- [ ] Zero spam de alertas em dev local
- [ ] `SENTRY_ENVIRONMENT=production` no servidor

---

## Uptime externo

O Sentry deteta **erros de aplicação**. Um monitor externo deteta **site/API caído** (VPS, rede, Docker parado).

### Endpoints públicos (sem auth)

| Endpoint          | Função                          |
| ----------------- | ------------------------------- |
| `GET /api/health` | Liveness — processo a responder |
| `GET /api/ready`  | Readiness — PostgreSQL + Redis  |
| `GET /login`      | Frontend activo                 |

### A) UptimeRobot — 3 monitores

Substituir `https://TEU-DOMINIO` pelo domínio real (ex. `https://socios.crcvale.pt`):

| Nome              | URL                              | Intervalo | Alerta se                      |
| ----------------- | -------------------------------- | --------- | ------------------------------ |
| ClubOS API health | `https://TEU-DOMINIO/api/health` | 5 min     | ≠ HTTP 200                     |
| ClubOS API ready  | `https://TEU-DOMINIO/api/ready`  | 5 min     | ≠ HTTP 200 ou body sem `ready` |
| ClubOS Web login  | `https://TEU-DOMINIO/login`      | 15 min    | ≠ HTTP 200                     |

Passos:

1. Conta [UptimeRobot](https://uptimerobot.com) (grátis) ou Better Stack
2. **Add New Monitor** → HTTP(s)
3. Alert Contacts: email (+ Telegram opcional)
4. Guardar os 3 monitores

**URLs finais em produção:**

| Monitor    | URL                                  |
| ---------- | ------------------------------------ |
| API health | `https://_______________/api/health` |
| API ready  | `https://_______________/api/ready`  |
| Web login  | `https://_______________/login`      |

### B) Healthchecks.io — cron lembretes (opcional, recomendado)

1. Criar check em [healthchecks.io](https://healthchecks.io) — "ClubOS quota reminders"
2. No `.env` de produção:

```env
REMINDERS_ENABLED=true
HEALTHCHECK_QUOTA_REMINDERS_URL=https://hc-ping.com/SEU-UUID
```

3. O job `pnpm --filter @clubos/api reminders:run` faz ping ao URL após cada execução (já suportado no código).

### C) Validar uptime

1. Monitores em estado **Up** com domínio real
2. Teste: parar container `clubos-api` → alerta em **< 10 min**
3. Repor serviço → monitor volta a Up
4. Preencher URLs finais na tabela acima

### D) Critérios de sucesso — Uptime

- [ ] 3 monitores UptimeRobot activos — data: ___________
- [ ] Teste de downtime feito e alerta recebido
- [ ] Healthchecks.io para lembretes (opcional) — data: ___________

---

## Checklist rápida (go-live)

- [ ] Sentry: alerta "new issue" em `production`
- [ ] Sentry: alerta spike de erros (>10 / 5 min)
- [ ] UptimeRobot: `/api/health`
- [ ] UptimeRobot: `/api/ready`
- [ ] UptimeRobot: `/login`
- [ ] Healthchecks.io: ping lembretes (opcional)
- [ ] Backup PostgreSQL diário (`pnpm db:backup`)
- [ ] Runbook partilhado: [RUNBOOK-OPS.md](RUNBOOK-OPS.md)

---

## Rate limit e proxy (ops)

Em produção o rate limit de `/api/auth` e `/api/validate` usa **Redis** partilhado entre réplicas. Se o ready check reportar Redis down, os limites podem cair para memória (warn no log da API) — limites deixam de ser partilhados.

Checklist rápido pós-deploy:

- [ ] `RATE_LIMIT_STORE=redis` e Redis healthy (`/api/ready`)
- [ ] `TRUST_PROXY=true` atrás de Coolify/Traefik/Caddy (IP real nos 429)
- [ ] Logs: `RATE_LIMIT: store Redis activo` no arranque da API

Detalhe: [API Backend](API-BACKEND.md) · [ADR 003](adr/003-rate-limit-redis.md)

---

## Relação com outras docs

| Documento                               | Conteúdo                             |
| --------------------------------------- | ------------------------------------ |
| [Arquitetura](ARQUITETURA.md)           | Health `/api/health` e `/api/ready`  |
| [API Backend](API-BACKEND.md)           | Endpoints, rate limit, workers       |
| [Go-live CRC Vale](GO-LIVE-CRC-VALE.md) | Deploy piloto, import, paralelo      |
| [Runbook ops](RUNBOOK-OPS.md)           | API down → restart; prova de restore |
| [SECURITY](../SECURITY.md)              | Reportar vulnerabilidades            |
| [README](../README.md)                  | Índice geral                         |

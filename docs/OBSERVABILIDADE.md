# Observabilidade e alertas

Guia operacional para monitorizar o ClubOS em produção — Sentry (erros de aplicação) e uptime externo (disponibilidade).

## Sentry — alertas automáticos

### Situação no código

- API e Web já enviam erros quando `SENTRY_DSN` está definido.
- A API adiciona tags `environment`, `organizationId` e `endpoint` em cada excepção capturada.
- Variáveis em `.env` (ver `.env.example`):

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_DSN=""   # opcional; Web client
```

### Configurar no painel Sentry

1. Criar projeto(s) ClubOS — API e Web separados se preferir.
2. **Alerts** → **Create Alert**
3. **Alerta A — erro novo**
   - Tipo: **Issues** → *A new issue is created*
   - Filtro: `environment:production`
   - Acção: email ou Slack
4. **Alerta B — spike de erros**
   - Tipo: **Number of events** > 10 em 5 minutos
   - Filtro: `environment:production`
   - Acção: email urgente

### Validar

- [ ] Forçar erro 500 em staging/production e confirmar email
- [ ] Alertas filtrados por `production` (sem spam em dev local)
- [ ] Tags `organizationId` visíveis no evento Sentry (multi-tenant)

---

## Uptime externo

O Sentry deteta **erros de aplicação**. Um monitor externo deteta **site/API caído** (VPS, rede, Docker).

### Endpoints a monitorizar

| URL | Tipo | Intervalo |
|-----|------|-----------|
| `https://teu-dominio.pt/api/health` | HTTP 200 | 5 min |
| `https://teu-dominio.pt/api/ready` | HTTP 200 + body `ready` | 5 min |
| `https://teu-dominio.pt/login` | HTTP 200 | 15 min |

### UptimeRobot (exemplo)

1. Conta gratuita em [uptimerobot.com](https://uptimerobot.com)
2. **Add Monitor** → HTTP(s)
3. URL: `https://socios.clube.pt/api/ready`
4. Interval: 5 minutes
5. Alert contacts: email (+ Telegram opcional)
6. Repetir para `/api/health` e `/login`

### Healthchecks.io — job de lembretes

O cron de lembretes de quotas pode fazer ping após cada execução:

```env
HEALTHCHECK_QUOTA_REMINDERS_URL=https://hc-ping.com/xxx
```

Configurar no [healthchecks.io](https://healthchecks.io) para saber se o job correu.

### Validar

- [ ] Monitor activo em produção
- [ ] Parar API → alerta em menos de 10 minutos
- [ ] Checklist de go-live actualizado

---

## Checklist rápida (go-live)

- [ ] Sentry: alerta "new issue" em `production`
- [ ] Sentry: alerta spike de erros (>10 / 5 min)
- [ ] UptimeRobot: `/api/ready`
- [ ] UptimeRobot: `/api/health`
- [ ] UptimeRobot ou similar: `/login`
- [ ] Healthchecks.io: ping lembretes (opcional)

---

## Relação com outras docs

| Documento | Conteúdo |
|-----------|----------|
| [Arquitetura](ARQUITETURA.md) | Health `/api/health` e `/api/ready` |
| [API Backend](API-BACKEND.md) | Endpoints e workers |
| [README](README.md) | Índice geral |

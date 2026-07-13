# Runbook ops — ClubOS (1 página)

**Para:** CRC Vale / produção  
**Última actualização:** 13 de julho de 2026

---

## Sintomas rápidos

| Sintoma                         | Provável causa       | Acção imediata  |
| ------------------------------- | -------------------- | --------------- |
| Site `/login` não abre          | Web down, proxy, VPS | §1 Web          |
| Login OK mas dados não carregam | API down             | §2 API          |
| Erros 503 / timeout             | PostgreSQL ou Redis  | §3 Dependências |
| Emails não saem                 | SMTP                 | §4 SMTP         |
| Alerta Sentry spike             | Bug em produção      | §5 Sentry       |

---

## 1. Web down (`/login` ≠ 200)

```bash
docker ps | grep clubos-web
docker logs clubos-web --tail 100
docker restart clubos-web
```

Se persistir: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build web`

---

## 2. API down (`/api/health` ≠ 200)

```bash
docker ps | grep clubos-api
docker logs clubos-api --tail 100
docker restart clubos-api
```

Verificar migrações: `pnpm db:deploy` (no host com `DATABASE_URL` de prod)

---

## 3. Ready falha (`/api/ready` ≠ 200)

```bash
docker ps | grep -E 'postgres|redis'
docker compose up -d postgres redis
docker restart clubos-api
```

Testar manualmente:

```bash
curl -s https://TEU-DOMINIO/api/ready
# Esperado: {"status":"ready","db":"ok","redis":"ok",...}
```

---

## 4. SMTP / lembretes

- Confirmar `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` no `.env`
- Teste manual: `pnpm --filter @clubos/api reminders:run`
- Healthchecks.io: confirmar ping em `HEALTHCHECK_QUOTA_REMINDERS_URL`

---

## 5. Sentry — spike de erros

1. Abrir [Sentry](https://sentry.io) → projeto `clubos-api` / `clubos-web`
2. Filtrar `environment:production`
3. Identificar issue novo → corrigir → deploy
4. Se falso positivo: resolver issue no painel

Alertas configurados em [OBSERVABILIDADE.md](OBSERVABILIDADE.md).

---

## 6. Backup de emergência (antes de acções destrutivas)

```bash
pnpm db:backup
```

Restore: ver `scripts/run-backup.mjs` e [DESENVOLVIMENTO-LOCAL.md](DESENVOLVIMENTO-LOCAL.md).

---

## 7. Reinício completo (último recurso)

```bash
cd /caminho/ClubOS
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose up -d postgres redis minio
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Aguardar 2–3 min → confirmar `/api/ready` e `/login`.

---

## Contactos

| Função        | Contacto          |
| ------------- | ----------------- |
| Admin técnico | _________________ |
| Hosting / VPS | _________________ |
| CRC Vale      | _________________ |

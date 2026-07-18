# Runbook ops — ClubOS (1 página)

**Para:** CRC Vale / produção  
**Última actualização:** 18 de julho de 2026

---

## Sintomas rápidos

| Sintoma                         | Provável causa       | Acção imediata       |
| ------------------------------- | -------------------- | -------------------- |
| Site `/login` não abre          | Web down, proxy, VPS | §1 Web               |
| Login OK mas dados não carregam | API down             | §2 API               |
| Erros 503 / timeout             | PostgreSQL ou Redis  | §3 Dependências      |
| Emails / reset password falham  | SMTP                 | §4 SMTP              |
| Alerta Sentry spike             | Bug em produção      | §5 Sentry            |
| 429 em massa / rate limit odd   | Redis / trust proxy  | §3 + OBSERVABILIDADE |

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

Redis down também afecta **rate limit** (fallback memória) e filas BullMQ.

---

## 4. SMTP / lembretes / reset password

- Confirmar `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` no `.env`
- Reset password: `/recuperar-password` → email com link; sem SMTP = só log da API
- Teste manual lembretes: `pnpm --filter @clubos/api reminders:run`
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
# -> backups/clubos-YYYYMMDD-HHMMSS.dump
```

Confirmar tamanho do ficheiro (> poucos KB). Dump quase vazio = BD errada ou vazia — **não** uses esse dump como “backup bom”.

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

## 8. Prova de restore (manutenção)

Manutenção = **prova**, não só instruções. Registar cada exercício:

| Campo                               | Valor                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Última vez que restaurei backup** | **2026-07-18**                                                                                                                                                                                                     |
| Ambiente                            | Local (scripts Docker `clubos-postgres`)                                                                                                                                                                           |
| Dump                                | `backups/clubos-20260718-192554.dump`                                                                                                                                                                              |
| Comandos                            | `pnpm db:backup` → `pnpm db:restore -- <dump>`                                                                                                                                                                     |
| Resultado                           | Scripts concluíram (`Restore concluido.`); validar depois com query / login                                                                                                                                        |
| Nota                                | Os scripts Docker usam o contentor `clubos-postgres`. Se `DATABASE_URL` apontar para **outra** instância Postgres, o backup/restore Docker não toca nessa BD — alinhar URL e contentor antes de testes em staging. |

### Passos (staging / local — **nunca** em produção com utilizadores activos sem janela)

```powershell
# 1. Backup fresco
pnpm db:backup

# 2. Confirmar tamanho do .dump
Get-Item backups\clubos-*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# 3. Restore (substitui dados da BD alvo dos scripts)
pnpm db:restore -- backups/clubos-YYYYMMDD-HHMMSS.dump

# 4. Verificar
curl -s http://localhost:4000/api/ready
# login staff + contagem de sócios no UI
```

Em produção: restaurar primeiro num **clone/staging**, validar, só depois cutover. Guardar dumps fora do VPS (S3/NAS).

Próxima prova agendada (mensal): ___________

---

## Contactos

| Função        | Contacto                          |
| ------------- | --------------------------------- |
| Admin técnico | _________________                 |
| Hosting / VPS | _________________                 |
| CRC Vale      | _________________                 |
| Security      | ver [SECURITY.md](../SECURITY.md) |

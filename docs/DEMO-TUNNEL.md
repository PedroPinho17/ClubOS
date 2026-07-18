# Demo com Cloudflare Tunnel (sem VPS)

Guia para expor o ClubOS **local** com URL pública (`*.trycloudflare.com` ou domínio teu) — útil para mostrar ao CRC Vale antes de comprar VPS.

Isto **não** é produção. Para piloto real: [GO-LIVE-CRC-VALE.md](GO-LIVE-CRC-VALE.md) · [SECURITY.md](../SECURITY.md).

---

## Pré-requisitos

- `pnpm docker:up` (Postgres + Redis + MinIO)
- `pnpm db:migrate && pnpm db:seed` (ou BD local já pronta)
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) instalado

---

## Arquitectura simples (recomendado)

Um tunnel para a **web** (:3000) e outro para a **API** (:4000), **ou** um único hostname com path rewrite no Cloudflare (mais avançado).

Fluxo mínimo:

```
Browser  →  https://WEB.trycloudflare.com     →  localhost:3000
         →  https://API.trycloudflare.com     →  localhost:4000
```

A web chama a API via `NEXT_PUBLIC_API_URL` (URL do tunnel da API).

---

## Passos

### 1. Arrancar a app localmente

```powershell
pnpm docker:up
pnpm dev
# Web :3000 | API :4000
```

### 2. Abrir tunnels

```powershell
# Terminal A — Web
cloudflared tunnel --url http://localhost:3000

# Terminal B — API
cloudflared tunnel --url http://localhost:4000
```

Copia as duas URLs `https://….trycloudflare.com`.

### 3. Alinhar `.env` (reiniciar `pnpm dev` depois)

```env
WEB_ORIGIN=https://WEB.trycloudflare.com
BETTER_AUTH_URL=https://API.trycloudflare.com
NEXT_PUBLIC_API_URL=https://API.trycloudflare.com
PASSKEY_RP_ID=WEB.trycloudflare.com
TRUST_PROXY=true
```

Notas:

- `WEB_ORIGIN` entra em CORS + `trustedOrigins` do Better Auth — tem de ser a URL que o browser usa.
- Passkeys em `*.trycloudflare.com` são frágeis (RP ID muda a cada quick tunnel). Para demo, preferir **email + password**.
- Reset de password: com SMTP vazio o email só aparece no log da API; com SMTP real, o link no email usa as URLs acima.

### 4. Smoke test

1. Abrir `WEB_ORIGIN/login`
2. Login com conta seed (`SEED_DEMO_PASSWORD`)
3. Confirmar dashboard e `/api/ready` via URL da API

---

## Limitações da demo por tunnel

| Tema               | Comportamento                                               |
| ------------------ | ----------------------------------------------------------- |
| URL quick tunnel   | Muda a cada arranque — actualiza `.env`                     |
| Dados              | Continuam na tua máquina; não há HA                         |
| Seed demo          | OK para demo; **nunca** o mesmo setup como “produção”       |
| Emails / lembretes | Precisam SMTP real se quiseres fluxo completo               |
| Rate limit         | Redis local; `TRUST_PROXY=true` ajuda com IP via Cloudflare |

---

## Quando passar a VPS

1. Domínio fixo + HTTPS (Coolify / Traefik / Caddy)
2. `.env` de produção sem seed; `pnpm db:deploy` sem `db:seed`
3. Seguir [GO-LIVE-CRC-VALE.md](GO-LIVE-CRC-VALE.md) e [RUNBOOK-OPS.md](RUNBOOK-OPS.md)

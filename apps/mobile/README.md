# ClubOS Mobile

App nativa (Expo SDK 57 + Expo Router) para socios e staff leve.

## Correr localmente (agora)

IP da tua rede (Ethernet): **`192.168.1.95`**. Se mudares de Wi‑Fi/cabo, actualiza este IP em `eas.json` e nos comandos abaixo.

### Opcao A — Emulador / USB (mais rapido no dia a dia)

Requisito: Android Studio instalado (SDK + emulador) ou telemovel com USB debugging.

```bash
# Terminal 1 — API (raiz do monorepo)
pnpm --filter @clubos/database build
pnpm --filter @clubos/shared build
pnpm --filter @clubos/api dev

# Terminal 2 — app
cd apps/mobile

# Emulador Android (API ja aponta para 10.0.2.2:4000 por default)
pnpm exec expo run:android

# Telemovel fisico na mesma rede Wi-Fi/LAN
# (Windows: firewall pode pedir autorizacao na porta 4000)
$env:EXPO_PUBLIC_API_URL="http://192.168.1.95:4000"
pnpm exec expo run:android
```

### Opcao B — APK para instalar no telemovel

1. Conta Expo (gratis) + projecto EAS uma vez:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
```

Isto substitui o `projectId` placeholder em `app.json`.

2. Gerar APK (cloud Expo):

```bash
# Dev client (hot reload com Metro no PC)
npx eas-cli@latest build --profile development --platform android

# Ou APK de teste interno (sem depender do Metro)
npx eas-cli@latest build --profile preview --platform android
```

3. Quando o build acabar, abre o link do EAS → descarrega o `.apk` → instala no Android (permite fontes desconhecidas).

Os perfis `development` e `preview` ja geram **APK** e usam `EXPO_PUBLIC_API_URL=http://192.168.1.95:4000`.

Garantir que:

- a API esta a correr no PC (`pnpm --filter @clubos/api dev`)
- o telemovel esta na **mesma rede** que o PC
- a firewall do Windows permite inbound TCP **4000**

### Expo Go

Nao usar nesta app (camera, push, secure store, etc. exigem development build).

## Estrutura

- `(auth)` — login / mudar password
- `(socio)` — inicio, cartao QR, pagamentos, avisos, perfil
- `(staff)` — dashboard, socios, scanner QR, seletor de clube

## Publicacao (lojas)

Ver [STORE.md](./STORE.md).

# ClubOS Mobile

App nativa (Expo SDK 57 + Expo Router) para socios e staff leve.

## Correr localmente

### Opcao A — Emulador / USB

```bash
# Terminal 1 — API (raiz do monorepo)
pnpm --filter @clubos/database build
pnpm --filter @clubos/shared build
pnpm --filter @clubos/api dev

# Terminal 2 — app
cd apps/mobile

# Emulador Android → API em 10.0.2.2:4000 (default em src/lib/config.ts)
pnpm exec expo run:android

# Telemovel fisico na mesma LAN — passa o IP do PC:
# $env:EXPO_PUBLIC_API_URL="http://192.168.x.x:4000"
pnpm exec expo run:android
```

### Opcao B — APK (EAS)

1. Conta Expo + projecto EAS (uma vez):

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
```

Isto substitui `REPLACE_WITH_EAS_PROJECT_ID` em `app.json`.

2. Builds:

```bash
# Dev client
npx eas-cli@latest build --profile development --platform android

# Preview interno
npx eas-cli@latest build --profile preview --platform android
```

Para telemovel fisico nos perfis EAS, define o IP na altura do build:

```bash
$env:EXPO_PUBLIC_API_URL="http://192.168.x.x:4000"
npx eas-cli@latest build --profile preview --platform android
```

3. **Producao** — so depois de DNS/HTTPS live:

```bash
$env:EXPO_PUBLIC_API_URL="https://teu-dominio.pt"
npx eas-cli@latest build --profile production --platform android
```

## Expo Go

Nao usar nesta app (camera, push, secure store, etc. exigem development build).

## Estrutura

- `(auth)` — login / mudar password
- `(socio)` — inicio, cartao QR, pagamentos, avisos, perfil
- `(staff)` — dashboard, socios, scanner QR, seletor de clube

## Publicacao (lojas)

Ver [STORE.md](./STORE.md).

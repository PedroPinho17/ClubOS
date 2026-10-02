# Publicacao nas lojas — checklist Fase 4

## Contas

- [ ] Google Play Console (US$25 unico) — preferir conta Organizacao
- [ ] Apple Developer Program (99 USD/ano)
- [ ] Correr `eas init` e substituir `REPLACE_WITH_EAS_PROJECT_ID` em `app.json` (`extra.eas.projectId` + `updates.url`)
- [ ] Antes do build production: `EXPO_PUBLIC_API_URL=https://teu-dominio` (DNS/HTTPS live; nao hardcodes em eas.json)

## Assets

- [ ] Icone 1024x1024 e adaptive Android
- [ ] Splash
- [ ] Screenshots telefone (e tablet se aplicavel)

## Politica / legal

- [ ] Link privacidade: `/privacidade` (push Expo/FCM/APNs documentados)
- [ ] DPA: `/dpa`
- [ ] Eliminacao de conta na app + web `/conta/eliminar`
- [ ] Google Play Data safety form
- [ ] App Store App Privacy

## Contas demo para revisao

- [ ] Socio demo com portal, quotas e cartao QR
- [ ] Tesoureiro demo com membros e scanner QR
- [ ] Backend de producao/staging acessivel aos revisores

## Builds

```bash
cd apps/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

## OTA

```bash
eas update --channel preview --message "..."
eas update --channel production --message "..."
```

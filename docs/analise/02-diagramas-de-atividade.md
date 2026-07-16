# Diagramas de actividade

Versão visual UML (PlantUML):

![Login](diagrams/act-login.png)

![Import Excel](diagrams/act-import.png)

Abaixo: mesma lógica em Mermaid (fácil de editar no GitHub).

## AD01 — Autenticação e encaminhamento pós-login

```mermaid
flowchart TD
  A([Início]) --> B[Abrir /login]
  B --> C{Método?}
  C -->|Email/password| D[Submeter credenciais]
  C -->|Passkey| E[WebAuthn / passkey]
  D --> F{Credenciais válidas?}
  E --> F
  F -->|Não| G[Mostrar erro]
  G --> B
  F -->|Sim| H[Cookie de sessão Better Auth]
  H --> I{Role global?}
  I -->|socio| J[Redirect /portal]
  I -->|staff| K[Bootstrap org activa]
  K --> L{Org válida?}
  L -->|Não| M[Erro de contexto / sem membership]
  L -->|Sim| N[Resolver papel efectivo]
  N --> O[Redirect /dashboard]
  J --> Z([Fim])
  O --> Z
  M --> Z
```

## AD02 — Trocar organização activa (multi-org)

```mermaid
flowchart TD
  A([Início]) --> B[Staff abre OrgSwitcher]
  B --> C[GET /api/me/organizations]
  C --> D[Seleccionar org]
  D --> E[POST /api/me/active-organization]
  E --> F[Actualizar localStorage + cookie]
  F --> G[Invalidar queries TanStack do tenant]
  G --> H[GET /api/me/context]
  H --> I{Context OK?}
  I -->|Não| J[RoleContextError + retry]
  I -->|Sim| K[Recarregar nav / RoleGate com papel efectivo]
  K --> Z([Fim])
  J --> Z
```

## AD03 — Importar sócios (Excel com dry-run)

```mermaid
flowchart TD
  A([Início]) --> B[Admin descarrega template]
  B --> C[Preenche Excel]
  C --> D[Upload POST /members/import?dryRun=true]
  D --> E{Erros de validação?}
  E -->|Sim| F[Painel de erros por linha]
  F --> C
  E -->|Não| G{Confirmar importação?}
  G -->|Não| Z1([Cancelar])
  G -->|Sim| H[POST /members/import dryRun=false]
  H --> I[Criar/actualizar Members na org]
  I --> J[AuditLog]
  J --> Z([Fim — resumo])
```

## AD04 — Registar pagamento e recibo

```mermaid
flowchart TD
  A([Início]) --> B[Staff abre Pagamentos]
  B --> C[Seleccionar sócio + dados]
  C --> D[POST /api/payments]
  D --> E{Validação OK?}
  E -->|Não| F[Erro / toast]
  F --> C
  E -->|Sim| G[Persistir Payment + organizationId]
  G --> H[Actualizar situação de quota]
  H --> I[Enfileirar job recibo PDF BullMQ]
  I --> J[Worker gera PDF → storage S3/MinIO]
  J --> K[Actualizar estado de emissão]
  K --> L[AuditLog]
  L --> Z([Fim])
```

## AD05 — Conceder acesso ao portal do sócio

```mermaid
flowchart TD
  A([Início]) --> B[Admin escolhe sócio]
  B --> C{Sócio tem email?}
  C -->|Não| D[Pedir email]
  D --> C
  C -->|Sim| E[Definir password inicial]
  E --> F[API cria/liga User role=socio]
  F --> G[Liga Member.userId]
  G --> H[mustChangePassword = true]
  H --> I[Mostrar credenciais / confirmação]
  I --> J[Sócio faz login no portal]
  J --> K{Deve mudar password?}
  K -->|Sim| L[Forçar alteração]
  L --> M[Portal: quotas / cartão / recibos]
  K -->|Não| M
  M --> Z([Fim])
```

## AD06 — Recuperar password

```mermaid
flowchart TD
  A([Início]) --> B[Abrir /recuperar-password]
  B --> C[Submeter email]
  C --> D[Better Auth sendResetPassword]
  D --> E{SMTP configurado?}
  E -->|Não| F[Simular / log local — mensagem genérica]
  E -->|Sim| G[Enviar email com link + token]
  F --> H[UI: instruções]
  G --> H
  H --> I[Utilizador abre /reset-password?token=…]
  I --> J[Definir nova password]
  J --> K{Token válido?}
  K -->|Não| L[Erro — pedir novo link]
  K -->|Sim| M[Password actualizada]
  M --> N[Redirect /login]
  N --> Z([Fim])
  L --> B
```

## AD07 — Lembretes diários de quota (Sistema)

```mermaid
flowchart TD
  A([Cron 09:00]) --> B{REMINDERS_ENABLED?}
  B -->|Não| Z0([Fim])
  B -->|Sim| C[Listar orgs com lembretes activos]
  C --> D[Por org: sócios a vencer / em atraso]
  D --> E{Já enviado QuotaReminderSent?}
  E -->|Sim| F[Saltar]
  E -->|Não| G[Enfileirar email HTML]
  G --> H[SMTP envia]
  H --> I[Registar QuotaReminderSent]
  F --> J{Mais sócios?}
  I --> J
  J -->|Sim| D
  J -->|Não| Z([Fim])
```

## AD08 — Validar cartão (QR público)

```mermaid
flowchart TD
  A([Visitante lê QR]) --> B[GET /validar/:memberId + assinatura]
  B --> C{Assinatura / rate limit OK?}
  C -->|Não| D[Recusar]
  C -->|Sim| E[Mostrar dados públicos do cartão]
  D --> Z([Fim])
  E --> Z
```

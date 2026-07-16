# Diagramas de sequência

Versão visual UML (PlantUML):

![Login staff](diagrams/seq-login.png)

![Pagamento + recibo](diagrams/seq-pagamento.png)

Abaixo: mesmas e outras sequências em Mermaid.

## SQ01 — Login staff (email/password)

```mermaid
sequenceDiagram
  actor U as Staff
  participant W as Next.js Web
  participant A as NestJS / Better Auth
  participant DB as PostgreSQL

  U->>W: Submete email + password
  W->>A: POST /api/auth/sign-in/email
  A->>DB: Validar credenciais / sessão
  A-->>W: Set-Cookie sessão
  W->>A: useSession / sessão
  A-->>W: user + role
  W->>A: GET /api/me/organizations
  A->>DB: OrganizationMember
  A-->>W: lista orgs + orgRole
  W->>A: POST /api/me/active-organization
  A->>DB: Session.activeOrganizationId
  A-->>W: 200
  W->>A: GET /api/me/context
  A-->>W: organizationId + effectiveRole
  W-->>U: /dashboard (nav filtrada)
```

## SQ02 — Pedido autenticado com tenant (padrão)

```mermaid
sequenceDiagram
  participant W as Next.js
  participant AG as AuthGuard
  participant OG as OrganizationContextGuard
  participant EG as EffectiveRoleGuard
  participant MG as ModuleGuard
  participant C as Controller/Service
  participant DB as PostgreSQL

  W->>AG: HTTP + Cookie + x-organization-id
  AG-->>OG: req.user / session
  OG->>DB: validar membership / org
  OG-->>EG: req.activeOrganizationId
  EG-->>MG: papel efectivo
  MG->>DB: OrganizationModule.enabled?
  MG-->>C: autorizado
  C->>DB: query com organizationId
  C-->>W: JSON
```

## SQ03 — Trocar organização activa

```mermaid
sequenceDiagram
  actor U as Imperador
  participant W as Web (OrgSwitcher)
  participant A as API /me
  participant DB as PostgreSQL
  participant Q as TanStack Query

  U->>W: Selecciona org B
  W->>A: POST /api/me/active-organization { id: B }
  A->>DB: membership + session
  A-->>W: 200 + cookie
  W->>W: localStorage = B
  W->>Q: invalidateTenantQueries()
  W->>A: GET /api/me/context
  A-->>W: effectiveRole em B
  W-->>U: UI actualizada (permissões de B)
```

## SQ04 — Registar pagamento + recibo PDF

```mermaid
sequenceDiagram
  actor T as Tesoureiro
  participant W as Web
  participant API as PaymentsController
  participant S as PaymentsService
  participant DB as PostgreSQL
  participant Q as BullMQ / Redis
  participant WK as Worker PDF
  participant S3 as MinIO/S3

  T->>W: Submete pagamento
  W->>API: POST /api/payments
  API->>S: create(...)
  S->>DB: INSERT Payment (organizationId)
  S->>DB: actualizar situação quota
  S->>Q: enqueue receipt job
  S->>DB: AuditLog
  API-->>W: 201 Payment
  Q->>WK: process job
  WK->>S3: upload PDF
  WK->>DB: estado emissão = ready
```

## SQ05 — Conceder acesso portal

```mermaid
sequenceDiagram
  actor Ad as Administrador
  participant W as Web
  participant P as PortalService
  participant Auth as Better Auth
  participant DB as PostgreSQL

  Ad->>W: Password + email do sócio
  W->>P: POST conceder acesso
  P->>Auth: criar/actualizar User (role socio)
  Auth->>DB: User + Account
  P->>DB: Member.userId = user.id
  P->>DB: mustChangePassword = true
  P-->>W: credenciais / sucesso
  W-->>Ad: diálogo de confirmação
```

## SQ06 — Recuperar password

```mermaid
sequenceDiagram
  actor U as Utilizador
  participant W as Web
  participant Auth as Better Auth
  participant Mail as MailService
  participant SMTP as SMTP
  participant DB as PostgreSQL

  U->>W: /recuperar-password + email
  W->>Auth: forgetPassword / reset request
  Auth->>DB: Verification token
  Auth->>Mail: sendResetPassword
  Mail->>SMTP: email com link
  SMTP-->>U: inbox
  U->>W: /reset-password?token=…
  W->>Auth: reset password
  Auth->>DB: actualizar password / consumir token
  Auth-->>W: OK
  W-->>U: /login
```

## SQ07 — Lembrete de quota (cron)

```mermaid
sequenceDiagram
  participant Cron as Nest Schedule
  participant R as RemindersService
  participant DB as PostgreSQL
  participant Q as BullMQ
  participant Mail as Mail worker
  participant SMTP as SMTP

  Cron->>R: 09:00 daily
  R->>DB: orgs + sócios a vencer/atraso
  loop por candidato
    R->>DB: QuotaReminderSent existe?
    alt ainda não enviado
      R->>Q: enqueue email HTML
      Q->>Mail: send
      Mail->>SMTP: deliver
      Mail->>DB: INSERT QuotaReminderSent
    end
  end
```

## SQ08 — Validar QR do cartão

```mermaid
sequenceDiagram
  actor V as Visitante
  participant W as /validar/[id]
  participant API as Validate (público)
  participant DB as PostgreSQL

  V->>W: Abre link do QR
  W->>API: GET validação + assinatura
  Note over API: AllowAnonymous + rate limit
  API->>DB: Member + org (dados públicos)
  alt assinatura inválida
    API-->>W: 403/400
  else OK
    API-->>W: nome / estado cartão
    W-->>V: ecrã de validação
  end
```

## Notas para o relatório

- Os guards globais (SQ02) são a peça central de segurança multi-tenant — citar [ARQUITETURA](../ARQUITETURA.md).
- O papel efectivo (SQ01/SQ03) não é o `user.role` global — citar [ADR 002](../adr/002-effective-role-por-org.md).
- Para notação UML “pura” (lifelines Enterprise Architect / StarUML), estes Mermaid servem de especificação de origem.

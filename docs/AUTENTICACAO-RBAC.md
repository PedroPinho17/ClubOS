# Autenticação e RBAC

## Better Auth

Configuração única: `apps/api/src/auth/auth.ts`

| Funcionalidade       | Estado                |
| -------------------- | --------------------- |
| Email + password     | ✅                    |
| Passkey / WebAuthn   | ✅                    |
| Roles (admin plugin) | ✅                    |
| OAuth Google/GitHub  | Preparado (env vazio) |

### Roles da plataforma

| Role            | Acesso                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| `imperador`     | Super-admin; qualquer org (sem membership obrigatória); activar módulos |
| `administrador` | Admin do clube                                                          |
| `tesoureiro`    | Pagamentos, relatórios (sem settings sensíveis)                         |
| `socio`         | Portal apenas                                                           |

Constantes: `apps/api/src/common/roles.ts`  
Staff no frontend: `apps/web/src/lib/staff-roles.ts` (`STAFF_ROLES`, `isStaffRole`)

## Fluxo de login (Web)

```
1. Utilizador submete credenciais em /login
2. authClient.signIn.email() → POST /api/auth/sign-in/email
3. Cookie de sessão definido no domínio da API
4. useSession().refetch() confirma sessão
5. postLoginPath(role) → /dashboard ou /portal
6. Layout useRequireAuth() valida sessão
```

## Org activa (multi-tenant)

```
Web                          API
────                         ───
localStorage org id    →     x-organization-id header
cookie clubos_active_org →   resolveActiveOrganizationId()
POST /api/me/active-organization → Session.activeOrganizationId
GET  /api/me/context           → { organizationId, effectiveRole } (validação)
GET  /api/me/organizations     → lista com orgRole por membership
```

Serviço: `OrganizationContextService`  
Guard: `OrganizationContextGuard`

### Bootstrap da org activa

`useBootstrapActiveOrganization()` corre no layout **antes** do shell renderizar:

1. Carrega `/me/organizations`
2. Define org válida no `localStorage` + `POST /me/active-organization`
3. Layout só renderiza quando `activeOrgId` está definido

Evita deadlock em browsers limpos (E2E) onde o switcher ainda não montou.

### Org switcher

- Desktop: sidebar (`OrgSwitcher`)
- Mobile: header compacto (`OrgSwitcher compact`)
- Ao trocar: `invalidateTenantQueries()` + toast

### Quando falha (403)

- Staff sem memberships (excepto `imperador`)
- Header/cookie com org onde o user não tem acesso
- Sócio sem `Member` associado
- Org inexistente (imperador)

### Rotas sem tenant (`@NoOrgContext`)

- `GET/POST /api/me/*` (inclui `/api/me/context`, que resolve org do pedido internamente)
- `GET/POST /api/organizations` (imperador)
- Rotas `@AllowAnonymous` (health, validate)

## Papel efectivo por organização

O RBAC do backoffice usa o **papel efectivo** na org activa, não apenas `user.role` global:

| Global `user.role` | Papel efectivo                             |
| ------------------ | ------------------------------------------ |
| `socio`            | `socio` (sempre)                           |
| `imperador`        | `imperador` (em qualquer org)              |
| staff              | `OrganizationMember.orgRole` da org activa |

Resolução API: `resolveEffectiveRole()` em `apps/api/src/common/effective-role.ts`  
Resolução Web: `resolveClientEffectiveRole()` em `apps/web/src/lib/effective-role-client.ts`

### Frontend — sem fallback global

`useEffectiveRole()` deriva o role de `session.user.role` + `orgRole` da org activa (`useMyOrganizations`).  
Valida em background com `GET /me/context`. Se falhar, mostra `RoleContextError` com retry — **não** usa `session.user.role` como fallback.

## Decorators de autorização

### API — roles (papel efectivo)

```typescript
import { StaffOnly, AdminOnly, PortalOnly, ImperadorOnly } from '@/common/decorators';

@StaffOnly()   // imperador, administrador, tesoureiro
@AdminOnly()   // imperador, administrador
@PortalOnly()  // socio
@ImperadorOnly()
```

Validados por `EffectiveRoleGuard` (global, após `OrganizationContextGuard`).

### API — módulos

```typescript
@RequireModule('members')
@UseGuards(ModuleGuard)
```

### API — parâmetros

```typescript
@CurrentUser() user: AuthUser        // utilizador autenticado
@OrgId() organizationId: string     // tenant validado (403 se em falta)
@EffectiveRole() role: string         // papel efectivo na org activa
```

### API — público

```typescript
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@AllowAnonymous()
```

## Ordem dos guards (global)

1. `AuthGuard` — sessão Better Auth
2. `OrganizationContextGuard` — tenant + `req.effectiveRole`
3. `EffectiveRoleGuard` — papel efectivo dos shortcuts `@StaffOnly`, etc.
4. `ModuleGuard` — só nas rotas com `@RequireModule`

## Web — protecção de rotas

`useRequireAuth()` em `(app)/layout.tsx`, `portal/layout.tsx`, `account/layout.tsx`.

- Espera `useSession()` (`isPending` / `isRefetching`)
- Redireciona para `/login` se sem sessão
- Redireciona sócio ↔ backoffice conforme `user.role` global

### Papel efectivo no frontend

Componentes:

- `useMyOrganizations()` — lista de orgs com `orgRole`
- `useBootstrapActiveOrganization()` — bootstrap antes do shell
- `useEffectiveRole()` — role efectivo (local + validação API)
- `useRequireRole({ roles })` — redirect se role efectivo insuficiente
- `RoleGate` — wrapper para páginas protegidas
- `lib/permissions.ts` — helpers (`canManageMembers`, `canAccessCards`, …)

Páginas com `RoleGate`:

| Rota                                                                    | Roles                    |
| ----------------------------------------------------------------------- | ------------------------ |
| `/dashboard`, `/members`, `/payments`, `/reports`                       | staff (`STAFF_ROLES`)    |
| `/settings`, `/cards`, `/audit`, `/communications`, `/membership-plans` | imperador, administrador |
| `/modules`                                                              | imperador                |

### Permissões de UI (exemplos)

| Acção                                  | Quem vê                               |
| -------------------------------------- | ------------------------------------- |
| Criar/editar sócios, upload foto, RGPD | `canManageMembers` (admin, imperador) |
| Exportar relatórios na página membros  | `canExportReports` (+ tesoureiro)     |
| Cartões                                | `canAccessCards` (admin, imperador)   |

## Rate limiting

| Rota              | Env                           | Default |
| ----------------- | ----------------------------- | ------- |
| `/api/auth/*`     | `RATE_LIMIT_AUTH_PER_MIN`     | 15      |
| `/api/validate/*` | `RATE_LIMIT_VALIDATE_PER_MIN` | 60      |

## Variáveis de ambiente

| Variável              | Uso                                |
| --------------------- | ---------------------------------- |
| `BETTER_AUTH_SECRET`  | Assinatura de sessão               |
| `BETTER_AUTH_URL`     | URL pública da API                 |
| `WEB_ORIGIN`          | CORS + passkey origin              |
| `PASSKEY_RP_ID`       | WebAuthn RP ID (ex.: `localhost`)  |
| `NEXT_PUBLIC_API_URL` | URL da API no browser              |
| `SEED_DEMO_PASSWORD`  | Password dos utilizadores demo/E2E |

### Utilizadores demo (seed)

| Email                   | Role(s)                                             |
| ----------------------- | --------------------------------------------------- |
| `admin@crcvale.pt`      | administrador @ CRC Vale                            |
| `tesoureiro@crcvale.pt` | tesoureiro @ CRC Vale                               |
| `multirole@crcvale.pt`  | administrador @ CRC Vale, tesoureiro @ Academia Fit |
| `joao@example.com`      | sócio                                               |

## Testes de segurança

- `test/e2e/rbac-isolation.e2e-spec.ts` — sócio vs staff, isolamento entre orgs, roles por org, imperador cross-org
- `test/e2e/organization-context.e2e-spec.ts` — guard de tenant
- `test/e2e/protected-routes.e2e-spec.ts` — rotas autenticadas
- `src/common/organization-context.service.spec.ts` — resolução de org (unit)
- `src/core/users/users.service.spec.ts` — regras de convite (unit)
- `apps/web/src/lib/nav.test.ts`, `permissions.test.ts`, `effective-role-client.test.ts` — frontend (unit)
- `apps/web/e2e/rbac.spec.ts` — tesoureiro no UI
- `apps/web/e2e/multi-org.spec.ts` — troca de org e menu por role

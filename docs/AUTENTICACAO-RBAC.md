# Autenticação e RBAC

## Better Auth

Configuração única: `apps/api/src/auth/auth.ts`

| Funcionalidade | Estado |
|----------------|--------|
| Email + password | ✅ |
| Passkey / WebAuthn | ✅ |
| Roles (admin plugin) | ✅ |
| OAuth Google/GitHub | Preparado (env vazio) |

### Roles da plataforma

| Role | Acesso |
|------|--------|
| `imperador` | Super-admin; várias orgs; activar módulos |
| `administrador` | Admin do clube |
| `tesoureiro` | Pagamentos, relatórios (sem settings sensíveis) |
| `socio` | Portal apenas |

Constantes: `apps/api/src/common/roles.ts`

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
```

Serviço: `OrganizationContextService`  
Guard: `OrganizationContextGuard`

### Quando falha (403)

- Staff sem memberships
- Header/cookie com org onde o user não tem acesso
- Sócio sem `Member` associado

### Rotas sem tenant (`@NoOrgContext`)

- `GET/POST /api/me/*`
- `GET/POST /api/organizations` (imperador)
- Rotas `@AllowAnonymous` (health, validate)

## Decorators de autorização

### API — roles

```typescript
import { StaffOnly, AdminOnly, PortalOnly, ImperadorOnly } from '@/common/decorators';

@StaffOnly()   // imperador, administrador, tesoureiro
@AdminOnly()   // imperador, administrador
@PortalOnly()  // socio
@ImperadorOnly()
```

Equivalente a `@Roles([...STAFF_ROLES])` etc.

### API — módulos

```typescript
@RequireModule('members')
@UseGuards(ModuleGuard)
```

### API — parâmetros

```typescript
@CurrentUser() user: AuthUser   // utilizador autenticado
@OrgId() organizationId: string  // tenant validado (403 se em falta)
```

### API — público

```typescript
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@AllowAnonymous()
```

## Ordem dos guards (global)

1. `AuthGuard` — sessão Better Auth
2. `OrganizationContextGuard` — tenant
3. `RolesGuard` — role do `@Roles` / shortcuts
4. `ModuleGuard` — só nas rotas com `@RequireModule`

## Web — protecção de rotas

`useRequireAuth()` em `(app)/layout.tsx`, `portal/layout.tsx`, `account/layout.tsx`.

- Espera `useSession()` (`isPending` / `isRefetching`)
- Redireciona para `/login` se sem sessão
- Redireciona sócio ↔ backoffice conforme role

## Rate limiting

| Rota | Env | Default |
|------|-----|---------|
| `/api/auth/*` | `RATE_LIMIT_AUTH_PER_MIN` | 15 |
| `/api/validate/*` | `RATE_LIMIT_VALIDATE_PER_MIN` | 60 |

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `BETTER_AUTH_SECRET` | Assinatura de sessão |
| `BETTER_AUTH_URL` | URL pública da API |
| `WEB_ORIGIN` | CORS + passkey origin |
| `PASSKEY_RP_ID` | WebAuthn RP ID (ex.: `localhost`) |
| `NEXT_PUBLIC_API_URL` | URL da API no browser |

## Testes de segurança

- `test/e2e/rbac-isolation.e2e-spec.ts` — sócio vs staff, isolamento entre orgs
- `test/e2e/organization-context.e2e-spec.ts` — guard de tenant
- `test/e2e/protected-routes.e2e-spec.ts` — rotas autenticadas

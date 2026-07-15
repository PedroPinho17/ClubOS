# Frontend Web (Next.js)

URL em desenvolvimento: `http://localhost:3000`

## Estrutura

```
apps/web/src/
├── app/                 # App Router (páginas)
│   ├── (app)/           # Backoffice com sidebar
│   ├── portal/          # Portal do sócio
│   ├── account/         # Conta do utilizador
│   ├── login/           # Autenticação
│   └── validar/         # Validação pública de QR
├── components/          # UI (shadcn-style)
├── hooks/               # React hooks (org activa, auth)
└── lib/                 # API client, auth, nav, tipos
```

## Rotas

### Públicas

| Rota                  | Ficheiro                          | Descrição                     |
| --------------------- | --------------------------------- | ----------------------------- |
| `/`                   | `app/page.tsx`                    | Redirect → `/login`           |
| `/login`              | `app/login/page.tsx`              | Email/password + passkey      |
| `/recuperar-password` | `app/recuperar-password/page.tsx` | Guia de recuperação (manual)  |
| `/privacidade`        | `app/privacidade/page.tsx`        | Política de privacidade       |
| `/dpa`                | `app/dpa/page.tsx`                | Acordo de tratamento de dados |
| `/validar/[memberId]` | `app/validar/...`                 | Validar cartão (QR público)   |

### Backoffice — grupo `(app)`

Layout: `app/(app)/layout.tsx`

- Sidebar com navegação filtrada por módulos e role
- `useRequireAuth()` — espera sessão antes de renderizar
- `OrgSwitcher` — selector de org (imperador multi-org)

| Rota                | Página           | Módulo           | Roles     |
| ------------------- | ---------------- | ---------------- | --------- |
| `/dashboard`        | dashboard        | dashboard        | staff     |
| `/members`          | members          | members          | staff     |
| `/membership-plans` | membership-plans | membership-plans | admin+    |
| `/payments`         | payments         | payments         | staff     |
| `/cards`            | cards            | cards            | admin+    |
| `/communications`   | communications   | communications   | admin+    |
| `/reports`          | reports          | reports          | staff     |
| `/audit`            | audit            | —                | admin+    |
| `/settings`         | settings         | —                | admin+    |
| `/modules`          | modules          | —                | imperador |

Definição central: `src/lib/nav.ts` → `NAV_ITEMS` + `filterNavItems()`.

### Portal do sócio

Layout: `app/portal/layout.tsx` — role `socio` apenas.

| Rota      | Descrição               |
| --------- | ----------------------- |
| `/portal` | Quotas, cartão, recibos |

### Conta

| Rota       | Descrição                          |
| ---------- | ---------------------------------- |
| `/account` | Nome, password, gestão de passkeys |

## Bibliotecas principais (`lib/`)

### `api.ts`

Cliente HTTP para a API NestJS.

- Envia `credentials: 'include'` (cookies de sessão)
- Header `x-organization-id` via `org-context.ts`
- Métodos: `api.get/post/patch/delete`, `uploadFile`, `downloadBlob`, …

### `auth-client.ts`

Cliente Better Auth (`createAuthClient`).

- `signIn`, `signOut`, `useSession`, `passkey`, `changePassword`
- Base URL: `NEXT_PUBLIC_API_URL/api/auth`

### `auth-redirect.ts`

- `postLoginPath(role)` — `/portal` para sócio, `/dashboard` para staff
- `isAdminRole`, helpers de redirect entre portal/backoffice

### `org-context.ts`

- `getActiveOrganizationId()` — lê de localStorage
- `orgRequestHeaders()` — header para pedidos API
- Evento `ORG_CHANGED_EVENT` quando o switcher muda org

## Hooks

| Hook                | Ficheiro                        | Uso                            |
| ------------------- | ------------------------------- | ------------------------------ |
| `useRequireAuth`    | `hooks/use-require-auth.ts`     | Guard de sessão nos layouts    |
| `useActiveOrgId`    | `hooks/use-active-org.ts`       | ID da org activa               |
| `useTenantQueryKey` | `hooks/use-tenant-query-key.ts` | Query keys TanStack por tenant |

## Data fetching

**TanStack Query** — cache com `staleTime` 60s, sem refetch em focus.

Padrão típico:

```tsx
const { data } = useQuery({
  queryKey: useTenantQueryKey(["members"]),
  queryFn: () => api.get<Member[]>("/members"),
  enabled: !!session && !!activeOrgId,
});
```

## Testes E2E

Playwright em `apps/web/e2e/`.

```bash
pnpm --filter @clubos/web test:e2e
```

Requer API + Web a correr e credenciais em `.env` (`SEED_DEMO_PASSWORD`).

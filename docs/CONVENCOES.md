# Convenções de desenvolvimento

## Documentar código (TSDoc ≈ Javadoc)

Usa blocos `/** ... */` em classes, métodos e funções **exportadas**:

```typescript
/**
 * Resolve a organização activa validando membership do utilizador.
 *
 * @param request - Pedido Express com `user` já autenticado
 * @returns ID da organização activa
 * @throws {ForbiddenException} Sem membership ou org não autorizada
 *
 * @example
 * const orgId = await service.resolveActiveOrganizationId(req);
 */
async resolveActiveOrganizationId(request: Request): Promise<string> { ... }
```

### Tags úteis

| Tag | Uso |
|-----|-----|
| `@param` | Parâmetro e significado |
| `@returns` | O que devolve |
| `@throws` | Excepções |
| `@example` | Exemplo de uso |
| `@module` | Descrição do ficheiro/módulo (no topo) |
| `@see` | Referência a outro símbolo ou doc |

### Onde documentar

| Prioridade | Local |
|------------|-------|
| Alta | `common/`, `auth/`, `lib/` (web), serviços públicos |
| Média | Controllers (resumo no topo do ficheiro) |
| Baixa | DTOs, tipos internos (só se não óbvio) |

## Adicionar um módulo de negócio

1. **Prisma** — modelos com `organizationId` em `schema.prisma`
2. **Migration** — `pnpm db:migrate`
3. **Seed** — entrada em `Module` (slug, category BASE)
4. **API** — `apps/api/src/modules/<nome>/`
   - `*.module.ts`, `*.controller.ts`, `*.service.ts`
   - `@RequireModule('<slug>')` + `ModuleGuard`
   - `@StaffOnly()` / `@AdminOnly()` conforme regra
5. **Registo** — import em `app.module.ts`
6. **Web** — página em `app/(app)/<rota>/page.tsx`
7. **Nav** — entrada em `lib/nav.ts` com `module: '<slug>'`
8. **Testes** — unit no service; E2E se tocar auth/tenant

## Naming

| Contexto | Convenção |
|----------|-----------|
| Ficheiros API | `kebab-case` (pastas e ficheiros) |
| Classes Nest | `PascalCase` + sufixo `Service`, `Controller`, `Module` |
| Slugs de módulo | `kebab-case` (`membership-plans`) |
| Rotas API | `/api/<recurso>` plural ou singular consistente por módulo |
| Roles | minúsculas em PT-origem: `imperador`, `administrador`, … |

## Testes

| Camada | Ferramenta | Local |
|--------|------------|-------|
| API unit | Vitest | `*.spec.ts` junto ao código |
| API E2E | Vitest + supertest | `apps/api/test/e2e/` |
| Web E2E | Playwright | `apps/web/e2e/` |

Antes de PR: `pnpm typecheck && pnpm test`

## Commits e PRs

- Mensagens em português ou inglês — consistente por PR
- Não commitar `.env`, `.next/`, credenciais
- Migrations Prisma sempre no mesmo PR que altera schema

## Lint e formato

- ESLint + TypeScript strict nos apps
- Prisma: seguir `schema-conventions` (relations, timestamps, indexes)

## Links

- [README principal](../README.md) — setup e estado do projecto
- [API Backend](API-BACKEND.md) — endpoints
- [Autenticação](AUTENTICACAO-RBAC.md) — guards e roles

# ADR 002 — Papel efectivo por organização

- **Estado:** Aceite
- **Data:** 2026-07-16

## Contexto

Um utilizador staff pode pertencer a **várias organizações** (`OrganizationMember`). Em cada org o papel pode ser diferente (ex.: administrador no CRC Vale, tesoureiro noutro clube).

O Better Auth guarda um `user.role` **global**. Se o backoffice e a API usassem só esse campo:

- um admin num clube herdaria poderes de admin em todos
- o org switcher trocaria de tenant sem trocar de permissões
- testes multi-org e isolamento RBAC falhariam ou dariam falsa segurança

## Decisão

Introduzir o conceito de **papel efectivo** na organização activa:

| Global `user.role`                     | Papel efectivo                             |
| -------------------------------------- | ------------------------------------------ |
| `socio`                                | sempre `socio`                             |
| `imperador`                            | sempre `imperador`                         |
| staff (`administrador` / `tesoureiro`) | `OrganizationMember.orgRole` da org activa |

Implementação:

- API: `resolveEffectiveRole()` → `EffectiveRoleGuard` + decorator `@EffectiveRole()`
- Web: `useEffectiveRole()` / `resolveClientEffectiveRole()` — **sem** fallback silencioso para `session.user.role`
- Validação: `GET /api/me/context` confirma `{ organizationId, effectiveRole }`
- Bootstrap: `useBootstrapActiveOrganization()` garante org activa antes do shell

Decorators `@StaffOnly`, `@AdminOnly`, etc. avaliam o papel **efectivo**, não o global.

## Consequências

**Positivas**

- Permissões correctas por tenant em multi-org
- Nav, `RoleGate` e API alinhados com a mesma regra
- Falhas de contexto mostram erro com retry em vez de UI “mentirosa”

**Negativas / trade-offs**

- Mais um conceito para onboarding (`user.role` vs `orgRole` vs efectivo)
- Frontend precisa de org activa resolvida antes de decidir o que mostrar
- Imperador continua a ser excepção (plataforma) — documentado e testado à parte

**Não fazer**

- Não usar `session.user.role` como fallback na UI quando `/me/context` falha
- Não autorizar só com o header `x-organization-id` sem validar membership

Detalhe operacional: [Autenticação e RBAC](../AUTENTICACAO-RBAC.md).

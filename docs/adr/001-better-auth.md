# ADR 001 — Better Auth como camada de autenticação

- **Estado:** Aceite
- **Data:** 2026-07-16

## Contexto

O ClubOS precisa de autenticação multi-tenant com:

- email + password
- passkeys (WebAuthn)
- roles de plataforma (`imperador`, `administrador`, `tesoureiro`, `socio`)
- sessões em cookie partilhadas entre Next.js e NestJS
- reset de password por email
- caminho preparado para OAuth (Google/GitHub)

Alternativas consideradas:

| Opção                        | Prós                                                            | Contras                                                                 |
| ---------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Auth.js / NextAuth só no web | Ecossistema Next familiar                                       | Sessão centrada no frontend; Nest teria de revalidar ou duplicar lógica |
| Passport + JWT custom        | Controlo total no Nest                                          | Mais código, passkeys/OAuth/admin a construir à mão                     |
| Clerk / Auth0                | Rápido a arrancar                                               | Vendor lock-in, custo, menos encaixe com org activa própria             |
| **Better Auth**              | TypeScript-first, plugins (admin, passkey), API própria no Nest | Biblioteca relativamente nova                                           |

## Decisão

Usar **Better Auth** como fonte única de autenticação, instanciada na API (`apps/api/src/auth/auth.ts`) e consumida pelo web via `auth-client.ts` (`NEXT_PUBLIC_API_URL/api/auth`).

- Sessões por cookie HTTP-only no domínio da API
- Plugin admin para roles
- Plugin passkey para WebAuthn
- `sendResetPassword` integrado com `MailService` / SMTP
- Integração Nest via `@thallesp/nestjs-better-auth` (`@AllowAnonymous`, guards de sessão)

A **autorização de negócio** (org activa, módulos, papel efectivo) continua a ser nossa — Better Auth autentica; os guards Nest autorizam.

## Consequências

**Positivas**

- Uma só configuração de auth (não duplicar no Next e no Nest)
- Passkeys e reset de password sem reinventar o protocolo
- Alinhado com o modelo cookie + CORS já usado no monorepo

**Negativas / trade-offs**

- Dependência de uma biblioteca em evolução rápida
- Documentação e exemplos externos menos maduros que Passport/Auth0
- OAuth fica “preparado” (env) até haver necessidade de produto

**Não fazer**

- Não implementar um segundo sistema de sessões no Next
- Não confiar só em `user.role` global para RBAC de backoffice — ver [ADR 002](002-effective-role-por-org.md)

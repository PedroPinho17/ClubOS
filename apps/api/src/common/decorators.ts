/**
 * @module Decorators
 * Decorators NestJS partilhados: `@OrgId`, `@CurrentUser`, `@RequireModule`
 * e re-exports de shortcuts RBAC e `@NoOrgContext`.
 */
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import { getActiveOrganizationId } from './org-context';
import type { AuthUser } from './types';

export { NoOrgContext, NO_ORG_CONTEXT_KEY } from './decorators/no-org-context';
export {
  AdminOnly,
  ImperadorOnly,
  PortalOnly,
  StaffOnly,
} from './decorators/roles-shortcuts';

export const REQUIRED_MODULE_KEY = 'requiredModule';

/**
 * Exige que o modulo esteja activo na organizacao actual.
 * Combinar com `ModuleGuard` no controller.
 *
 * @param slug - Slug do modulo (ex.: `'members'`, `'payments'`)
 */
export const RequireModule = (slug: string) => SetMetadata(REQUIRED_MODULE_KEY, slug);

/**
 * Injeta o utilizador autenticado (Better Auth) a partir de `req.user`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthUser;
  },
);

/**
 * Injeta o `organizationId` do tenant actual (ja validado pelo guard).
 *
 * @throws {ForbiddenException} Se o contexto de org nao foi resolvido
 */
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return getActiveOrganizationId(request);
});

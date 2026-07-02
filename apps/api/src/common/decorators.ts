import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from './types';

export const REQUIRED_MODULE_KEY = 'requiredModule';
/** Exige que o modulo esteja ativo na organizacao atual (ex.: 'members'). */
export const RequireModule = (slug: string) => SetMetadata(REQUIRED_MODULE_KEY, slug);

/** Injeta o utilizador autenticado (Better Auth). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthUser;
  },
);

/** Injeta o organizationId do contexto (tenant atual). */
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user as AuthUser | undefined;
  const orgId =
    user?.organizationId ?? (request.headers['x-organization-id'] as string | undefined);
  if (!orgId) {
    throw new ForbiddenException('Contexto de organizacao em falta.');
  }
  return orgId;
});

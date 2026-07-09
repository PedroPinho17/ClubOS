import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { NO_ORG_CONTEXT_KEY } from '../decorators/no-org-context';
import { OrganizationContextService } from '../organization-context.service';

const PUBLIC_ROUTE_KEY = 'PUBLIC';

/**
 * Resolve e valida a organizacao activa antes dos handlers/guards de modulo.
 * Corre depois do AuthGuard (req.user ja existe).
 */
@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(
    private readonly orgContext: OrganizationContextService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user?.id) {
      return true;
    }

    const skipOrgContext = this.reflector.getAllAndOverride<boolean>(NO_ORG_CONTEXT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipOrgContext || isPublic) {
      return true;
    }

    try {
      request.activeOrganizationId = await this.orgContext.resolveActiveOrganizationId(request);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Nao foi possivel resolver o contexto de organizacao.');
    }
  }
}

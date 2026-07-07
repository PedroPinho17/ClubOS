import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { OrganizationContextService } from '../organization-context.service';

/**
 * Resolve e valida a organizacao activa antes dos handlers/guards de modulo.
 * Corre depois do AuthGuard (req.user ja existe).
 */
@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly orgContext: OrganizationContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user?.id) {
      return true;
    }

    try {
      request.activeOrganizationId = await this.orgContext.resolveActiveOrganizationId(request);
    } catch {
      // Rotas sem @OrgId() (ex.: GET /me/organizations) podem continuar.
    }

    return true;
  }
}

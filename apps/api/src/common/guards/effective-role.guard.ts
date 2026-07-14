import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { CLUBOS_EFFECTIVE_ROLES_KEY } from "../decorators/roles-shortcuts";
import { NO_ORG_CONTEXT_KEY } from "../decorators/no-org-context";

/**
 * Valida RBAC com base no papel efectivo por organizacao.
 * Corre depois de {@link OrganizationContextGuard} (org + effectiveRole).
 */
@Injectable()
export class EffectiveRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      CLUBOS_EFFECTIVE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user?.id) {
      return true;
    }

    const skipOrgContext = this.reflector.getAllAndOverride<boolean>(
      NO_ORG_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const role =
      skipOrgContext || !request.activeOrganizationId
        ? user.role
        : (request.effectiveRole ?? user.role);

    if (role && requiredRoles.includes(role)) {
      return true;
    }

    throw new ForbiddenException("Sem permissao para aceder a este recurso.");
  }
}

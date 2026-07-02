import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRED_MODULE_KEY } from '../decorators';
import type { AuthUser } from '../types';

/**
 * Garante que o modulo exigido pela rota esta ativo na organizacao atual.
 * Modulos core estao sempre ativos. Corre depois do AuthGuard global do
 * Better Auth (que popula `req.user`).
 */
@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const slug = this.reflector.getAllAndOverride<string>(REQUIRED_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!slug) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;
    const organizationId =
      user?.organizationId ?? (request.headers['x-organization-id'] as string | undefined);

    if (!organizationId) {
      throw new ForbiddenException('Contexto de organizacao em falta.');
    }

    const module = await this.prisma.module.findUnique({ where: { slug } });
    if (!module) {
      throw new ForbiddenException(`Modulo "${slug}" desconhecido.`);
    }
    if (module.isCore) {
      return true;
    }

    const orgModule = await this.prisma.organizationModule.findUnique({
      where: { organizationId_moduleId: { organizationId, moduleId: module.id } },
    });
    if (!orgModule || !orgModule.enabled) {
      throw new ForbiddenException(`Modulo "${slug}" nao esta ativo nesta organizacao.`);
    }
    return true;
  }
}

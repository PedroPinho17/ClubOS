import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REQUIRED_MODULE_KEY } from '../decorators';
import { ModuleGuard } from './module.guard';

function createContext(activeOrganizationId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ activeOrganizationId }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

describe('ModuleGuard', () => {
  const prisma = {
    module: { findUnique: vi.fn() },
    organizationModule: { findUnique: vi.fn() },
  };
  const reflector = { getAllAndOverride: vi.fn() };
  const guard = new ModuleGuard(reflector as unknown as Reflector, prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passa quando a rota nao exige modulo', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext('org-1'))).resolves.toBe(true);
    expect(prisma.module.findUnique).not.toHaveBeenCalled();
  });

  it('passa para modulos core sem verificar organizationModule', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_MODULE_KEY ? 'dashboard' : undefined,
    );
    prisma.module.findUnique.mockResolvedValue({ id: 'm1', slug: 'dashboard', isCore: true });

    await expect(guard.canActivate(createContext('org-1'))).resolves.toBe(true);
    expect(prisma.organizationModule.findUnique).not.toHaveBeenCalled();
  });

  it('passa quando o modulo esta activo na organizacao', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_MODULE_KEY ? 'members' : undefined,
    );
    prisma.module.findUnique.mockResolvedValue({ id: 'm2', slug: 'members', isCore: false });
    prisma.organizationModule.findUnique.mockResolvedValue({ enabled: true });

    await expect(guard.canActivate(createContext('org-1'))).resolves.toBe(true);
  });

  it('bloqueia modulo desconhecido', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_MODULE_KEY ? 'football' : undefined,
    );
    prisma.module.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(createContext('org-1'))).rejects.toThrow(
      new ForbiddenException('Modulo "football" desconhecido.'),
    );
  });

  it('bloqueia modulo inactivo na organizacao', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_MODULE_KEY ? 'reports' : undefined,
    );
    prisma.module.findUnique.mockResolvedValue({ id: 'm3', slug: 'reports', isCore: false });
    prisma.organizationModule.findUnique.mockResolvedValue({ enabled: false });

    await expect(guard.canActivate(createContext('org-1'))).rejects.toThrow(
      new ForbiddenException('Modulo "reports" nao esta ativo nesta organizacao.'),
    );
  });

  it('bloqueia quando falta contexto de organizacao', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_MODULE_KEY ? 'members' : undefined,
    );

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      new ForbiddenException('Contexto de organizacao em falta.'),
    );
  });
});

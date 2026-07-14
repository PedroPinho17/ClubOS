import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NO_ORG_CONTEXT_KEY } from "../decorators/no-org-context";
import { OrganizationContextGuard } from "./organization-context.guard";

type MockRequest = Request & {
  activeOrganizationId?: string;
  user?: { id: string };
};

describe("OrganizationContextGuard", () => {
  const orgContext = {
    resolveActiveOrganizationId: vi.fn(),
    resolveEffectiveRole: vi.fn(),
  };

  beforeEach(() => {
    orgContext.resolveActiveOrganizationId.mockReset();
    orgContext.resolveEffectiveRole.mockReset();
  });

  function createGuard(metadata: Record<string, unknown> = {}) {
    const reflector = {
      getAllAndOverride: vi.fn((key: string) => metadata[key]),
    };
    const guard = new OrganizationContextGuard(
      orgContext as never,
      reflector as unknown as Reflector,
    );

    const request: MockRequest = {
      user: { id: "user-1" },
      headers: {},
    } as MockRequest;

    const context = {
      switchToHttp: () => ({ getRequest: (): MockRequest => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return { guard, request, context, reflector };
  }

  it("define activeOrganizationId quando a resolucao tem sucesso", async () => {
    orgContext.resolveActiveOrganizationId.mockResolvedValue("org-1");
    orgContext.resolveEffectiveRole.mockResolvedValue("administrador");
    const { guard, request, context } = createGuard();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.activeOrganizationId).toBe("org-1");
    expect(request.effectiveRole).toBe("administrador");
  });

  it("propaga ForbiddenException em rotas tenant-aware", async () => {
    orgContext.resolveActiveOrganizationId.mockRejectedValue(
      new ForbiddenException("Sem permissao para aceder a esta organizacao."),
    );
    const { guard, context } = createGuard();

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("ignora falha de contexto em rotas @NoOrgContext", async () => {
    orgContext.resolveActiveOrganizationId.mockRejectedValue(
      new ForbiddenException("Sem organizacoes associadas a esta conta."),
    );
    const { guard, request, context } = createGuard({
      [NO_ORG_CONTEXT_KEY]: true,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.activeOrganizationId).toBeUndefined();
  });
});

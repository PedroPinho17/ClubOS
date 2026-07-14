import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "../types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLUBOS_EFFECTIVE_ROLES_KEY } from "../decorators/roles-shortcuts";
import { NO_ORG_CONTEXT_KEY } from "../decorators/no-org-context";
import { EffectiveRoleGuard } from "./effective-role.guard";

type MockRequest = Request & {
  user?: AuthUser;
  activeOrganizationId?: string;
  effectiveRole?: string;
};

const staffUser = (role: string): AuthUser => ({
  id: "u1",
  email: "u1@test.local",
  name: "Staff",
  role,
});

describe("EffectiveRoleGuard", () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  const guard = new EffectiveRoleGuard(reflector as never);

  function createContext(request: MockRequest): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it("permite rotas sem metadata de roles", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const request = { user: staffUser("tesoureiro") } as MockRequest;
    expect(guard.canActivate(createContext(request))).toBe(true);
  });

  it("usa effectiveRole na org activa", () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === CLUBOS_EFFECTIVE_ROLES_KEY) {
        return ["administrador", "imperador"];
      }
      return undefined;
    });
    const request = {
      user: staffUser("tesoureiro"),
      activeOrganizationId: "org-a",
      effectiveRole: "administrador",
    } as MockRequest;
    expect(guard.canActivate(createContext(request))).toBe(true);
  });

  it("rejeita quando effectiveRole nao bate certo", () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === CLUBOS_EFFECTIVE_ROLES_KEY) {
        return ["administrador"];
      }
      return undefined;
    });
    const request = {
      user: staffUser("tesoureiro"),
      activeOrganizationId: "org-a",
      effectiveRole: "tesoureiro",
    } as MockRequest;
    expect(() => guard.canActivate(createContext(request))).toThrow(
      ForbiddenException,
    );
  });

  it("rejeita pedidos sem utilizador autenticado", () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === CLUBOS_EFFECTIVE_ROLES_KEY) {
        return ["administrador"];
      }
      return undefined;
    });
    const request = {} as MockRequest;
    expect(() => guard.canActivate(createContext(request))).toThrow(
      ForbiddenException,
    );
  });

  it("usa user.role global em rotas @NoOrgContext", () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === CLUBOS_EFFECTIVE_ROLES_KEY) {
        return ["imperador"];
      }
      if (key === NO_ORG_CONTEXT_KEY) {
        return true;
      }
      return undefined;
    });
    const request = { user: staffUser("imperador") } as MockRequest;
    expect(guard.canActivate(createContext(request))).toBe(true);
  });
});

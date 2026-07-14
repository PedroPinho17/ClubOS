import { describe, expect, it } from "vitest";
import {
  canAccessCards,
  canExportReports,
  canInviteAdmin,
  canManageMembers,
  isImperador,
} from "./permissions";

describe("permissions", () => {
  it("canManageMembers so para admin e imperador", () => {
    expect(canManageMembers("administrador")).toBe(true);
    expect(canManageMembers("imperador")).toBe(true);
    expect(canManageMembers("tesoureiro")).toBe(false);
  });

  it("canExportReports inclui tesoureiro", () => {
    expect(canExportReports("tesoureiro")).toBe(true);
    expect(canExportReports("socio")).toBe(false);
  });

  it("canAccessCards so para admin e imperador", () => {
    expect(canAccessCards("administrador")).toBe(true);
    expect(canAccessCards("tesoureiro")).toBe(false);
  });

  it("canInviteAdmin so imperador", () => {
    expect(canInviteAdmin("imperador")).toBe(true);
    expect(canInviteAdmin("administrador")).toBe(false);
  });

  it("isImperador", () => {
    expect(isImperador("imperador")).toBe(true);
    expect(isImperador("administrador")).toBe(false);
  });
});

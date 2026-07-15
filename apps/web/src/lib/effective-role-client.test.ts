import { describe, expect, it } from "vitest";
import { resolveClientEffectiveRole } from "./effective-role-client";
import type { MyOrganization } from "./types";

describe("resolveClientEffectiveRole", () => {
  const orgs: MyOrganization[] = [
    {
      id: "org-a",
      name: "A",
      slug: "a",
      orgRole: "administrador",
      plan: "FREE",
      status: "ACTIVE",
      primaryColor: "#000",
    },
    {
      id: "org-b",
      name: "B",
      slug: "b",
      orgRole: "tesoureiro",
      plan: "FREE",
      status: "ACTIVE",
      primaryColor: "#000",
    },
  ];

  it("socio e imperador usam role global", () => {
    expect(resolveClientEffectiveRole("socio", "org-a", orgs)).toBe("socio");
    expect(resolveClientEffectiveRole("imperador", "org-b", orgs)).toBe(
      "imperador",
    );
  });

  it("staff usa orgRole da org activa", () => {
    expect(resolveClientEffectiveRole("administrador", "org-a", orgs)).toBe(
      "administrador",
    );
    expect(resolveClientEffectiveRole("administrador", "org-b", orgs)).toBe(
      "tesoureiro",
    );
  });

  it("sem org activa ou membership devolve null", () => {
    expect(resolveClientEffectiveRole("administrador", null, orgs)).toBeNull();
    expect(resolveClientEffectiveRole("tesoureiro", "org-x", orgs)).toBeNull();
  });
});

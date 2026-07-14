import { describe, expect, it } from "vitest";
import { filterNavItems, NAV_ITEMS } from "./nav";

describe("filterNavItems", () => {
  const allModules = new Set(
    NAV_ITEMS.map((i) => i.module).filter(Boolean) as string[],
  );

  it("tesoureiro nao ve rotas admin-only", () => {
    const visible = filterNavItems(NAV_ITEMS, allModules, "tesoureiro");
    const hrefs = visible.map((i) => i.href);
    expect(hrefs).not.toContain("/settings");
    expect(hrefs).not.toContain("/cards");
    expect(hrefs).toContain("/payments");
  });

  it("administrador ve settings e cards", () => {
    const visible = filterNavItems(NAV_ITEMS, allModules, "administrador");
    const hrefs = visible.map((i) => i.href);
    expect(hrefs).toContain("/settings");
    expect(hrefs).toContain("/cards");
    expect(hrefs).not.toContain("/modules");
  });

  it("imperador ve modulos", () => {
    const visible = filterNavItems(NAV_ITEMS, allModules, "imperador");
    expect(visible.map((i) => i.href)).toContain("/modules");
  });

  it("oculta itens quando modulo inactivo", () => {
    const enabled = new Set(["dashboard", "members"]);
    const visible = filterNavItems(NAV_ITEMS, enabled, "administrador");
    const hrefs = visible.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).not.toContain("/payments");
  });
});

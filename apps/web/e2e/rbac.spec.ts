import { expect, test } from "@playwright/test";
import { loginAsTreasurer } from "./helpers";

test.describe("RBAC no frontend", () => {
  test("tesoureiro ve pagamentos mas nao definicoes", async ({ page }) => {
    await loginAsTreasurer(page);

    await expect(page.getByRole("link", { name: "Pagamentos" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Definições" }),
    ).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Cartões" })).not.toBeVisible();
  });

  test("tesoureiro redirecionado de /settings", async ({ page }) => {
    await loginAsTreasurer(page);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("tesoureiro acede a pagamentos", async ({ page }) => {
    await loginAsTreasurer(page);
    await page.goto("/payments");
    await expect(
      page.getByRole("heading", { name: "Pagamentos", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("tesoureiro nao ve accoes de gestao em membros", async ({ page }) => {
    await loginAsTreasurer(page);
    await page.goto("/members");
    await expect(page.getByPlaceholder("Pesquisar sócios...")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Acções" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Adicionar sócio" }),
    ).not.toBeVisible();
  });
});

import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("RGPD na UI", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/members");
    await expect(page.getByPlaceholder("Pesquisar sócios...")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("export RGPD rapido na tabela", async ({ page }) => {
    await page.getByRole("button", { name: "Acções" }).first().click();
    const exportItem = page.getByRole("menuitem", { name: "Exportar RGPD" });
    await expect(exportItem).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportItem.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/gdpr-export-.+\.json/);
  });

  test("area RGPD no painel de edicao", async ({ page }) => {
    await page.getByRole("button", { name: "Acções" }).first().click();
    await page.getByRole("menuitem", { name: "Editar sócio" }).click();
    await expect(page.getByRole("heading", { name: "RGPD" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: "Apagar dados RGPD" }),
    ).toBeVisible();
  });
});

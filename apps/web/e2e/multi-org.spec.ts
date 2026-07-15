import { expect, test } from "@playwright/test";
import { loginAsMultiRole, navLink } from "./helpers";

test.describe("Troca de organizacao", () => {
  test("menu reflecte role diferente por org", async ({ page }) => {
    await loginAsMultiRole(page);

    const orgSelect = page
      .locator("#org-switcher-mobile, aside select")
      .first();
    await expect(orgSelect).toBeVisible({ timeout: 15_000 });

    await expect(navLink(page, "Definições")).toBeVisible();

    const academiaOption = orgSelect.locator("option", {
      hasText: "Academia Fit",
    });
    await expect(academiaOption).toHaveCount(1);
    await orgSelect.selectOption({ label: "Academia Fit Lisboa" });

    await expect(navLink(page, "Definições")).not.toBeVisible({
      timeout: 15_000,
    });
    await expect(navLink(page, "Pagamentos")).toBeVisible();

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});

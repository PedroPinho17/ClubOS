import { expect, test } from "@playwright/test";

test.describe("Membros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("lista de socios carrega", async ({ page }) => {
    await page.goto("/members");
    await expect(page.getByRole("heading", { name: "Membros" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByPlaceholder("Pesquisar sócios...")).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Nome" }),
    ).toBeVisible();
    await expect(
      page.getByText("Sem sócios.").or(page.locator("tbody tr").first()),
    ).toBeVisible({
      timeout: 20_000,
    });
  });

  test("navegacao dashboard a partir da sidebar", async ({ page }) => {
    await page.goto("/members");
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
});

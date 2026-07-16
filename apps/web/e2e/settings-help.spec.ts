import { expect, test } from "@playwright/test";

test.describe("Definições e ajuda", () => {
  test("admin ve definicoes e botao de ajuda", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Definições" })).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(page.getByRole("button", { name: /Ajuda/i })).toBeVisible();
    await page.getByRole("button", { name: /Ajuda/i }).click();
    await expect(
      page.getByRole("heading", { name: "Como usar o ClubOS" }),
    ).toBeVisible();
  });
});

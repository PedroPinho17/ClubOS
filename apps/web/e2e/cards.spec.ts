import { expect, test } from "@playwright/test";

test.describe("Cartoes", () => {
  test("mostra preview e campos visiveis", async ({ page }) => {
    await page.goto("/cards");
    await expect(
      page.getByRole("heading", { name: "Cartões de Sócio" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[class*="rounded-[24px]"]').first()).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(page.getByText("Campos visíveis")).toBeVisible();
    await expect(page.getByRole("button", { name: /PNG/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Guardar definições" }),
    ).toBeVisible();
  });
});

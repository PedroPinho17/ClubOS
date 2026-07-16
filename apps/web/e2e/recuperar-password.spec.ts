import { expect, test } from "@playwright/test";

test.describe("Recuperar password", () => {
  test("formulario de pedido de reset e acessivel a partir do login", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci a password" }).click();
    await expect(page).toHaveURL(/\/recuperar-password/);
    await expect(
      page.getByRole("heading", { name: "Recuperar password" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email da conta")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enviar link por email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sem email? Fluxo manual" }),
    ).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('pagina de login renderiza', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Política de privacidade|Politica de privacidade/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('credenciais invalidas mostram erro', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nao-existe@test.clubos.local');
    await page.getByLabel('Password').fill('PasswordErrada1!');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByText(/invalid|credenciais|incorret|demasiados/i)).toBeVisible({ timeout: 15_000 });
  });
});

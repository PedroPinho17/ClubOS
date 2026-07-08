import { expect, test } from '@playwright/test';
import { E2E_USER_EMAIL, requireE2EPassword } from './helpers';

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('pagina de login e credenciais validas', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Politica de privacidade' })).toBeVisible();

    await page.getByLabel('Email').fill(E2E_USER_EMAIL);
    await page.getByLabel('Password').fill(requireE2EPassword());
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('credenciais invalidas mostram erro', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nao-existe@test.clubos.local');
    await page.getByLabel('Password').fill('PasswordErrada1!');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByText(/invalid|credenciais|incorret/i)).toBeVisible({ timeout: 15_000 });
  });
});

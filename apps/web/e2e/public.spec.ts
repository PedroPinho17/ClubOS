import { expect, test } from '@playwright/test';

test.describe('Paginas publicas', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('/privacidade', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByRole('heading', { name: 'Politica de privacidade' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao login' })).toBeVisible();
  });

  test('/dpa', async ({ page }) => {
    await page.goto('/dpa');
    await expect(page.getByRole('heading', { name: /Acordo de tratamento de dados/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Politica de privacidade' })).toBeVisible();
  });
});

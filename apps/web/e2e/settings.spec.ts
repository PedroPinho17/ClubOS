import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Definicoes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Definições' })).toBeVisible({ timeout: 20_000 });
  });

  test('lembretes de quota configuraveis', async ({ page }) => {
    await expect(page.getByText('Lembretes de quota')).toBeVisible();
    await expect(page.getByRole('spinbutton')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar lembretes' })).toBeVisible();
  });
});

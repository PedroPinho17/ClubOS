import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Cartoes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/cards');
    await expect(page.getByRole('heading', { name: 'Cartões de Sócio' })).toBeVisible({ timeout: 20_000 });
  });

  test('mostra preview do cartao do membro', async ({ page }) => {
    await expect(page.locator('[class*="rounded-[24px]"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('export PNG disponivel', async ({ page }) => {
    await expect(page.getByRole('button', { name: /PNG/i })).toBeVisible();
  });
});

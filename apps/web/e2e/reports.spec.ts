import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Relatorios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
  });

  test('mostra overview e quotas', async ({ page }) => {
    await expect(page.getByText('Situação de quotas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Receita', exact: true })).toBeVisible();
  });

  test('botoes de export CSV', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'CSV Sócios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'CSV Pagamentos' })).toBeVisible();
  });
});

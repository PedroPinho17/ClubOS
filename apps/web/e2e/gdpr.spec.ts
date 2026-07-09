import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('RGPD na UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/members');
    await expect(page.getByPlaceholder('Pesquisar membros...')).toBeVisible({ timeout: 20_000 });
  });

  test('export RGPD rapido na tabela', async ({ page }) => {
    const exportBtn = page.getByTitle('Exportar RGPD').first();
    await expect(exportBtn).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([page.waitForEvent('download'), exportBtn.click()]);
    expect(download.suggestedFilename()).toMatch(/gdpr-export-.+\.json/);
  });

  test('area RGPD no painel de edicao', async ({ page }) => {
    await page.getByTitle('Editar').first().click();
    await expect(page.getByRole('heading', { name: 'RGPD' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Apagar dados RGPD' })).toBeVisible();
  });
});

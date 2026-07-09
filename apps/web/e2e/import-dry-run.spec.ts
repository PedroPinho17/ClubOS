import { expect, test } from '@playwright/test';

test.describe('Import Excel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 });
  });

  test('simulacao dry-run mostra painel de resultado', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible({ timeout: 20_000 });

    await page.getByLabel('Simular importação (dry-run)').check();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Simular importação' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('e2e/fixtures/import-dry-run.xlsx');

    await expect(page.getByRole('button', { name: /A simular/i })).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('import-result-panel')).toBeVisible();
    await expect(page.getByText(/Simulação concluída/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
  });
});

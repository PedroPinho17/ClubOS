import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const fixturePath = join(__dirname, 'fixtures', 'import-dry-run.xlsx');

test.describe('Import Excel', () => {
  test('simulacao dry-run na pagina de membros', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/simula|dry-run|criados|ignorados/i);
      await dialog.accept();
    });

    await page.goto('/members');
    await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible();

    await page.getByLabel('Simular importação (dry-run)').check();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Simular importação' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);

    await expect(page.getByRole('button', { name: /A simular/i })).toBeHidden({ timeout: 30_000 });
  });
});

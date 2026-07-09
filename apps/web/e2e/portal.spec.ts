import { expect, test } from '@playwright/test';

test.describe('Portal do socio', () => {
  test.use({ storageState: 'e2e/.auth/socio.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByRole('heading', { name: 'Joao Silva' })).toBeVisible({ timeout: 20_000 });
  });

  test('mostra branding da organizacao no header', async ({ page }) => {
    await expect(page.getByText('CRC Vale').first()).toBeVisible();
  });

  test('mostra dados do socio e pagamentos', async ({ page }) => {
    await expect(page.getByText('Quota Mensal')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Os meus pagamentos' })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('socio nao acede ao backoffice', async ({ page }) => {
    await page.goto('/members');
    await expect(page).toHaveURL(/\/portal/, { timeout: 15_000 });
  });

  test('pagamento pago mostra botao de recibo PDF', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'PDF' }).first()).toBeVisible({ timeout: 20_000 });
  });
});

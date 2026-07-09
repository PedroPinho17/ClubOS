import { expect, test } from '@playwright/test';

test.describe('Portal mobile', () => {
  test.use({ storageState: 'e2e/.auth/socio.json' });

  test('layout mobile com cartao, branding e pagamentos', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText('CRC Vale').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Joao Silva' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'O meu cartão' })).toBeVisible();
    await page.getByRole('heading', { name: 'Os meus pagamentos' }).scrollIntoViewIfNeeded();
    const receiptBtn = page.getByRole('button', { name: /Descarregar recibo|PDF/i }).first();
    await expect(receiptBtn).toBeVisible({ timeout: 15_000 });
  });
});

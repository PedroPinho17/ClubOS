import { expect, test } from '@playwright/test';

test.describe('Pagamentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 });
  });

  test('regista pagamento para socio existente', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: 'Pagamentos' })).toBeVisible({ timeout: 20_000 });

    const memberSelect = page.locator('select').first();
    await expect(memberSelect.locator('option').nth(1)).toHaveText(/.+ - .+/, { timeout: 20_000 });
    await memberSelect.selectOption({ index: 1 });

    await page.getByRole('spinbutton').fill('12.50');
    await page.locator('select').nth(1).selectOption('TRANSFER');

    await page.getByRole('button', { name: 'Registar pagamento' }).click();
    await expect(page.getByRole('button', { name: 'Registar pagamento' })).toBeVisible({ timeout: 20_000 });

    await expect(page.locator('tbody').getByText('12.50 €').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tbody').getByText('Transferência').first()).toBeVisible();
  });
});

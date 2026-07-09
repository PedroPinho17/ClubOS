import { expect, test } from '@playwright/test';

test.describe('Login mobile', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('formulario confortavel em viewport mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

    const submit = page.getByRole('button', { name: 'Entrar', exact: true });
    await expect(submit).toBeVisible();

    const box = await submit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await expect(page.getByRole('link', { name: 'Política de privacidade' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'DPA' })).toBeVisible();
  });
});

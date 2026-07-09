import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Comunicacoes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/communications');
    await expect(page.getByRole('heading', { name: 'Comunicações' })).toBeVisible();
  });

  test('preview de email e historico', async ({ page }) => {
    await page.locator('label:text-is("Assunto")').locator('..').locator('input').fill('Teste E2E Comunicações');
    await page.locator('textarea').fill('Mensagem de teste automatizado.');
    await page.getByRole('button', { name: 'Pré-visualizar email' }).click();
    await expect(page.getByText('Pré-visualização do email')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('João Exemplo')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico (email)' })).toBeVisible();
  });

  test('preview whatsapp mostra contagem', async ({ page }) => {
    await page.getByRole('button', { name: 'WhatsApp' }).click();
    await page.locator('textarea').fill('Olá, teste WhatsApp.');
    await expect(page.getByText(/Destinatários:/)).toBeVisible({ timeout: 10_000 });
  });
});

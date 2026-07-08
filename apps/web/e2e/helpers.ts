import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { expect, type Page } from '@playwright/test';

const rootEnv = resolve(__dirname, '../../../.env');
if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export const E2E_USER_EMAIL = readEnv('E2E_USER_EMAIL') ?? 'admin@crcvale.pt';
export const E2E_USER_PASSWORD = readEnv('E2E_USER_PASSWORD') ?? readEnv('SEED_DEMO_PASSWORD') ?? '';

export function requireE2EPassword(): string {
  if (!E2E_USER_PASSWORD || E2E_USER_PASSWORD.length < 8) {
    throw new Error(
      'Defina E2E_USER_PASSWORD ou SEED_DEMO_PASSWORD (min. 8 caracteres) para os testes Playwright.',
    );
  }
  return E2E_USER_PASSWORD;
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_USER_EMAIL);
  await page.getByLabel('Password').fill(requireE2EPassword());
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

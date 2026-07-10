import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { expect, type Page } from "@playwright/test";

const rootEnv = resolve(__dirname, "../../../.env");
if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export const E2E_USER_EMAIL = readEnv("E2E_USER_EMAIL") ?? "admin@crcvale.pt";
export const E2E_SOCIO_EMAIL = readEnv("E2E_SOCIO_EMAIL") ?? "joao@example.com";
/** Password dos testes E2E — alinhada com `pnpm db:seed` / `seed:users`. */
export const E2E_USER_PASSWORD =
  readEnv("SEED_DEMO_PASSWORD") ?? readEnv("E2E_USER_PASSWORD") ?? "";

export function requireE2EPassword(): string {
  if (!E2E_USER_PASSWORD || E2E_USER_PASSWORD.length < 8) {
    throw new Error(
      "Defina SEED_DEMO_PASSWORD (min. 8 caracteres) para os testes Playwright.",
    );
  }
  return E2E_USER_PASSWORD;
}

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

export async function loginAsAdmin(page: Page) {
  await submitLogin(page, E2E_USER_EMAIL, requireE2EPassword());
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 20_000,
  });
}

export async function loginAsSocio(page: Page) {
  await submitLogin(page, E2E_SOCIO_EMAIL, requireE2EPassword());
  await expect(page).toHaveURL(/\/portal/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Joao Silva/i })).toBeVisible({
    timeout: 15_000,
  });
}

/** Select de sócio com carregamento lazy (pagamentos). */
export async function selectMemberInPaymentsForm(
  page: Page,
  options?: { memberName?: string; index?: number },
) {
  const memberSelect = page.locator("#register-payment-form select").first();
  await memberSelect.click();

  await expect(memberSelect.locator("option").nth(1)).toHaveText(/.+ - .+/, {
    timeout: 20_000,
  });

  if (options?.memberName) {
    await memberSelect.selectOption({ label: options.memberName });
  } else {
    await memberSelect.selectOption({ index: options?.index ?? 1 });
  }
}

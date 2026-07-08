import { test as setup } from '@playwright/test';
import { loginAsAdmin } from './helpers';

setup('autenticar administrador', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});

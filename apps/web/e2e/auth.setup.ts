import { test as setup } from '@playwright/test';
import { loginAsAdmin, loginAsSocio } from './helpers';

setup('autenticar administrador', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});

setup('autenticar socio', async ({ page }) => {
  await loginAsSocio(page);
  await page.context().storageState({ path: 'e2e/.auth/socio.json' });
});

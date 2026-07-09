import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';

const repoRoot = join(process.cwd(), '../..');
const envPath = join(repoRoot, '.env');
if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

const skipWebServer = process.env.E2E_SKIP_WEBSERVER === 'true';
const useProdServers = process.env.CI === 'true' || process.env.E2E_USE_PROD_SERVERS === 'true';
const apiCommand = useProdServers
  ? 'pnpm --filter @clubos/api start'
  : 'pnpm --filter @clubos/api dev';
const webCommand = useProdServers
  ? 'pnpm --filter @clubos/web start'
  : 'pnpm --filter @clubos/web dev';
const serverTimeout = useProdServers ? 120_000 : 180_000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /portal\.spec\.ts/,
    },
    {
      name: 'portal',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/socio.json',
      },
      dependencies: ['setup'],
      testMatch: /portal\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'pnpm --filter @clubos/api start',
          cwd: repoRoot,
          url: 'http://localhost:4000/api/health',
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            RATE_LIMIT_AUTH_PER_MIN: '1000',
            RATE_LIMIT_VALIDATE_PER_MIN: '1000',
          },
        },
        {
          command: 'pnpm --filter @clubos/web start',
          cwd: repoRoot,
          url: 'http://localhost:3000/login',
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            ...process.env,
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
          },
        },
      ],
});

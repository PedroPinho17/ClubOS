/**
 * Arranca API e Web para E2E (sequencial: API primeiro, depois Web).
 * Usado pelo Playwright webServer para evitar race no login.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const isWin = process.platform === 'win32';

function pnpm(args: string[], env: NodeJS.ProcessEnv = process.env): ChildProcess {
  return spawn(isWin ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: isWin,
  });
}

async function waitForOk(url: string, attempts = 120): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // servidor ainda a arrancar
    }
    await sleep(1000);
  }
  throw new Error(`Timeout à espera de ${url}`);
}

const api = pnpm(['--filter', '@clubos/api', 'start'], {
  ...process.env,
  NODE_ENV: 'test',
  RATE_LIMIT_AUTH_PER_MIN: process.env.RATE_LIMIT_AUTH_PER_MIN ?? '1000',
  RATE_LIMIT_VALIDATE_PER_MIN: process.env.RATE_LIMIT_VALIDATE_PER_MIN ?? '1000',
});

api.on('exit', (code) => {
  if (code && code !== 0) process.exit(code);
});

await waitForOk('http://localhost:4000/api/health');

const web = pnpm(['--filter', '@clubos/web', 'start'], {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

web.on('exit', (code) => {
  if (code && code !== 0) process.exit(code);
});

await waitForOk('http://localhost:3000/login');

// eslint-disable-next-line no-console
console.log('E2E servers ready (API :4000, Web :3000)');

function shutdown() {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

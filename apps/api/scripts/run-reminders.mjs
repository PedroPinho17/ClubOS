import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(root, "dist", "scripts", "run-reminders.js");

/**
 * Sempre a API compilada (dist/). O fallback tsx+src falhava com TypeError
 * (Nest/decorators). Em local: `pnpm --filter @clubos/api build` antes.
 */
if (!existsSync(distEntry)) {
  console.error(
    "reminders:run: falta dist/scripts/run-reminders.js. Corre `pnpm --filter @clubos/api build`.",
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [distEntry], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);

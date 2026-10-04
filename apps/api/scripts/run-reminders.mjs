import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(root, "dist", "scripts", "run-reminders.js");
const srcEntry = join(root, "src", "scripts", "run-reminders.ts");

function canRunTsx() {
  if (process.env.CLUBOS_REMINDERS_FORCE_DIST === "1") return false;
  if (!existsSync(srcEntry)) return false;
  // Preferir src+tsx em local (evita dist desatualizado / TypeError).
  return true;
}

const useTsx = canRunTsx();
const result = useTsx
  ? spawnSync("tsx", [srcEntry], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
      shell: true,
    })
  : spawnSync(process.execPath, [distEntry], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    });

if (!useTsx && !existsSync(distEntry)) {
  console.error(
    "reminders:run: falta dist/scripts/run-reminders.js. Corre `pnpm --filter @clubos/api build` ou instala tsx.",
  );
  process.exit(1);
}

process.exit(result.status ?? 1);

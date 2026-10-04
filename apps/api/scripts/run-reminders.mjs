import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(root, "dist", "scripts", "run-reminders.js");
const srcEntry = join(root, "src", "scripts", "run-reminders.ts");

/** Preferir dist (build/imagem Docker); tsx+src so como fallback local. */
const useDist =
  process.env.CLUBOS_REMINDERS_FORCE_TSX !== "1" && existsSync(distEntry);

const result = useDist
  ? spawnSync(process.execPath, [distEntry], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    })
  : spawnSync("tsx", [srcEntry], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
      shell: true,
    });

if (!useDist && !existsSync(srcEntry)) {
  console.error(
    "reminders:run: falta dist/ e src/. Corre `pnpm --filter @clubos/api build`.",
  );
  process.exit(1);
}

process.exit(result.status ?? 1);

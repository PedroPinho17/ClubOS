import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(root, "dist", "scripts", "run-reminders.js");
const srcEntry = join(root, "src", "scripts", "run-reminders.ts");

const result = existsSync(distEntry)
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

process.exit(result.status ?? 1);

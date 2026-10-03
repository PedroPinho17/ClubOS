import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(root, "dist", "scripts", "seed-users.js");
const srcEntry = join(root, "src", "scripts", "seed-users.ts");

/** Em imagem Docker só existe dist/; em local preferimos tsx sobre src. */
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

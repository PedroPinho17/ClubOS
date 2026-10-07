import "../env";
import { prisma } from "@clubos/database";
import { repairCredentialAccountIds } from "../auth/create-credential-user";

/**
 * One-off / ops: alinha accountId das contas credential ao userId.
 * Uso: pnpm --filter @clubos/api repair:credentials
 */
async function main() {
  const { repaired } = await repairCredentialAccountIds();
  console.log(
    repaired === 0
      ? "Nenhuma conta credential partida."
      : `Reparadas ${repaired} conta(s) credential (accountId → userId).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

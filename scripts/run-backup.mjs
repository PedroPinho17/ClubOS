import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const args = process.argv.slice(2);

if (platform() === 'win32') {
  if (args[0] === 'restore') {
    const file = args[1];
    if (!file) {
      console.error('Uso: node scripts/run-backup.mjs restore <ficheiro.dump>');
      process.exit(1);
    }
    execSync(`powershell -File scripts/restore-db.ps1 -DumpFile "${file}"`, { stdio: 'inherit' });
  } else {
    execSync('powershell -File scripts/backup-db.ps1', { stdio: 'inherit' });
  }
} else {
  if (args[0] === 'restore') {
    const file = args[1];
    if (!file) {
      console.error('Uso: node scripts/run-backup.mjs restore <ficheiro.dump>');
      process.exit(1);
    }
    execSync(`bash scripts/restore-db.sh "${file}"`, { stdio: 'inherit' });
  } else {
    execSync('bash scripts/backup-db.sh', { stdio: 'inherit' });
  }
}

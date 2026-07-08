import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_HEADERS } from '../apps/api/src/modules/members/import/member-import-column-map';
import { buildSpreadsheetBuffer } from '../apps/api/src/modules/members/import/member-spreadsheet';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/web/e2e/fixtures');
const outFile = join(outDir, 'import-dry-run.xlsx');

const rows: string[][] = [
  [...TEMPLATE_HEADERS],
  [
    '99801',
    'Socio Playwright E2E',
    'playwright-import@test.clubos.local',
    '912000001',
    '01/01/2026',
    'Quota Mensal',
    '',
    '',
    'Sim',
    'Linha gerada para E2E',
    '',
    '',
    '',
    '',
  ],
];

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, buildSpreadsheetBuffer(rows));
console.log(`Fixture Excel: ${outFile}`);

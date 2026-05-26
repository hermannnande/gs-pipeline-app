/**
 * Restaure les fichiers locaux vides (0 bytes) depuis git HEAD,
 * en UTF-8 sans BOM (evite le souci PowerShell qui ecrit en UTF-16).
 *
 * Usage : node scripts/_tmp-restore-empty.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, statSync, existsSync } from 'node:fs';

const FILES = [
  'frontend/src/pages/admin/Overview.tsx',
  'frontend/src/pages/admin/Stats.tsx',
  'frontend/src/pages/gestionnaire/Overview.tsx',
  'frontend/src/pages/stock/Overview.tsx',
];

let restored = 0;
for (const f of FILES) {
  try {
    const buf = execFileSync('git', ['show', `HEAD:${f}`], { encoding: 'buffer' });
    writeFileSync(f, buf);
    const sz = statSync(f).size;
    console.log(`  OK ${f.padEnd(60)} ${sz.toString().padStart(7)} bytes`);
    restored++;
  } catch (e) {
    console.log(`  ERR ${f}: ${e.message.split('\n')[0]}`);
  }
}
console.log(`\nRestored ${restored}/${FILES.length} files.`);

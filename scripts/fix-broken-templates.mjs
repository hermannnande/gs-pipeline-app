import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'frontend/src');
let n = 0;
for (const f of globSync('**/*.{tsx,ts}', { cwd: root })) {
  const p = join(root, f);
  let c = readFileSync(p, 'utf8');
  const b = c;
  // 'text_${var}` → `text_${var}`
  c = c.replace(/'([^']*\$\{[^}]+\})`/g, '`$1`');
  if (c !== b) {
    writeFileSync(p, c);
    console.log(f);
    n++;
  }
}
console.log('done', n);

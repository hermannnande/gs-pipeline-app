import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(process.cwd(), 'frontend/src/pages/public');
let n = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.tsx')) continue;
  let c = readFileSync(join(dir, f), 'utf8');
  const b = c;
  c = c.replace(/(`[^`]*?)\{fmtTotal\(/g, '$1${fmtTotal(');
  if (c !== b) {
    writeFileSync(join(dir, f), c);
    console.log(f);
    n++;
  }
}
console.log('done', n);

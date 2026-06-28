import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(process.cwd(), 'frontend/src/pages/public');
let n = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.tsx')) continue;
  let c = readFileSync(join(dir, f), 'utf8');
  const b = c;
  // JSX text: >${fmtTotal( → >{fmtTotal(
  c = c.replace(/>\$\{fmtTotal\(/g, '>{fmtTotal(');
  // JSX: ${fmtTotal(n)}</ → {fmtTotal(n)}</
  c = c.replace(/\$\{fmtTotal\((\d+)\)\}</g, '{fmtTotal($1)}</');
  // JSX sticky text like " — ${fmtTotal(1)} F"
  c = c.replace(/ — \$\{fmtTotal\(/g, ' — {fmtTotal(');
  c = c.replace(/ · \$\{fmtTotal\(/g, ' · {fmtTotal(');
  c = c.replace(/Dès \$\{fmtTotal\(/g, 'Dès {fmtTotal(');
  c = c.replace(/à \$\{fmtTotal\(/g, 'à {fmtTotal(');
  c = c.replace(/à seulement \$\{fmtTotal\(/g, 'à seulement {fmtTotal(');
  if (c !== b) {
    writeFileSync(join(dir, f), c);
    console.log(f);
    n++;
  }
}
console.log('done', n);

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'frontend/src/pages/public');
let total = 0;

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.tsx')) continue;
  let c = readFileSync(join(dir, f), 'utf8');
  const b = c;

  // Double-dollar from bad script
  c = c.replace(/\$\$\{fmtTotal\(/g, '${fmtTotal(');

  // JSX: ${fmtTotal → {fmtTotal, then restore inside backticks
  c = c.replace(/\$\{fmtTotal\(/g, '{fmtTotal(');
  c = c.replace(/`([^`]*?)\{fmtTotal\(/g, '`$1${fmtTotal(');

  // Arrays opened with backtick instead of quote
  c = c.replace(/\{\[`([^']+)'/g, "{['$1'");
  c = c.replace(/\[`([^']+)'/g, "['$1'");
  c = c.replace(/\[`([^']+)`\]/g, "['$1']");

  // Broken ternary closing in className templates
  c = c.replace(/: '`\}`/g, ": ''}`");

  // Broken JSX space fragment
  c = c.replace(/\{' `\}/g, "{' '}");

  if (c !== b) {
    writeFileSync(join(dir, f), c);
    console.log('fixed:', f);
    total++;
  }
}
console.log('done', total);

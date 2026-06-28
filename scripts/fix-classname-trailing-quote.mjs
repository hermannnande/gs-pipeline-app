import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(d, out = []) {
  for (const f of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f.name)) out.push(p);
  }
  return out;
}

const root = join(process.cwd(), 'frontend/src');
let n = 0;
for (const p of walk(root)) {
  let c = readFileSync(p, 'utf8');
  const b = c;
  // className={`...'> → className={`...'`}>
  c = c.replace(/(className=\{`[^'\n]*(?:'[^']*'|\$\{[^}]*\})*[^'\n]*)'(\s*>)/g, "$1'`}$2");
  // className={`...' } → className={`...'`}
  c = c.replace(/(className=\{`[^'\n]*(?:'[^']*'|\$\{[^}]*\})*[^'\n]*)'(\s*\})/g, "$1'`}$2");
  // overflow-hidden ${className}' } style=
  c = c.replace(/(\$\{className \|\| ''\})'(\s*\})/g, "$1`}$2");
  if (c !== b) {
    writeFileSync(p, c);
    console.log(p.replace(/\\/g, '/').split('frontend/src/')[1]);
    n++;
  }
}
console.log('done', n);

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
  c = c.replace(/'\}'/g, "'}");
  c = c.replace(/\|\| ''\}'/g, "|| ''}`");
  if (c !== b) {
    writeFileSync(p, c);
    console.log(p.replace(/\\/g, '/').split('frontend/src/')[1]);
    n++;
  }
}
console.log('done', n);

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'frontend/src/pages/public');
let total = 0;

function fixFile(c) {
  // backtick-open + single-quote-close (simple strings without ${})
  c = c.replace(/: `([^'`$]+)'/g, ": '$1'");
  c = c.replace(/\{ (n|lbl): `([^']+)'/g, "{ $1: '$2'");
  c = c.replace(/title: `([^']+)',/g, "title: '$1',");
  c = c.replace(/\? `([^']+)'/g, "? '$1'");

  // style / paddingBottom
  c = c.replace(/\)\)`\s*\}\}/g, "))' }}");

  // M('hero`) or M(`hero.webp')
  c = c.replace(/M\('([^']*)`\)/g, "M('$1.webp')");
  c = c.replace(/M\(`([^']+)'\)/g, "M('$1')");
  c = c.replace(/hero: M\(`([^']+)'\)/g, "hero: M('$1')");

  c = c.replace(/boxShadow: c\.ring \? `([^']+)'/g, "boxShadow: c.ring ? '$1'");
  c = c.replace(/\.replace\(` FCFA', ''\)/g, ".replace(' FCFA', '')");

  // marquee: first item uses [' instead of [`
  c = c.replace(/\['((?:Pack \d+ pot|\d+ paires) \$\{fmtTotal\(\d+\)[^']*?)`,/g, '[`$1`,');
  c = c.replace(/'Choisissez votre pack maintenant`\]/g, "'Choisissez votre pack maintenant']");

  // orderCfg broken title quote
  c = c.replace(/title: '([^']+)`,/g, "title: '$1',");

  // JSX ${fmtTotal -> {fmtTotal, restore inside backticks
  c = c.replace(/\$\{fmtTotal\(/g, '{fmtTotal(');
  c = c.replace(/`([^`]*?)\{fmtTotal\(/g, '`$1${fmtTotal(');

  return c;
}

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.tsx')) continue;
  let c = readFileSync(join(dir, f), 'utf8');
  const b = c;
  c = fixFile(c);
  if (c !== b) {
    writeFileSync(join(dir, f), c);
    console.log('fixed:', f);
    total++;
  }
}
console.log('done', total);

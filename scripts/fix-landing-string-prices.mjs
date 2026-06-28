#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'frontend/src/pages/public');
const fmtFr = (n) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

function parsePrices(content) {
  const m = content.match(/const PRICES(?::[^=]+)?\s*=\s*\{\s*1:\s*(\d+),\s*2:\s*(\d+),\s*3:\s*(\d+)\s*\}/);
  if (!m) return null;
  return { 1: +m[1], 2: +m[2], 3: +m[3] };
}

function toTpl(str) {
  return str.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}');
}

function patch(content) {
  let c = content;
  const before = c;

  // Syntaxe cassée thank-you
  c = c.replace(/orderTotal\(PRICES, qty\)\)\.toLocaleString/g, 'orderTotal(PRICES, qty).toLocaleString');

  // Attributs JSX string="...{fmtTotal(n)}..."
  c = c.replace(/(\w+)="([^"]*\{fmtTotal\(\d\)\}[^"]*)"/g, (_, attr, inner) => {
    return `${attr}={\`${toTpl(inner)}\`}`;
  });

  // document.title = '...'
  c = c.replace(/document\.title = '([^']*\{fmtTotal\(\d\)[^']*)'/g, (_, inner) => {
    return `document.title = \`${toTpl(inner)}\``;
  });

  // phrase="..." highlight items with fmtTotal in single quotes inside arrays - convert '...{fmtTotal...}...' to template
  c = c.replace(/'((?:[^'\\]|\\.)*\{fmtTotal\(\d\)\}(?:[^'\\]|\\.)*)'/g, (match, inner) => {
    if (inner.includes('${fmtTotal')) return match;
    return '`' + toTpl(inner) + '`';
  });

  const prices = parsePrices(c);
  if (prices) {
    for (let qty = 1; qty <= 3; qty++) {
      const ps = fmtFr(prices[qty]);
      const re = new RegExp(ps.replace(/ /g, '[\\s\\u202f]+') + '(\\s*(?:F|Fr|FCFA|FR))', 'g');
      c = c.replace(re, (full, sfx) => {
        // déjà dans template avec fmtTotal
        const idx = c.indexOf(full);
        const line = c.slice(c.lastIndexOf('\n', idx) + 1, c.indexOf('\n', idx));
        if (line.includes('fmtTotal') || line.includes('orderTotal') || line.includes('line-through') || line.includes('save:')) return full;
        return `\${fmtTotal(${qty})}${sfx || ''}`;
      });
    }
    // Corriger les strings devenues invalides: 'text ${fmtTotal(1)} F' -> `text ${fmtTotal(1)} F`
    c = c.replace(/'([^'\n]*\$\{fmtTotal\(\d\)\}[^'\n]*)'/g, '`$1`');
  }

  return c !== before ? c : null;
}

let n = 0;
for (const file of readdirSync(PUB)) {
  if (!file.endsWith('.tsx')) continue;
  const path = join(PUB, file);
  const next = patch(readFileSync(path, 'utf8'));
  if (next) {
    writeFileSync(path, next);
    console.log('fixed', file);
    n++;
  }
}
console.log(`done (${n})`);

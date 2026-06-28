#!/usr/bin/env node
/**
 * Remplace les prix pack codés en dur par fmtTotal(qty) = pack + 1500 F.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'frontend/src/pages/public');
const fmtFr = (n) => n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

function parsePrices(content) {
  const m = content.match(/const PRICES(?::[^=]+)?\s*=\s*\{\s*1:\s*(\d+),\s*2:\s*(\d+),\s*3:\s*(\d+)\s*\}/);
  if (!m) return null;
  return { 1: +m[1], 2: +m[2], 3: +m[3] };
}

function skipLine(line) {
  return /const PRICES|packLabel|orderTotal|fmtTotal|fmt\(orderTotal|PRICES\[|save:|Économisez|economisez|OLD_PRICE|oldPrice|old:|line-through|DISCOUNT|toLocaleString|sessionStorage|track\(|value:|content_type|num_items|Math\.round|0\.9|UNIT_PRICE|DUO_PRICE|PACK |const PACK|DELIVERY_FEE|fmtP\(|fmt\(UNIT|fmt\(DUO|fmt\(PACK|fmt\(n\)|function fmt|const fmt =/.test(line);
}

function ensureFmtTotal(content) {
  if (content.includes('fmtTotal')) return content;
  if (!content.includes('orderTotal')) return content;
  return content.replace(
    /(const PRICES(?::[^=]+)?\s*=\s*\{[^}]+\};)/,
    `$1\nconst fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\\u202f|,/g, ' ');`,
  );
}

function patchContent(content, file) {
  const prices = parsePrices(content);
  if (!prices) {
    if (file === 'CoffretBoxerLanding.tsx') return patchCoffretBoxer(content);
    return null;
  }

  let c = ensureFmtTotal(content);
  const lines = c.split('\n');
  let changed = c !== content;

  for (let qty = 1; qty <= 3; qty++) {
    const packStr = fmtFr(prices[qty]);
    const re = new RegExp(packStr.replace(/ /g, '[\\s\\u202f]+'), 'g');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (skipLine(line)) continue;
      if (!re.test(line)) continue;
      re.lastIndex = 0;

      // Déjà dynamique sur cette ligne
      if (line.includes('fmtTotal(') && line.includes(packStr.split(' ')[0])) continue;

      const next = line.replace(re, `{fmtTotal(${qty})}`);
      if (next !== line) {
        lines[i] = next;
        changed = true;
      }
    }
  }

  c = lines.join('\n');

  // Corriger les doublons {fmtTotal(1)}{fmtTotal(1)}
  c = c.replace(/\{fmtTotal\((\d)\)\}\{fmtTotal\(\1\)\}/g, '{fmtTotal($1)}');

  // ThankYou : PRICES[qty] sans orderTotal
  if (file.includes('ThankYou')) {
    c = c.replace(
      /(\bvalue\s*=\s*)PRICES\[qty\]\s*\|\|\s*PRICES\[1\]/g,
      '$1orderTotal(PRICES, qty)',
    );
    c = c.replace(
      /(\(?)PRICES\[qty\]\s*\|\|\s*PRICES\[1\](\)?\.toLocaleString)/g,
      'orderTotal(PRICES, qty)$2',
    );
    c = c.replace(
      /PRICES\[qty\]\s*\|\|\s*PRICES\[1\]/g,
      'orderTotal(PRICES, qty)',
    );
  }

  return changed ? c : null;
}

function patchCoffretBoxer(content) {
  let c = content;
  if (!c.includes('DELIVERY_FEE_CI')) return null;
  const before = c;
  c = c.replace(/(?<!DELIVERY_FEE_CI\s*\+?\s*)9 900/g, '{fmtP(PACK + DELIVERY_FEE_CI)}');
  c = c.replace(/19 800/g, '{fmtP(DUO + DELIVERY_FEE_CI)}');
  // Fix document.title and FAQ - use template
  c = c.replace(
    /document\.title = 'Coffrets Boxers Homme Premium — 9 900 F \| Tommy & Luxe';/,
    "document.title = `Coffrets Boxers Homme Premium — ${fmtP(PACK + DELIVERY_FEE_CI)} F | Tommy & Luxe`;",
  );
  c = c.replace(
    /a: 'Le coffret est à 9 900 F\. Le pack 2 coffrets est à 19 800 F\.'/,
    "a: `Le coffret est à ${fmtP(PACK + DELIVERY_FEE_CI)} F. Le pack 2 coffrets est à ${fmtP(DUO + DELIVERY_FEE_CI)} F.`",
  );
  return c !== before ? c : null;
}

function patchCoffretLuxe(content) {
  if (!content.includes('UNIT_PRICE + DELIVERY_FEE_CI')) return null;
  let c = content;
  const before = c;
  // Hero subtitle still shows pack-only UNIT_PRICE
  c = c.replace(
    /3 boxers · \{fmt\(UNIT_PRICE\)\} F/g,
    '3 boxers · {fmt(UNIT_PRICE + DELIVERY_FEE_CI)} F',
  );
  return c !== before ? c : null;
}

let n = 0;
for (const file of readdirSync(PUB)) {
  if (!file.endsWith('.tsx')) continue;
  if (!file.includes('Landing') && !file.includes('ThankYou')) continue;
  const path = join(PUB, file);
  let content = readFileSync(path, 'utf8');
  let next = patchContent(content, file);
  if (file === 'CoffretBoxerLuxeV3Landing.tsx') {
    const luxe = patchCoffretLuxe(next || content);
    if (luxe) next = luxe;
  }
  if (next) {
    writeFileSync(path, next);
    console.log('patched', file);
    n++;
  }
}
console.log(`done (${n} files)`);

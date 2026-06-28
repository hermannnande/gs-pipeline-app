import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PUBLIC = join(ROOT, 'frontend/src/pages/public');

const registrySlugs = new Set(
  [...readFileSync(join(PUBLIC, 'landingRegistry.tsx'), 'utf8').matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]),
);
const whitelist = [...readFileSync(join(ROOT, 'frontend/src/hooks/useLandingSlug.ts'), 'utf8').matchAll(/^\s+'([^']+)',/gm)].map((m) => m[1]);

console.log('=== Slugs whitelist sans landingRegistry ===');
for (const slug of whitelist) {
  if (!registrySlugs.has(slug)) console.log(`  ${slug}`);
}

console.log('\n=== Slugs registry hors whitelist ===');
for (const slug of registrySlugs) {
  if (!whitelist.includes(slug)) console.log(`  ${slug}`);
}

if ([...whitelist].every((s) => registrySlugs.has(s)) && [...registrySlugs].every((s) => whitelist.includes(s) || s === 'creme-ongle-incarne')) {
  console.log('\nRegistry couvre tous les slugs whitelistés (+ alias creme-ongle-incarne).');
}

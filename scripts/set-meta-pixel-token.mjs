/**
 * Met a jour META_PIXEL_TOKENS sur Vercel (production) pour un pixel donne.
 * Le token ne doit JAMAIS etre commit dans le repo : passer via variable d'environnement.
 *
 * Usage (PowerShell) :
 *   $env:META_CAPI_TOKEN="EAA..."
 *   node scripts/set-meta-pixel-token.mjs 952340034030644
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const PIXEL_ID = process.argv[2];
const TOKEN = process.env.META_CAPI_TOKEN?.trim();

if (!PIXEL_ID || !TOKEN) {
  console.error('Usage: META_CAPI_TOKEN=<token> node scripts/set-meta-pixel-token.mjs <pixelId>');
  process.exit(1);
}

const TMP = `.env.meta-token-${Date.now()}`;
const ENV_NAME = 'META_PIXEL_TOKENS';

console.log(`[1] Pull env Vercel production...`);
try {
  execFileSync('npx', ['vercel', 'env', 'pull', TMP, '--environment', 'production', '--yes'], {
    stdio: 'pipe',
    shell: true,
  });
} catch (e) {
  console.error('Echec vercel env pull. Executer `npx vercel link` dans le projet racine.');
  console.error(e.message);
  process.exit(1);
}

let existing = '';
try {
  const raw = readFileSync(TMP, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith(`${ENV_NAME}=`)) {
      existing = line.substring(ENV_NAME.length + 1).replace(/^"|"$/g, '');
      break;
    }
  }
} finally {
  try { unlinkSync(TMP); } catch {}
}

const map = new Map();
if (existing) {
  for (const pair of existing.split(',')) {
    const idx = pair.indexOf(':');
    if (idx === -1) continue;
    const pid = pair.slice(0, idx).trim();
    const tok = pair.slice(idx + 1).trim();
    if (pid) map.set(pid, tok);
  }
}
map.set(PIXEL_ID, TOKEN);
const merged = [...map.entries()].map(([pid, tok]) => `${pid}:${tok}`).join(',');

console.log(`[2] META_PIXEL_TOKENS : ${map.size} pixel(s), dont ${PIXEL_ID}`);

console.log('[3] Suppression ancienne variable (si presente)...');
try {
  execFileSync('npx', ['vercel', 'env', 'rm', ENV_NAME, 'production', '--yes'], {
    stdio: 'pipe',
    shell: true,
  });
} catch {
  /* peut ne pas exister */
}

console.log('[4] Ajout META_PIXEL_TOKENS production...');
try {
  execFileSync(
    'npx',
    ['vercel', 'env', 'add', ENV_NAME, 'production', '--force'],
    {
      input: merged,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true,
    },
  );
} catch (e) {
  console.error('Echec vercel env add:', e.message);
  process.exit(1);
}

console.log('\n[OK] Token CAPI enregistre sur Vercel. Redeployer gs-pipeline-app-2 pour appliquer.');
console.log('Test : node scripts/test-patch-capi.mjs', PIXEL_ID);

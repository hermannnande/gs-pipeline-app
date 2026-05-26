/**
 * Test d'envoi CAPI pour n'importe quel pixel Meta configure sur Vercel.
 *
 * Usage :
 *   node scripts/test-patch-capi.mjs <pixelId> [test_event_code]
 *
 * Ex :
 *   node scripts/test-patch-capi.mjs 1639149310623476
 *   node scripts/test-patch-capi.mjs 1639149310623476 TEST12345
 *
 * Ce que fait le script :
 *   1) Pulle temporairement les env vars production de Vercel
 *   2) Parse META_PIXEL_TOKENS pour trouver le token du pixel demande
 *      (fallback sur META_ACCESS_TOKEN si le pixel == META_PIXEL_ID)
 *   3) Envoie un Purchase TEST a Meta Graph
 *   4) Nettoie le fichier temporaire
 *   5) Rapporte la reponse (events_received, fbtrace_id)
 *
 * Avec un test_event_code, l'event atterrit dans "Test events"
 * (Events Manager) sans polluer les metriques prod.
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PIXEL_ID = process.argv[2];
const TEST_EVENT_CODE = process.argv[3] || null;

if (!PIXEL_ID) {
  console.error('Usage: node scripts/test-patch-capi.mjs <pixelId> [test_event_code]');
  process.exit(1);
}

const API_VERSION = 'v22.0';
const TMP_ENV = `.env.capi-test-${Date.now()}`;

// --- 1. Pull env depuis Vercel ---
console.log('[1/4] Pull env Vercel production...');
try {
  execFileSync('npx', ['vercel', 'env', 'pull', TMP_ENV, '--environment', 'production', '--yes'], {
    stdio: 'pipe',
    shell: true,
  });
} catch (e) {
  console.error('Vercel CLI echec. Linker le projet avec `npx vercel link` d\'abord.');
  console.error(e.message);
  process.exit(1);
}

// --- 2. Extraction du token ---
console.log('[2/4] Extraction du token pour pixel', PIXEL_ID);
let token = null;
let defaultPixel = null;
let defaultToken = null;
const env = readFileSync(TMP_ENV, 'utf8');
for (const line of env.split(/\r?\n/)) {
  if (line.startsWith('META_PIXEL_TOKENS=')) {
    const raw = line.substring('META_PIXEL_TOKENS='.length).replace(/^"|"$/g, '');
    for (const pair of raw.split(',')) {
      const [pid, tok] = pair.split(':');
      if (pid?.trim() === PIXEL_ID) { token = tok?.trim(); break; }
    }
  }
  if (line.startsWith('META_PIXEL_ID=')) defaultPixel = line.substring('META_PIXEL_ID='.length).replace(/^"|"$/g, '').trim();
  if (line.startsWith('META_ACCESS_TOKEN=')) defaultToken = line.substring('META_ACCESS_TOKEN='.length).replace(/^"|"$/g, '').trim();
}
if (!token && defaultPixel === PIXEL_ID) token = defaultToken;

try { unlinkSync(TMP_ENV); } catch {}

if (!token) {
  console.error(`\n[KO] Aucun token trouve pour le pixel ${PIXEL_ID}.`);
  console.error('     Verifier META_PIXEL_TOKENS sur Vercel (format: pixelId1:token1,pixelId2:token2,...)');
  process.exit(1);
}

console.log(`      Token trouve : ${token.slice(0, 15)}...${token.slice(-8)}`);

// --- 3. Envoi de l'event ---
const sha256 = v => createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
const eventId = `capi_test_${randomUUID()}`;

const payload = {
  data: [{
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: 'https://obrille.com/test',
    user_data: {
      ph: [sha256('+2250700000000')],
      ct: [sha256('abidjan')],
      country: [sha256('ci')],
      client_ip_address: '193.251.146.1',
      client_user_agent: 'Mozilla/5.0 (CAPI Test)',
    },
    custom_data: {
      currency: 'XOF',
      value: 9900,
      content_name: 'Test Product',
      content_ids: ['TEST_PRODUCT'],
      content_type: 'product',
      num_items: 1,
      order_id: `TEST-${Date.now()}`,
    },
  }],
};

if (TEST_EVENT_CODE) {
  payload.test_event_code = TEST_EVENT_CODE;
  console.log(`[3/4] Envoi Purchase (mode TEST, code=${TEST_EVENT_CODE})...`);
} else {
  console.log(`[3/4] Envoi Purchase (mode PROD, event_id=${eventId})...`);
}

const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`;
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const body = await res.json();

// --- 4. Rapport ---
console.log(`[4/4] Reponse Graph API : HTTP ${res.status}`);
console.log(JSON.stringify(body, null, 2));

if (existsSync(TMP_ENV)) { try { unlinkSync(TMP_ENV); } catch {} }

if (res.ok && body.events_received >= 1) {
  console.log(`\n[OK] Meta a bien recu l'event (events_received=${body.events_received}).`);
  if (TEST_EVENT_CODE) {
    console.log(`     -> visible dans Events Manager > Test events (code ${TEST_EVENT_CODE})`);
  } else {
    console.log(`     -> visible dans Events Manager en ~1 min (dedup par event_id=${eventId})`);
  }
  process.exit(0);
}
console.error(`\n[KO] Envoi echoue.`);
process.exit(1);

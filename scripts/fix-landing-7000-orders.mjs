#!/usr/bin/env node
/**
 * Corrige les montants des commandes pour les 3 landings a 7 000 F
 * (bande-sport-minceur, chaussette, lunette-de-nuit).
 *
 * Usage:
 *   node scripts/fix-landing-7000-orders.mjs           # dry-run
 *   node scripts/fix-landing-7000-orders.mjs --apply     # applique en BDD
 */
import { computeTotalAmount } from '../utils/pricing.js';

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const APPLY = process.argv.includes('--apply');

const PRODUCT_CODES = [
  'BANDE_SPORT_MINCEUR',
  'CHAUSSETTE_CHAUFFANTE',
  'LUNETTE_VISION_NOCTUNE',
];

/** Depuis le deploiement des prix 7 000 F sur les landings (UTC). */
const SINCE = process.env.SINCE || '2026-06-27T00:00:00.000Z';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
  const data = await res.json();
  if (!data.token) throw new Error('Token absent');
  return data.token;
}

async function loadProducts(token) {
  const res = await fetch(`${API_URL}/products?limit=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products echoue (${res.status})`);
  const { products = [] } = await res.json();
  return products.filter((p) => PRODUCT_CODES.includes(p.code?.toUpperCase()));
}

async function loadOrders(token) {
  const res = await fetch(`${API_URL}/orders?limit=5000&sort=desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /orders echoue (${res.status})`);
  const data = await res.json();
  return data.orders || data;
}

async function patchOrder(token, orderId, montant, montantRestant) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ montant, montantRestant }),
  });
  if (!res.ok) throw new Error(`PUT /orders/${orderId} echoue : ${await res.text()}`);
}

const token = await login();
console.log(`Mode : ${APPLY ? 'APPLICATION' : 'DRY-RUN'}`);
console.log(`Periode : depuis ${SINCE}\n`);

const products = await loadProducts(token);
const productById = new Map(products.map((p) => [p.id, p]));
const productIds = new Set(products.map((p) => p.id));

console.log('Produits cibles :');
for (const p of products) {
  console.log(`  ${p.code} (id=${p.id}) → ${p.prixUnitaire} / ${p.prix2Unites} / ${p.prix3Unites}`);
}

const sinceMs = Date.parse(SINCE);
const orders = (await loadOrders(token)).filter(
  (o) => productIds.has(o.productId) && Date.parse(o.createdAt) >= sinceMs,
);

console.log(`\nCommandes trouvees depuis ${SINCE.slice(0, 10)} : ${orders.length}`);

const changes = [];
for (const order of orders) {
  const product = productById.get(order.productId);
  if (!product) continue;
  const qty = Math.max(1, Number(order.quantite) || 1);
  const expected = computeTotalAmount(product, qty);
  const current = Number(order.montant);
  if (current === expected) continue;

  const montantPaye = Number(order.montantPaye) || 0;
  const montantRestant =
    order.montantRestant != null ? Math.max(0, expected - montantPaye) : null;

  changes.push({
    id: order.id,
    ref: order.orderReference,
    code: product.code,
    client: order.clientNom,
    qty,
    avant: current,
    apres: expected,
    status: order.status,
    createdAt: order.createdAt,
    montantRestant,
  });
}

if (!changes.length) {
  console.log('\nAucune commande a corriger.');
  process.exit(0);
}

console.log(`\n${changes.length} commande(s) a corriger :\n`);
for (const c of changes) {
  const d = new Date(c.createdAt).toLocaleString('fr-FR');
  console.log(
    `  #${c.id} | ${c.code} | qte=${c.qty} | ${c.avant} → ${c.apres} F | ${c.status} | ${c.client} | ${d}`,
  );
}

if (!APPLY) {
  console.log('\nDry-run termine. Relancez avec --apply pour appliquer.');
  process.exit(0);
}

console.log('\nApplication des corrections...');
let ok = 0;
for (const c of changes) {
  await patchOrder(token, c.id, c.apres, c.montantRestant);
  ok++;
  console.log(`  ✓ #${c.id} : ${c.avant} → ${c.apres} F`);
}

console.log(`\n${ok}/${changes.length} commande(s) corrigee(s).`);

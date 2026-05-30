/**
 * AUDIT — Commandes EXPRESS "envoyees" mais JAMAIS assignees a un livreur.
 *
 * Cycle EXPRESS :
 *   EXPRESS (creee, 10% paye)  --assign livreur-->  (delivererId)
 *   --livreur expedie-->  EXPRESS_ENVOYE (expressEnvoyeAt, expressEnvoyePar, codeExpress)
 *   --arrivee agence-->   EXPRESS_ARRIVE (arriveAt)
 *   --paiement 90% + retrait--> EXPRESS_LIVRE (deliveredAt)
 *
 * Faille possible : l'endpoint "arrive" accepte EXPRESS -> EXPRESS_ARRIVE direct,
 * et l'envoi par un ADMIN ne verifie pas qu'un livreur est assigne.
 * => Une commande peut etre "envoyee/arrivee/livree" en express avec delivererId = null.
 *
 * Anomalie = status in (EXPRESS_ENVOYE, EXPRESS_ARRIVE, EXPRESS_LIVRE) ET delivererId = null.
 *
 * Usage : node scripts/audit-express-non-assignes.mjs
 */

import { writeFileSync } from 'node:fs';

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SENT_STATUSES = ['EXPRESS_ENVOYE', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE'];

let TOKEN = '';
async function api(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} : ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function login() {
  const r = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`Login ${r.status} : ${await r.text()}`);
  TOKEN = (await r.json()).token;
}

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');

await login();
console.log('Login OK\n');

// Utilisateurs (pour mapper expressEnvoyePar -> nom/role)
const usersResp = await api('/users').catch(() => ({ users: [] }));
const userById = Object.fromEntries((usersResp.users || []).map((u) => [u.id, u]));

// Toutes les commandes EXPRESS (tous statuts)
const data = await api('/orders?deliveryType=EXPRESS&limit=10000');
const orders = data.orders || [];
console.log(`Commandes EXPRESS total : ${orders.length} (pagination.total=${data.pagination?.total})\n`);

// Repartition par statut + combien sans livreur
const byStatus = {};
for (const o of orders) {
  const s = o.status || '??';
  byStatus[s] ||= { total: 0, sansLivreur: 0 };
  byStatus[s].total++;
  if (o.delivererId == null) byStatus[s].sansLivreur++;
}
console.log('-- Repartition par statut (total | sans livreur assigne) --');
for (const [s, v] of Object.entries(byStatus).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${s.padEnd(16)} ${String(v.total).padStart(5)} | sans livreur: ${v.sansLivreur}`);
}

// ANOMALIE : envoyees (ENVOYE/ARRIVE/LIVRE) mais jamais assignees
const anomalies = orders
  .filter((o) => SENT_STATUSES.includes(o.status) && o.delivererId == null)
  .map((o) => {
    const sender = o.expressEnvoyePar ? userById[o.expressEnvoyePar] : null;
    return {
      id: o.id,
      ref: o.orderReference,
      client: o.clientNom,
      ville: o.clientVille,
      agence: o.agenceRetrait || null,
      produit: o.produitNom,
      montant: o.montant,
      status: o.status,
      delivererId: o.delivererId,
      expressEnvoyePar: o.expressEnvoyePar || null,
      envoyeParNom: sender ? `${sender.prenom || ''} ${sender.nom || ''}`.trim() : (o.expressEnvoyePar ? `#${o.expressEnvoyePar}` : null),
      envoyeParRole: sender?.role || null,
      codeExpress: o.codeExpress || null,
      createdAt: o.createdAt,
      expressEnvoyeAt: o.expressEnvoyeAt || null,
      arriveAt: o.arriveAt || null,
      deliveredAt: o.deliveredAt || null,
      // a saute l'etape d'envoi (pas de date d'envoi mais arrivee/livree)
      sautEnvoi: !o.expressEnvoyeAt && (o.arriveAt || o.deliveredAt) ? true : false,
    };
  })
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

console.log(`\n================= ANOMALIE =================`);
console.log(`EXPRESS "envoyees" (ENVOYE/ARRIVE/LIVRE) SANS livreur assigne : ${anomalies.length}\n`);

const parStatut = {};
for (const a of anomalies) parStatut[a.status] = (parStatut[a.status] || 0) + 1;
console.log('  Par statut :', JSON.stringify(parStatut));
const sautEnvoiCount = anomalies.filter((a) => a.sautEnvoi).length;
console.log(`  Dont ayant saute l'etape d'envoi (pas de date d'envoi) : ${sautEnvoiCount}\n`);

for (const a of anomalies.slice(0, 60)) {
  console.log(
    `  [${a.status}] ${a.ref || a.id} | ${a.client} (${a.ville}) | agence: ${a.agence || '—'} | ` +
    `cree ${fmtDate(a.createdAt)} envoye ${fmtDate(a.expressEnvoyeAt)} arrive ${fmtDate(a.arriveAt)} livre ${fmtDate(a.deliveredAt)} | ` +
    `envoye par: ${a.envoyeParNom ? a.envoyeParNom + ' (' + a.envoyeParRole + ')' : '— (aucune trace)'}` +
    `${a.sautEnvoi ? ' | ⚠ SAUT ETAPE ENVOI' : ''}`
  );
}
if (anomalies.length > 60) console.log(`  ... (${anomalies.length - 60} de plus dans le JSON)`);

// Pour reference : EXPRESS encore "a expedier" sans livreur (normal, en attente)
const enAttente = orders.filter((o) => o.status === 'EXPRESS' && o.delivererId == null).length;
console.log(`\n(Info) EXPRESS au statut initial 'EXPRESS' sans livreur (en attente d'assignation, normal) : ${enAttente}`);

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const file = `backups/audit-express-non-assignes-${ts}.json`;
writeFileSync(file, JSON.stringify({ generatedAt: new Date().toISOString(), totalExpress: orders.length, byStatus, anomaliesCount: anomalies.length, anomalies }, null, 2), 'utf8');
console.log(`\nJSON complet : ${file}`);

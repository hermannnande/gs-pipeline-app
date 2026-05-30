/**
 * AUDIT — Qui valide les livraisons ("points") et depuis quelle IP / appareil ?
 *
 * Objectif : verifier si chaque livreur valide SES livraisons depuis SON compte
 * et SON IP/appareil, ou si des "faux points" sont faits (ex. un seul compte /
 * une seule IP qui valide pour plusieurs livreurs, ou un gestionnaire/admin qui
 * valide a la place des livreurs).
 *
 * Source : table audit_logs (action ORDER_STATUS_CHANGE) qui capture
 *   userId + role, ipAddress, deviceFingerprint, newStatus, createdAt.
 *
 * Sortie : resume console + JSON complet dans backups/ (gitignore).
 *
 * Usage : node scripts/audit-livreurs-points.mjs
 */

import { writeFileSync } from 'node:fs';

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Statuts qui correspondent a une action "terrain" du livreur (un "point")
const DELIVERY_STATUSES = ['LIVREE', 'LIVREE_PARTIELLE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
const POINT_OK = ['LIVREE', 'LIVREE_PARTIELLE']; // un "point" valide = colis livre

let TOKEN = '';
async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} : ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function login() {
  const r = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`Login ${r.status} : ${await r.text()}`);
  const d = await r.json();
  if (!d.token) throw new Error('Pas de token');
  TOKEN = d.token;
}

async function fetchAllStatusLogs() {
  const all = [];
  let page = 1;
  const limit = 2000;
  for (;;) {
    const d = await api(`/audit/logs?action=ORDER_STATUS_CHANGE&page=${page}&limit=${limit}`);
    all.push(...(d.logs || []));
    const totalPages = d.totalPages || 1;
    if (page >= totalPages || !d.logs?.length) break;
    page++;
  }
  return all;
}

function parseDetails(s) {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}

const out = (label, v) => console.log(`${label}`, typeof v === 'string' ? v : JSON.stringify(v));

await login();
console.log('Login OK\n');

const [livreursResp, allUsersResp, crossRole, devices, statusLogs] = await Promise.all([
  api('/users?role=LIVREUR').catch((e) => ({ error: e.message })),
  api('/users').catch((e) => ({ error: e.message })),
  api('/audit/cross-role').catch((e) => ({ error: e.message })),
  api('/audit/devices').catch((e) => ({ error: e.message })),
  fetchAllStatusLogs().catch((e) => { console.error('logs error', e.message); return []; }),
]);

const livreurs = livreursResp.users || [];
const allUsers = allUsersResp.users || [];
const userById = Object.fromEntries(allUsers.map((u) => [u.id, u]));

console.log(`Livreurs (comptes)        : ${livreurs.length}`);
console.log(`Utilisateurs total        : ${allUsers.length}`);
console.log(`Logs ORDER_STATUS_CHANGE  : ${statusLogs.length}`);

// --- Focus : actions de livraison (points) ---
const deliveryEvents = statusLogs
  .map((l) => {
    const d = parseDetails(l.details);
    return {
      id: l.id,
      userId: l.userId,
      userName: l.user ? `${l.user.prenom || ''} ${l.user.nom || ''}`.trim() : `#${l.userId}`,
      role: l.user?.role || userById[l.userId]?.role || '??',
      newStatus: d.newStatus || null,
      oldStatus: d.oldStatus || null,
      orderRef: d.orderRef || null,
      clientNom: d.clientNom || null,
      ip: (l.ipAddress || '').trim() || null,
      fp: l.deviceFingerprint || null,
      ua: l.userAgent || null,
      createdAt: l.createdAt,
    };
  })
  .filter((e) => DELIVERY_STATUSES.includes(e.newStatus));

const points = deliveryEvents.filter((e) => POINT_OK.includes(e.newStatus));

console.log(`\nEvenements de livraison   : ${deliveryEvents.length}`);
console.log(`  dont points OK (livre)  : ${points.length}`);
const withIp = deliveryEvents.filter((e) => e.ip && e.ip !== 'unknown').length;
console.log(`  avec IP exploitable     : ${withIp} / ${deliveryEvents.length} (${deliveryEvents.length ? Math.round((withIp / deliveryEvents.length) * 100) : 0}%)`);

// --- Par acteur ---
const perActor = {};
for (const e of deliveryEvents) {
  if (!perActor[e.userId]) {
    perActor[e.userId] = { userId: e.userId, name: e.userName, role: e.role, total: 0, byStatus: {}, ips: new Set(), fps: new Set(), first: e.createdAt, last: e.createdAt };
  }
  const a = perActor[e.userId];
  a.total++;
  a.byStatus[e.newStatus] = (a.byStatus[e.newStatus] || 0) + 1;
  if (e.ip) a.ips.add(e.ip);
  if (e.fp) a.fps.add(e.fp);
  if (e.createdAt < a.first) a.first = e.createdAt;
  if (e.createdAt > a.last) a.last = e.createdAt;
}
const actors = Object.values(perActor)
  .map((a) => ({ ...a, ips: [...a.ips], fps: [...a.fps], ipCount: a.ips.size, fpCount: a.fps.size }))
  .sort((x, y) => y.total - x.total);

// --- Index IP -> acteurs (pour points OK) ---
const ipIndex = {};
for (const e of points) {
  if (!e.ip || e.ip === 'unknown') continue;
  if (!ipIndex[e.ip]) ipIndex[e.ip] = { ip: e.ip, total: 0, users: {}, roles: new Set() };
  const x = ipIndex[e.ip];
  x.total++;
  x.roles.add(e.role);
  if (!x.users[e.userId]) x.users[e.userId] = { name: e.userName, role: e.role, count: 0 };
  x.users[e.userId].count++;
}
const ipRows = Object.values(ipIndex)
  .map((x) => ({ ip: x.ip, total: x.total, distinctUsers: Object.keys(x.users).length, roles: [...x.roles], users: Object.values(x.users).sort((a, b) => b.count - a.count) }))
  .sort((a, b) => b.total - a.total);

// IP partagee par >= 2 livreurs (pour les points)
const ipSharedByLivreurs = ipRows.filter((r) => r.users.filter((u) => u.role === 'LIVREUR').length >= 2);
// IP utilisee a la fois par livreur ET par gestionnaire/admin
const ipCrossRole = ipRows.filter((r) => r.roles.includes('LIVREUR') && (r.roles.includes('GESTIONNAIRE') || r.roles.includes('GESTIONNAIRE_STOCK') || r.roles.includes('ADMIN')));

// --- Index fingerprint -> acteurs (pour points OK) ---
const fpIndex = {};
for (const e of points) {
  if (!e.fp) continue;
  if (!fpIndex[e.fp]) fpIndex[e.fp] = { fp: e.fp, users: {} };
  if (!fpIndex[e.fp].users[e.userId]) fpIndex[e.fp].users[e.userId] = { name: e.userName, role: e.role, count: 0 };
  fpIndex[e.fp].users[e.userId].count++;
}
const fpShared = Object.values(fpIndex)
  .map((x) => ({ fp: x.fp, users: Object.values(x.users), distinctUsers: Object.keys(x.users).length }))
  .filter((x) => x.distinctUsers >= 2)
  .sort((a, b) => b.distinctUsers - a.distinctUsers);

// --- Couple (IP + empreinte) partage par >=2 LIVREURS + bascules rapides ---
// C'est la signature la plus fiable d'un "faux point" : une meme connexion + un
// meme appareil qui valide pour plusieurs comptes livreurs dans un court laps de temps.
const pairIndex = {};
for (const e of points) {
  if (!e.ip || e.ip === 'unknown' || !e.fp) continue;
  const key = `${e.ip}|${e.fp}`;
  (pairIndex[key] ||= []).push(e);
}
const pairShared = [];
for (const [key, evs] of Object.entries(pairIndex)) {
  const livreurIds = new Set(evs.filter((e) => e.role === 'LIVREUR').map((e) => e.userId));
  if (livreurIds.size < 2) continue;
  const sorted = evs.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let rapidSwitches = 0;
  const examples = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].userId !== sorted[i - 1].userId) {
      const gapMin = (new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt)) / 60000;
      if (gapMin <= 30) {
        rapidSwitches++;
        if (examples.length < 6) examples.push({ from: sorted[i - 1].userName, to: sorted[i].userName, gapMin: Math.round(gapMin), at: sorted[i].createdAt });
      }
    }
  }
  const [ip, fp] = key.split('|');
  const byUser = {};
  for (const e of evs) { (byUser[e.userId] ||= { name: e.userName, role: e.role, count: 0 }).count++; }
  pairShared.push({ ip, fp, total: evs.length, distinctLivreurs: livreurIds.size, rapidSwitches, examples, users: Object.values(byUser).sort((a, b) => b.count - a.count) });
}
pairShared.sort((a, b) => b.rapidSwitches - a.rapidSwitches || b.distinctLivreurs - a.distinctLivreurs);

// --- Points "OK" valides par un NON-livreur (admin/gestionnaire) ---
const pointsByNonLivreur = points.filter((e) => e.role !== 'LIVREUR');
const nonLivreurAgg = {};
for (const e of pointsByNonLivreur) {
  const k = `${e.userId}`;
  if (!nonLivreurAgg[k]) nonLivreurAgg[k] = { name: e.userName, role: e.role, count: 0 };
  nonLivreurAgg[k].count++;
}

// --- Livreurs sans aucun point (compte existant mais aucune validation auditee) ---
const activeLivreurIds = new Set(deliveryEvents.filter((e) => e.role === 'LIVREUR').map((e) => e.userId));
const livreursSansActivite = livreurs.filter((l) => !activeLivreurIds.has(l.id)).map((l) => ({ id: l.id, name: `${l.prenom || ''} ${l.nom || ''}`.trim(), email: l.email }));

// ===== RESUME CONSOLE =====
console.log('\n================= RESUME AUDIT =================\n');

console.log('-- Par acteur (evenements de livraison) --');
for (const a of actors) {
  console.log(`  ${a.role.padEnd(16)} ${a.name.padEnd(22)} total=${a.total}  IPs=${a.ipCount}  empreintes=${a.fpCount}  ${JSON.stringify(a.byStatus)}`);
}

console.log(`\n-- IP partagee par >=2 LIVREURS (points livres) : ${ipSharedByLivreurs.length} --`);
for (const r of ipSharedByLivreurs.slice(0, 20)) {
  console.log(`  IP ${r.ip}  total=${r.total}  livreurs=${r.users.filter((u) => u.role === 'LIVREUR').length}  -> ${r.users.map((u) => `${u.name}(${u.role}:${u.count})`).join(', ')}`);
}

console.log(`\n-- IP utilisee par LIVREUR + GESTIONNAIRE/ADMIN : ${ipCrossRole.length} --`);
for (const r of ipCrossRole.slice(0, 20)) {
  console.log(`  IP ${r.ip}  total=${r.total}  -> ${r.users.map((u) => `${u.name}(${u.role}:${u.count})`).join(', ')}`);
}

console.log(`\n-- Empreinte appareil partagee par >=2 comptes : ${fpShared.length} --`);
for (const r of fpShared.slice(0, 20)) {
  console.log(`  fp ${r.fp}  -> ${r.users.map((u) => `${u.name}(${u.role}:${u.count})`).join(', ')}`);
}

console.log(`\n-- Couple (IP+appareil) partage par >=2 LIVREURS : ${pairShared.length} (avec bascules <30min en tete) --`);
for (const p of pairShared.slice(0, 15)) {
  console.log(`  IP ${p.ip} | fp ${p.fp}  livreurs=${p.distinctLivreurs}  points=${p.total}  bascules<30min=${p.rapidSwitches}`);
  console.log(`     comptes: ${p.users.map((u) => `${u.name}(${u.count})`).join(', ')}`);
  if (p.examples.length) console.log(`     ex: ${p.examples.map((x) => `${x.from}->${x.to} en ${x.gapMin}min`).join(' | ')}`);
}

console.log(`\n-- Points LIVRES par un NON-livreur (admin/gestionnaire) : ${pointsByNonLivreur.length} --`);
for (const v of Object.values(nonLivreurAgg).sort((a, b) => b.count - a.count)) {
  console.log(`  ${v.role} ${v.name} : ${v.count} point(s)`);
}

console.log(`\n-- Livreurs sans aucun point auditee : ${livreursSansActivite.length} --`);
for (const l of livreursSansActivite) console.log(`  ${l.name} (${l.email})`);

console.log('\n-- Verdict cross-role (calcule par le backend) --');
out('  ', crossRole?.summary?.verdict || crossRole?.error || 'n/a');

// Concentration : top IP en nombre de points
console.log('\n-- Top IP par nombre de points livres --');
for (const r of ipRows.slice(0, 12)) {
  console.log(`  IP ${r.ip.padEnd(24)} points=${String(r.total).padStart(4)}  comptes=${r.distinctUsers}  roles=${r.roles.join('/')}`);
}

// ===== DUMP JSON =====
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const result = {
  generatedAt: new Date().toISOString(),
  api: API_URL,
  totals: {
    livreurs: livreurs.length,
    users: allUsers.length,
    statusChangeLogs: statusLogs.length,
    deliveryEvents: deliveryEvents.length,
    pointsOk: points.length,
    deliveryEventsWithIp: withIp,
  },
  actors,
  ipRows,
  ipSharedByLivreurs,
  ipCrossRole,
  fpShared,
  pairShared,
  pointsByNonLivreur: Object.values(nonLivreurAgg),
  livreursSansActivite,
  crossRole,
  devices,
};
const file = `backups/audit-livreurs-${ts}.json`;
writeFileSync(file, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nJSON complet ecrit : ${file}`);

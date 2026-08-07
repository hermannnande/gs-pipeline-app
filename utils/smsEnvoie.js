/**
 * Intégration SMSenvoie — notifications SMS intelligentes des commandes.
 * Doc : POST https://smsenvoie.com/api/v1/sms (Bearer <clé>)
 *        GET /api/v1/sms/{id} · GET /api/v1/devices · GET /api/v1/quota
 *
 * - Clé API stockée en base (sms_config), JAMAIS dans le code ni côté client.
 * - File d'attente (sms_outbox) drainée par le cron /api/cron/sms-worker.
 * - Règles « intelligentes » appliquées au moment de l'envoi (pas à la mise en file) :
 *   commande déjà traitée/terminée → CANCELLED · heures silencieuses → reprogrammé
 *   à 07:05 · cap anti-spam par numéro/jour → SKIPPED.
 */
import { prisma } from './prisma.js';

const SMSENVOIE_BASE = 'https://smsenvoie.com/api/v1';
export const SMS_TZ = 'Africa/Abidjan'; // UTC+0, pas d'heure d'été

export const SMS_TYPES = ['CONFIRMATION', 'PREPARATION', 'REMISE_LIVREUR', 'WEEKEND_INFO', 'WEEKEND_DIMANCHE', 'WEEKEND_LUNDI'];

// Statuts « terminaux » : plus aucun SMS ne doit partir pour ces commandes.
const TERMINAL_STATUSES = ['ANNULEE', 'INJOIGNABLE', 'LIVREE', 'LIVREE_PARTIELLE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
// Statuts où le client n'a PAS encore été appelé/traité par un appelant.
const UNTOUCHED_STATUSES = ['NOUVELLE', 'A_APPELER'];

/** Numéro CI → E.164 avec "+" (ex. 0707610500 → +2250707610500). null si invalide. */
export function normalizePhoneCI(raw) {
  if (raw == null) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2); // 00225... -> 225...
  if (d.startsWith('225')) {
    if (d.length < 12 || d.length > 13) return null;
    return '+' + d;
  }
  // Numéro local : 8 à 10 chiffres → on préfixe +225
  if (d.length >= 8 && d.length <= 10) return '+225' + d;
  return null;
}

const fmtMontant = (n) => `${Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`;
const prenomDe = (nom) => String(nom || '').trim().split(/\s+/)[0] || 'Cher client';

/**
 * Construit le texte exact du SMS selon le type.
 * REMISE_LIVREUR sans téléphone livreur → variante sans la dernière phrase.
 */
export function renderSmsMessage(type, { order, deliverer } = {}) {
  const prenom = prenomDe(order?.clientNom);
  if (type === 'CONFIRMATION') {
    const produit = order?.produitNom || 'votre produit';
    return `${prenom}, votre commande ${produit} (${fmtMontant(order?.montant)}) est bien confirmée ✅ Restez près de votre téléphone : notre livreur vous appellera pour la livraison.`;
  }
  if (type === 'PREPARATION') {
    return `${prenom}, votre commande est en cours de préparation 📦 Le livreur arrivera bientôt : restez joignable et prêt à répondre à son appel pour ne pas le faire patienter inutilement.`;
  }
  if (type === 'REMISE_LIVREUR') {
    const livreurPrenom = prenomDe(deliverer?.prenom || deliverer?.nom || 'notre livreur');
    const base = `${prenom}, votre colis est remis à notre livreur ${livreurPrenom} 📦 Il vous appellera à l'approche.`;
    const tel = normalizePhoneCI(deliverer?.telephone);
    return tel ? `${base} Joignable au ${tel} pour suivre votre livraison.` : base;
  }
  if (type === 'WEEKEND_INFO') {
    return `${prenom}, merci pour votre commande ✅ Nos équipes sont en repos ce week-end : votre livraison est prévue LUNDI. Gardez votre téléphone à portée de main, nous pensons à vous 📦`;
  }
  if (type === 'WEEKEND_DIMANCHE') {
    return `Bon dimanche ${prenom} 🌞 Votre colis est prêt et vous attend : livraison demain LUNDI. Le livreur vous appellera avant de passer. Bon week-end !`;
  }
  if (type === 'WEEKEND_LUNDI') {
    return `Bonjour ${prenom} ✅ Bonne semaine ! Votre commande est en préparation ce matin : notre livreur vous appellera AUJOURD'HUI pour la livraison. Restez près de votre téléphone 📦`;
  }
  return null;
}

/**
 * SÉQUENCE WEEK-END — commandes créées du samedi 12h00 au lundi 07h00
 * (heure d'Abidjan = UTC+0). Remplace le SMS PREPARATION (qui promettrait
 * un livreur « bientôt » un samedi après-midi — faux).
 *
 * Fonction PURE et testable : prend la date courante en paramètre.
 * Retourne la liste des SMS à programmer [{ type, scheduledAt }] —
 * vide hors fenêtre week-end (= flux normal PREPARATION +15 min).
 *
 *  - WEEKEND_INFO      : +30 min après la commande
 *  - WEEKEND_DIMANCHE  : dimanche 10:00 locale (jamais si dimanche déjà > 10h,
 *                        ni le lundi — déjà passé)
 *  - WEEKEND_LUNDI     : lundi 07:05 locale (le jour même si déjà lundi < 07h)
 */
export function getWeekendSchedule(now = new Date()) {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=dimanche … 6=samedi (Abidjan = UTC toute l'année)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
  const inWeekend = (day === 6 && hour >= 12) || day === 0 || (day === 1 && hour < 7);
  if (!inWeekend) return [];

  const out = [{ type: 'WEEKEND_INFO', scheduledAt: new Date(d.getTime() + 30 * 60 * 1000) }];

  if (day !== 1) {
    const sunday = new Date(d);
    if (day === 6) sunday.setUTCDate(sunday.getUTCDate() + 1); // samedi → dimanche
    sunday.setUTCHours(10, 0, 0, 0);
    if (sunday > d) out.push({ type: 'WEEKEND_DIMANCHE', scheduledAt: sunday });
  }

  const monday = new Date(d);
  if (day === 6) monday.setUTCDate(monday.getUTCDate() + 2);
  else if (day === 0) monday.setUTCDate(monday.getUTCDate() + 1);
  monday.setUTCHours(7, 5, 0, 0);
  if (monday > d) out.push({ type: 'WEEKEND_LUNDI', scheduledAt: monday });

  return out;
}

/** Lit la config SMS d'une société. Cache court (30 s). */
const _cfgCache = new Map(); // companyId -> { at, value }
export async function getSmsConfig(companyId = 1, { fresh = false } = {}) {
  const cid = Number(companyId) || 1;
  const hit = _cfgCache.get(cid);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.value;
  const cfg = await prisma.smsConfig.findUnique({ where: { companyId: cid } });
  _cfgCache.set(cid, { at: Date.now(), value: cfg });
  return cfg;
}
export function invalidateSmsConfigCache() { _cfgCache.clear(); }

/**
 * Met un SMS en file. Dédupliqué via UNIQUE("orderId", type) :
 * un 2e appel pour le même (orderId, type) est ignoré silencieusement.
 * Jamais bloquant : retourne { queued:false, reason } en cas de souci.
 */
export async function queueSms({ companyId = 1, orderId, to, message, type, scheduledAt }) {
  try {
    if (!SMS_TYPES.includes(type)) return { queued: false, reason: 'bad_type' };
    if (!orderId || !message) return { queued: false, reason: 'missing_fields' };
    const toPhone = normalizePhoneCI(to);
    if (!toPhone) return { queued: false, reason: 'invalid_phone' };
    const cfg = await getSmsConfig(companyId);
    if (!cfg || !cfg.enabled || !cfg.apiKey) return { queued: false, reason: 'disabled_or_no_key' };
    await prisma.smsOutbox.upsert({
      where: { orderId_type: { orderId: Number(orderId), type } },
      create: {
        companyId: Number(companyId) || 1,
        orderId: Number(orderId),
        toPhone,
        message,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
      update: {}, // déjà en file → on ne touche à rien (anti-doublon)
    });
    return { queued: true };
  } catch (e) {
    console.error('[sms] queueSms erreur (non bloquante):', e?.message || e);
    return { queued: false, reason: 'error' };
  }
}

/** Annule tous les SMS en attente d'une commande (hook statuts terminaux). */
export async function cancelPendingSmsForOrder(orderId) {
  try {
    const { count } = await prisma.smsOutbox.updateMany({
      where: { orderId: Number(orderId), statut: 'PENDING' },
      data: { statut: 'CANCELLED' },
    });
    return { cancelled: count };
  } catch (e) {
    console.error('[sms] cancelPending erreur (non bloquante):', e?.message || e);
    return { cancelled: 0 };
  }
}

/** Envoi bas niveau via l'API SMSenvoie (timeout 30 s). */
export async function sendSmsNow(apiKey, to, message) {
  if (!apiKey) return { ok: false, httpStatus: 0, error: 'Clé API SMS absente' };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    let res;
    try {
      res = await fetch(`${SMSENVOIE_BASE}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ to, message }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (res.status === 401) {
      console.error('[sms] CRITIQUE : clé API SMSenvoie refusée (401). Vérifier sms_config.');
      return { ok: false, httpStatus: 401, error: 'Clé API invalide (401)' };
    }
    if (res.status === 429 || body?.error === 'quota_exceeded' || body?.code === 'quota_exceeded') {
      return { ok: false, httpStatus: res.status, quotaExceeded: true, error: body?.message || body?.error || 'Quota dépassé' };
    }
    if (!res.ok || body?.ok === false) {
      return { ok: false, httpStatus: res.status, error: body?.message || body?.error || `HTTP ${res.status}` };
    }
    const providerId = body?.campaign_id != null ? String(body.campaign_id)
      : body?.message_id != null ? String(body.message_id)
      : body?.id != null ? String(body.id) : null;
    return { ok: true, httpStatus: res.status, providerId, providerStatus: body?.status };
  } catch (e) {
    const msg = e?.name === 'AbortError' ? 'Timeout 30 s SMSenvoie' : (e?.message || 'Erreur réseau SMSenvoie');
    return { ok: false, httpStatus: 0, error: msg };
  }
}

/** Appels proxifiés pour l'admin (quota + téléphone passerelle). */
export async function getProviderQuota(apiKey) {
  return providerGet(apiKey, '/quota');
}
export async function getProviderDevices(apiKey) {
  return providerGet(apiKey, '/devices');
}
async function providerGet(apiKey, path) {
  if (!apiKey) return { ok: false, error: 'Clé API absente' };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let res;
    try {
      res = await fetch(`${SMSENVOIE_BASE}${path}`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) return { ok: false, httpStatus: res.status, error: body?.message || body?.error || `HTTP ${res.status}` };
    return { ok: true, data: body };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'Timeout SMSenvoie' : (e?.message || 'Erreur réseau') };
  }
}

/** Date/heure courante dans le fuseau Africa/Abidjan. */
function nowInAbidjan() {
  // Abidjan = UTC+0 toute l'année : on formate via Intl pour rester explicite.
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: SMS_TZ, hour: 'numeric', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { hour: Number(get('hour')), dayISO: `${get('year')}-${get('month')}-${get('day')}` };
}

/** Prochain créneau autorisé : quietEnd:05 (heure d'Abidjan = UTC) aujourd'hui ou demain. */
function nextQuietRelease(cfg) {
  const { hour } = nowInAbidjan();
  const qs = Number(cfg?.quietStart ?? 21);
  const qe = Number(cfg?.quietEnd ?? 7);
  // Plage silencieuse : overnight (21→7) si qs > qe, sinon plage intra-jour.
  const inQuiet = qs > qe ? (hour >= qs || hour < qe) : (hour >= qs && hour < qe);
  if (!inQuiet) return null;
  // Abidjan = UTC+0 toute l'année : qe:05 UTC = qe:05 heure locale.
  const now = new Date();
  const release = new Date(now);
  release.setUTCHours(qe, 5, 0, 0);
  if (release <= now) release.setUTCDate(release.getUTCDate() + 1);
  return release;
}

/** Début du jour (minuit Abidjan = minuit UTC) pour le cap journalier. */
function startOfAbidjanDay() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const MAX_ATTEMPTS_SMS = 5;

/**
 * Worker : traite les PENDING dus (scheduledAt <= now), max `max` par run.
 * Applique les règles intelligentes AVANT chaque envoi.
 */
export async function processSmsOutbox({ max = 30 } = {}) {
  const pending = await prisma.smsOutbox.findMany({
    where: { statut: 'PENDING', scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: 'asc' },
    take: max,
    include: { order: { select: { id: true, status: true, clientNom: true } } },
  });
  if (!pending.length) return { processed: 0 };

  // Configs par société (un seul tenant en pratique, mais multi-tenant safe)
  const cfgByCompany = new Map();
  const getCfg = async (cid) => {
    if (!cfgByCompany.has(cid)) cfgByCompany.set(cid, await getSmsConfig(cid, { fresh: true }));
    return cfgByCompany.get(cid);
  };

  let sent = 0, failed = 0, cancelled = 0, skipped = 0, rescheduled = 0, paused = false;
  for (const row of pending) {
    const cfg = await getCfg(row.companyId);
    if (!cfg || !cfg.enabled || !cfg.apiKey) continue; // société désactivée : on laisse en file

    // RÈGLE 1 — commande terminée/annulée : plus rien ne part.
    const st = row.order?.status;
    if (!st || TERMINAL_STATUSES.includes(st)) {
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { statut: 'CANCELLED', error: `Commande ${st || 'introuvable'}` } });
      cancelled++;
      continue;
    }

    // RÈGLE 2 — PREPARATION : uniquement si la commande n'a pas encore bougé
    // (client pas encore appelé). Sinon c'est du bruit → CANCELLED.
    if (row.type === 'PREPARATION' && !UNTOUCHED_STATUSES.includes(st)) {
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { statut: 'CANCELLED', error: `Déjà traitée (${st})` } });
      cancelled++;
      continue;
    }

    // RÈGLE 3 — heures silencieuses : on reprogramme à 07:05, on n'envoie pas.
    const release = nextQuietRelease(cfg);
    if (release) {
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { scheduledAt: release } });
      rescheduled++;
      continue;
    }

    // RÈGLE 4 — cap anti-spam : max N SMS/jour/numéro (SENT du jour, fuseau Abidjan).
    const maxPerDay = Number(cfg.maxPerPhonePerDay ?? 6);
    const sentToday = await prisma.smsOutbox.count({
      where: { toPhone: row.toPhone, statut: 'SENT', sentAt: { gte: startOfAbidjanDay() } },
    });
    if (sentToday >= maxPerDay) {
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { statut: 'SKIPPED', error: `Cap ${maxPerDay}/jour atteint (${sentToday})` } });
      skipped++;
      continue;
    }

    // ENVOI
    const r = await sendSmsNow(cfg.apiKey, row.toPhone, row.message);
    if (r.ok) {
      await prisma.smsOutbox.update({
        where: { id: row.id },
        data: { statut: 'SENT', sentAt: new Date(), providerId: r.providerId, error: null },
      });
      sent++;
    } else if (r.quotaExceeded) {
      // Quota SMSenvoie épuisé : on laisse en PENDING et on met le run en pause.
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { error: (r.error || 'quota_exceeded').slice(0, 300) } });
      paused = true;
      console.error('[sms] quota_exceeded : run mis en pause, reprise au prochain cron.');
      break;
    } else {
      const attempts = (row.attempts ?? 0) + 1;
      await prisma.smsOutbox.update({
        where: { id: row.id },
        data: {
          attempts: { increment: 1 },
          statut: r.httpStatus === 401 || attempts >= MAX_ATTEMPTS_SMS ? 'FAILED' : 'PENDING',
          error: (r.error || 'unknown').slice(0, 300),
        },
      });
      failed++;
      if (r.httpStatus === 401) { paused = true; break; } // clé invalide : inutile de continuer
    }
  }

  return { processed: pending.length, sent, failed, cancelled, skipped, rescheduled, paused };
}

/**
 * Intégration WaSenderAPI — confirmation WhatsApp des commandes.
 * Doc : https://wasenderapi.com/api-docs
 *
 * - Clé API + numéro expéditeur stockés en base (table whatsapp_config),
 *   éditables depuis l'admin → on peut changer de numéro sans redéploiement.
 * - Envoi via file d'attente (whatsapp_outbox) drainée par un cron à ~1 msg / 6 s
 *   pour respecter la limite WaSender (1 message / 5 s sur les plans payants).
 */
import { prisma } from './prisma.js';

const WASENDER_BASE = 'https://www.wasenderapi.com/api';

export const DEFAULT_TEMPLATE =
  'Bonjour {nom} 👋 Votre commande ({produit}) est bien enregistrée ✅. ' +
  'Elle sera livrée dans les heures qui suivent. Restez près de votre téléphone, ' +
  'le livreur vous appellera pour la livraison. Merci de votre confiance !';

/** Numéro CI -> E.164 sans "+" attendu par WaSender (ex. 0707610500 -> 2250707610500). */
export function formatPhoneCI(raw) {
  if (raw == null) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);          // 00225... -> 225...
  if (!d.startsWith('225')) d = '225' + d;         // local (0707610500) -> 2250707610500
  // CI = 225 + 10 chiffres = 13 chiffres au total
  if (d.length < 12 || d.length > 15) return null;
  return d;
}

/** Construit le texte du message à partir d'un template + d'une commande. */
export function renderTemplate(template, order) {
  const t = template || DEFAULT_TEMPLATE;
  const prenom = String(order.clientNom || '').trim().split(/\s+/)[0] || 'cher client';
  return t
    .replace(/\{nom\}/g, prenom)
    .replace(/\{nomComplet\}/g, order.clientNom || '')
    .replace(/\{produit\}/g, order.produitNom || order.product?.nom || 'votre produit')
    .replace(/\{ref\}/g, (order.orderReference || '').slice(0, 8).toUpperCase())
    .replace(/\{qte\}/g, String(order.quantite ?? 1))
    .replace(/\{montant\}/g, String(order.montant ?? ''));
}

/** Lit la config WhatsApp (1 seule ligne). Cache court pour limiter les requêtes DB. */
let _cache = { at: 0, value: null };
export async function getWhatsappConfig({ fresh = false } = {}) {
  if (!fresh && _cache.value && Date.now() - _cache.at < 30000) return _cache.value;
  const cfg = await prisma.whatsappConfig.findFirst({ orderBy: { id: 'asc' } });
  _cache = { at: Date.now(), value: cfg };
  return cfg;
}
export function invalidateConfigCache() { _cache = { at: 0, value: null }; }

/**
 * Envoi bas niveau d'un message texte WaSender.
 * @returns {Promise<{ok:boolean, httpStatus:number, msgId?:string, status?:string, retryAfter?:number, error?:string}>}
 */
export async function sendWhatsAppText({ to, text, apiKey }) {
  if (!apiKey) return { ok: false, httpStatus: 0, error: 'Clé API WhatsApp absente' };
  if (!to) return { ok: false, httpStatus: 0, error: 'Numéro destinataire invalide' };
  try {
    const res = await fetch(`${WASENDER_BASE}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to, text }),
    });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (res.status === 429) {
      const retryAfter = Number(body?.retry_after) || Number(res.headers.get('retry-after')) || 60;
      return { ok: false, httpStatus: 429, retryAfter, error: body?.message || 'Rate limited' };
    }
    if (!res.ok || body?.success === false) {
      return { ok: false, httpStatus: res.status, error: body?.message || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      httpStatus: res.status,
      msgId: body?.data?.msgId != null ? String(body.data.msgId) : undefined,
      status: body?.data?.status,
    };
  } catch (e) {
    return { ok: false, httpStatus: 0, error: e?.message || 'Erreur réseau WaSender' };
  }
}

/** Met une commande dans la file de confirmation WhatsApp (non bloquant). */
export async function enqueueOrderConfirmation(order) {
  try {
    const cfg = await getWhatsappConfig();
    if (!cfg || !cfg.enabled || !cfg.apiKey) return { queued: false, reason: 'disabled_or_no_key' };
    const to = formatPhoneCI(order.clientTelephone);
    if (!to) return { queued: false, reason: 'invalid_phone' };
    const text = renderTemplate(cfg.template, order);
    await prisma.whatsappOutbox.create({
      data: { toNumber: to, text, orderId: order.id ?? null, status: 'PENDING' },
    });
    return { queued: true };
  } catch (e) {
    console.error('[wasender] enqueue erreur (non bloquante):', e?.message || e);
    return { queued: false, reason: 'error' };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_ATTEMPTS = 5;

/**
 * Draine la file d'attente en respectant l'espacement (1 msg / ~6 s).
 * Appelé par le cron Vercel. S'arrête sur 429 (réessai au prochain tick).
 */
export async function processOutbox({ max = 8, spacingMs = 6000 } = {}) {
  const cfg = await getWhatsappConfig({ fresh: true });
  if (!cfg || !cfg.enabled || !cfg.apiKey) return { processed: 0, reason: 'disabled_or_no_key' };

  const pending = await prisma.whatsappOutbox.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: max,
  });

  let sent = 0, failed = 0, rateLimited = false;
  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const r = await sendWhatsAppText({ to: row.toNumber, text: row.text, apiKey: cfg.apiKey });

    if (r.ok) {
      await prisma.whatsappOutbox.update({
        where: { id: row.id },
        data: { status: 'SENT', msgId: r.msgId || null, attempts: { increment: 1 }, sentAt: new Date(), lastError: null },
      });
      sent++;
    } else if (r.httpStatus === 429) {
      await prisma.whatsappOutbox.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 }, lastError: `429 retry_after=${r.retryAfter}` },
      });
      rateLimited = true;
      break; // on arrête, le cron reprendra
    } else {
      const attempts = row.attempts + 1;
      await prisma.whatsappOutbox.update({
        where: { id: row.id },
        data: {
          attempts: { increment: 1 },
          lastError: (r.error || 'unknown').slice(0, 300),
          status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
        },
      });
      failed++;
    }

    if (i < pending.length - 1) await sleep(spacingMs);
  }

  return { processed: pending.length, sent, failed, rateLimited };
}

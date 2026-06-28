/**
 * Admin — configuration de la confirmation WhatsApp (WaSenderAPI).
 * Permet de changer le numéro expéditeur (= clé de session), activer/désactiver,
 * éditer le message, et envoyer un test. Réservé aux ADMIN.
 */
import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';
import {
  sendWhatsAppText, formatPhoneCI, getWhatsappConfig, invalidateConfigCache,
  renderTemplate, DEFAULT_TEMPLATE,
} from '../utils/wasender.js';

const router = express.Router();
router.use(authenticate);

/** Masque la clé (ne renvoie jamais la clé en clair). */
function maskKey(k) {
  if (!k) return null;
  const s = String(k);
  return s.length <= 8 ? '••••' : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

// GET /api/wasender/config — état courant (clé masquée)
router.get('/config', authorize('ADMIN'), async (req, res) => {
  try {
    const cfg = await getWhatsappConfig({ fresh: true });
    res.json({
      enabled: cfg?.enabled ?? false,
      senderNumber: cfg?.senderNumber || null,
      hasKey: !!cfg?.apiKey,
      keyMasked: maskKey(cfg?.apiKey),
      template: cfg?.template || DEFAULT_TEMPLATE,
      defaultTemplate: DEFAULT_TEMPLATE,
      updatedAt: cfg?.updatedAt || null,
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// PUT /api/wasender/config — met à jour (clé mise à jour seulement si fournie)
router.put('/config', authorize('ADMIN'), async (req, res) => {
  try {
    const { apiKey, senderNumber, enabled, template } = req.body || {};
    const existing = await prisma.whatsappConfig.findFirst({ orderBy: { id: 'asc' } });

    const data = {};
    if (typeof enabled === 'boolean') data.enabled = enabled;
    if (senderNumber !== undefined) data.senderNumber = senderNumber ? String(senderNumber).trim() : null;
    if (template !== undefined) data.template = template ? String(template) : null;
    if (apiKey !== undefined && String(apiKey).trim()) data.apiKey = String(apiKey).trim();

    let saved;
    if (existing) {
      saved = await prisma.whatsappConfig.update({ where: { id: existing.id }, data });
    } else {
      saved = await prisma.whatsappConfig.create({
        data: { enabled: data.enabled ?? true, senderNumber: data.senderNumber ?? null, template: data.template ?? null, apiKey: data.apiKey ?? null },
      });
    }
    invalidateConfigCache();
    res.json({
      success: true,
      enabled: saved.enabled,
      senderNumber: saved.senderNumber,
      hasKey: !!saved.apiKey,
      keyMasked: maskKey(saved.apiKey),
      template: saved.template || DEFAULT_TEMPLATE,
      updatedAt: saved.updatedAt,
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// POST /api/wasender/test — envoi d'un message de test immédiat
router.post('/test', authorize('ADMIN'), async (req, res) => {
  try {
    const cfg = await getWhatsappConfig({ fresh: true });
    if (!cfg?.apiKey) return res.status(400).json({ success: false, error: 'Aucune clé API configurée.' });
    const to = formatPhoneCI(req.body?.to);
    if (!to) return res.status(400).json({ success: false, error: 'Numéro invalide.' });
    const text = req.body?.text
      || renderTemplate(cfg.template, { clientNom: 'Client Test', produitNom: 'Produit Test', orderReference: 'TEST1234', quantite: 1, montant: 0 });
    const r = await sendWhatsAppText({ to, text, apiKey: cfg.apiKey });
    // Journalise le test dans la file pour qu'il apparaisse dans la liste des messages.
    try {
      await prisma.whatsappOutbox.create({
        data: {
          toNumber: to,
          text,
          status: r.ok ? 'SENT' : 'FAILED',
          attempts: 1,
          msgId: r.msgId || null,
          lastError: r.ok ? null : (r.error || 'unknown').slice(0, 300),
          sentAt: r.ok ? new Date() : null,
        },
      });
    } catch { /* journalisation non bloquante */ }
    res.status(r.ok ? 200 : 400).json({ ...r, to });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'Erreur' });
  }
});

// GET /api/wasender/outbox — liste filtrée + paginée + compteurs globaux
// Query : status (PENDING|SENT|FAILED), search (numéro ou texte), page, limit
router.get('/outbox', authorize('ADMIN'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;

    const where = {};
    if (status && ['PENDING', 'SENT', 'FAILED'].includes(String(status))) {
      where.status = String(status);
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { toNumber: { contains: q } },
        { text: { contains: q, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [rows, total, counts] = await Promise.all([
      prisma.whatsappOutbox.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
      prisma.whatsappOutbox.count({ where }),
      prisma.whatsappOutbox.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const byStatus = {};
    for (const c of counts) byStatus[c.status] = c._count._all;

    res.json({
      byStatus,
      rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

export default router;

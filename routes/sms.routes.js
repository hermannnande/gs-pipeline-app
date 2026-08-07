/**
 * Admin — notifications SMS (SMSenvoie).
 * Liste des SMS (file + historique), renvoi des échoués, config (activation,
 * heures silencieuses, cap/jour, clé API), état du fournisseur (quota + device).
 * Réservé aux ADMIN. La clé API n'est JAMAIS renvoyée en clair.
 */
import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';
import {
  getSmsConfig, invalidateSmsConfigCache, getProviderQuota, getProviderDevices, SMS_TYPES,
} from '../utils/smsEnvoie.js';

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));

const STATUTS = ['PENDING', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED'];

/** Masque la clé (ne renvoie jamais la clé en clair). */
function maskKey(k) {
  if (!k) return null;
  const s = String(k);
  return s.length <= 8 ? '••••' : `${s.slice(0, 7)}…${s.slice(-4)}`;
}

function configPayload(cfg) {
  return {
    enabled: cfg?.enabled ?? false,
    hasKey: !!cfg?.apiKey,
    keyMasked: maskKey(cfg?.apiKey),
    quietStart: cfg?.quietStart ?? 21,
    quietEnd: cfg?.quietEnd ?? 7,
    maxPerPhonePerDay: cfg?.maxPerPhonePerDay ?? 6,
    updatedAt: cfg?.updatedAt || null,
  };
}

// GET /api/sms/logs — liste filtrée + paginée + compteurs (globaux et du jour)
// Query : status, type, search (téléphone, message ou nom client), page, limit
router.get('/logs', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, type, search, page = 1, limit = 25 } = req.query;

    const where = { companyId };
    if (status && STATUTS.includes(String(status))) where.statut = String(status);
    if (type && SMS_TYPES.includes(String(type))) where.type = String(type);
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { toPhone: { contains: q } },
        { message: { contains: q, mode: 'insensitive' } },
        { order: { clientNom: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    // Début du jour (Abidjan = UTC+0) pour les compteurs « aujourd'hui ».
    const startDay = new Date();
    startDay.setUTCHours(0, 0, 0, 0);

    const [rows, total, counts, sentToday, failedToday, pendingNow] = await Promise.all([
      prisma.smsOutbox.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { order: { select: { clientNom: true, orderReference: true } } },
      }),
      prisma.smsOutbox.count({ where }),
      prisma.smsOutbox.groupBy({ by: ['statut'], where: { companyId }, _count: { _all: true } }),
      prisma.smsOutbox.count({ where: { companyId, statut: 'SENT', sentAt: { gte: startDay } } }),
      prisma.smsOutbox.count({ where: { companyId, statut: 'FAILED', updatedAt: { gte: startDay } } }),
      prisma.smsOutbox.count({ where: { companyId, statut: 'PENDING' } }),
    ]);

    const byStatus = {};
    for (const c of counts) byStatus[c.statut] = c._count._all;

    res.json({
      byStatus,
      today: { sent: sentToday, failed: failedToday, pending: pendingNow },
      rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// POST /api/sms/:id/retry — remet un SMS échoué (ou annulé/skippé) en PENDING
router.post('/:id/retry', async (req, res) => {
  try {
    const row = await prisma.smsOutbox.findFirst({
      where: { id: String(req.params.id), companyId: req.user.companyId },
    });
    if (!row) return res.status(404).json({ error: 'SMS introuvable.' });
    if (!['FAILED', 'CANCELLED', 'SKIPPED'].includes(row.statut)) {
      return res.status(400).json({ error: `Renvoi impossible depuis le statut ${row.statut}.` });
    }
    const updated = await prisma.smsOutbox.update({
      where: { id: row.id },
      data: { statut: 'PENDING', error: null, attempts: 0, scheduledAt: new Date() },
    });
    res.json({ success: true, sms: updated });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// GET /api/sms/config — état courant (clé masquée)
router.get('/config', async (req, res) => {
  try {
    const cfg = await getSmsConfig(req.user.companyId, { fresh: true });
    res.json(configPayload(cfg));
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// PUT /api/sms/config — met à jour (clé mise à jour seulement si fournie)
router.put('/config', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { apiKey, enabled, quietStart, quietEnd, maxPerPhonePerDay } = req.body || {};

    const data = {};
    if (typeof enabled === 'boolean') data.enabled = enabled;
    if (quietStart !== undefined) {
      const v = parseInt(quietStart, 10);
      if (!Number.isInteger(v) || v < 0 || v > 23) return res.status(400).json({ error: 'quietStart invalide (0-23).' });
      data.quietStart = v;
    }
    if (quietEnd !== undefined) {
      const v = parseInt(quietEnd, 10);
      if (!Number.isInteger(v) || v < 0 || v > 23) return res.status(400).json({ error: 'quietEnd invalide (0-23).' });
      data.quietEnd = v;
    }
    if (maxPerPhonePerDay !== undefined) {
      const v = parseInt(maxPerPhonePerDay, 10);
      if (!Number.isInteger(v) || v < 1 || v > 50) return res.status(400).json({ error: 'maxPerPhonePerDay invalide (1-50).' });
      data.maxPerPhonePerDay = v;
    }
    if (apiKey !== undefined && String(apiKey).trim()) data.apiKey = String(apiKey).trim();

    const saved = await prisma.smsConfig.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });
    invalidateSmsConfigCache();
    res.json({ success: true, ...configPayload(saved) });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

// GET /api/sms/provider-status — quota SMSenvoie + téléphone passerelle
// (proxifié côté serveur : la clé ne quitte jamais le backend)
router.get('/provider-status', async (req, res) => {
  try {
    const cfg = await getSmsConfig(req.user.companyId, { fresh: true });
    if (!cfg?.apiKey) return res.status(400).json({ error: 'Aucune clé API configurée.' });
    const [quota, devices] = await Promise.all([
      getProviderQuota(cfg.apiKey),
      getProviderDevices(cfg.apiKey),
    ]);
    res.json({
      quota: quota.ok ? quota.data : null,
      quotaError: quota.ok ? null : (quota.error || 'Erreur quota'),
      devices: devices.ok ? devices.data : null,
      devicesError: devices.ok ? null : (devices.error || 'Erreur devices'),
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Erreur' });
  }
});

export default router;

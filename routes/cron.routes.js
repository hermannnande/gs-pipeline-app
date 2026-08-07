/**
 * Tâches planifiées (Vercel Cron). Protégées par CRON_SECRET.
 * Vercel envoie automatiquement `Authorization: Bearer ${CRON_SECRET}`
 * quand la variable d'env CRON_SECRET est définie sur le projet.
 */
import express from 'express';
import { processOutbox } from '../utils/wasender.js';
import { processSmsOutbox } from '../utils/smsEnvoie.js';
import { prisma } from '../utils/prisma.js';
import { supabaseAdmin } from '../utils/supabaseAdmin.js';

const router = express.Router();

function authorizeCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  // En l'absence de secret configuré, on refuse par sécurité.
  if (!secret) return res.status(503).json({ error: 'CRON_SECRET non configuré' });
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${secret}` || req.query.key === secret) return next();
  return res.status(401).json({ error: 'Non autorisé' });
}

// GET /api/cron/whatsapp-outbox — draine la file d'envoi WhatsApp
router.get('/whatsapp-outbox', authorizeCron, async (req, res) => {
  try {
    const result = await processOutbox({ max: 8, spacingMs: 6000 });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron] whatsapp-outbox erreur:', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || 'Erreur' });
  }
});

// GET /api/cron/sms-worker — draine la file SMS (SMSenvoie) : règles
// intelligentes appliquées dans processSmsOutbox (statut commande, heures
// silencieuses, cap/jour/numéro). Planifié toutes les 5 min via vercel.json.
router.get('/sms-worker', authorizeCron, async (req, res) => {
  try {
    const result = await processSmsOutbox({ max: 30 });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron] sms-worker erreur:', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || 'Erreur' });
  }
});

// GET /api/cron/call-recordings-cleanup — purge les enregistrements d'appels
// de plus de 7 jours (fichier bucket + ligne DB) pour ne pas charger la base.
const CALL_RECORDING_TTL_DAYS = 7;
router.get('/call-recordings-cleanup', authorizeCron, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - CALL_RECORDING_TTL_DAYS * 24 * 60 * 60 * 1000);
    const olds = await prisma.callRecording.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, filePath: true },
      take: 2000,
    });
    let storageRemoved = 0;
    // Suppression storage par lots de 100 (limite API Supabase).
    for (let i = 0; i < olds.length; i += 100) {
      const batch = olds.slice(i, i + 100).map((r) => r.filePath);
      const { error } = await supabaseAdmin.storage.from('call-recordings').remove(batch);
      if (error) console.error('[cron] call-recordings-cleanup storage:', error.message);
      else storageRemoved += batch.length;
    }
    const { count } = await prisma.callRecording.deleteMany({
      where: { id: { in: olds.map((r) => r.id) } },
    });
    res.json({ ok: true, deleted: count, storageRemoved, cutoff });
  } catch (e) {
    console.error('[cron] call-recordings-cleanup erreur:', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || 'Erreur' });
  }
});

export default router;

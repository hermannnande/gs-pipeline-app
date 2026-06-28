/**
 * Tâches planifiées (Vercel Cron). Protégées par CRON_SECRET.
 * Vercel envoie automatiquement `Authorization: Bearer ${CRON_SECRET}`
 * quand la variable d'env CRON_SECRET est définie sur le projet.
 */
import express from 'express';
import { processOutbox } from '../utils/wasender.js';

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

export default router;

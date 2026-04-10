import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { logAudit } from '../middlewares/audit.middleware.js';
import { prisma } from '../utils/prisma.js';
import { handleIncomingMessage, sendHumanMessage } from '../services/whatsapp/conversation.service.js';
import { parseWebhookPayload, verifyWebhook } from '../services/whatsapp/dialog360.js';

const router = express.Router();

// =============================================
// WEBHOOK 360dialog (pas d'auth JWT)
// =============================================

router.get('/webhook', (req, res) => {
  const { valid, challenge } = verifyWebhook(req.query);
  if (valid) return res.status(200).send(challenge);
  return res.status(403).json({ error: 'Verification failed' });
});

router.post('/webhook', async (req, res) => {
  res.status(200).json({ status: 'ok' });

  try {
    const events = parseWebhookPayload(req.body);

    for (const evt of events) {
      if (evt.type === 'message') {
        await handleIncomingMessage(evt);
      }
    }
  } catch (err) {
    console.error('[WA Webhook] Erreur:', err);
  }
});

// =============================================
// API ADMIN — Conversations
// =============================================

router.use('/conversations', authenticate);
router.use('/conversations', authorize('ADMIN', 'GESTIONNAIRE'));

router.get('/conversations', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const companyId = req.user.companyId;

    const where = { companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { waId: { contains: search } },
        { extractedProduct: { contains: search, mode: 'insensitive' } },
        { extractedCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [conversations, total] = await Promise.all([
      prisma.waConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          assignedUser: { select: { id: true, nom: true, prenom: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.waConversation.count({ where }),
    ]);

    res.json({ conversations, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('[WA] Erreur liste conversations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/conversations/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, botActive, humanHandoff, resolved, todayCount, todayOrders] = await Promise.all([
      prisma.waConversation.count({ where: { companyId } }),
      prisma.waConversation.count({ where: { companyId, status: 'BOT_ACTIVE' } }),
      prisma.waConversation.count({ where: { companyId, status: 'HUMAN_HANDOFF' } }),
      prisma.waConversation.count({ where: { companyId, status: 'RESOLVED' } }),
      prisma.waConversation.count({ where: { companyId, createdAt: { gte: today } } }),
      prisma.waConversation.count({ where: { companyId, orderId: { not: null }, createdAt: { gte: today } } }),
    ]);

    const orderRate = total > 0 ? Math.round((await prisma.waConversation.count({ where: { companyId, orderId: { not: null } } })) / total * 100) : 0;
    const handoffRate = total > 0 ? Math.round(humanHandoff / total * 100) : 0;

    res.json({
      total, botActive, humanHandoff, resolved,
      todayConversations: todayCount,
      todayOrders,
      orderConversionRate: orderRate,
      handoffRate,
    });
  } catch (err) {
    console.error('[WA] Erreur stats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const conv = await prisma.waConversation.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId },
      include: {
        assignedUser: { select: { id: true, nom: true, prenom: true } },
        messages: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });

    await prisma.waConversation.update({ where: { id: conv.id }, data: { unreadCount: 0 } });

    res.json({ conversation: conv });
  } catch (err) {
    console.error('[WA] Erreur detail conversation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/conversations/:id/send', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Texte requis' });

    const msg = await sendHumanMessage(parseInt(req.params.id), text.trim(), req.user.id);

    logAudit(req, {
      action: 'WA_HUMAN_MESSAGE',
      entityType: 'WaConversation',
      entityId: parseInt(req.params.id),
      details: { messageLength: text.length },
    });

    res.json({ message: msg });
  } catch (err) {
    console.error('[WA] Erreur envoi message:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

router.post('/conversations/:id/handoff', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conv = await prisma.waConversation.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });

    await prisma.waConversation.update({
      where: { id },
      data: {
        status: 'HUMAN_HANDOFF',
        convState: 'HUMAN_HANDOFF',
        assignedUserId: req.user.id,
        handoffReason: 'MANUAL',
        handoffAt: new Date(),
        handoffBy: req.user.id,
      },
    });

    logAudit(req, {
      action: 'WA_HANDOFF_MANUAL',
      entityType: 'WaConversation',
      entityId: id,
    });

    res.json({ success: true, message: 'Conversation prise en charge.' });
  } catch (err) {
    console.error('[WA] Erreur handoff:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/conversations/:id/return-to-bot', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.waConversation.update({
      where: { id },
      data: {
        status: 'BOT_ACTIVE',
        convState: 'GREETING',
        assignedUserId: null,
        handoffReason: null,
      },
    });

    res.json({ success: true, message: 'Conversation rendue au bot.' });
  } catch (err) {
    console.error('[WA] Erreur retour bot:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/conversations/:id/resolve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.waConversation.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[WA] Erreur resolve:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/conversations/:id/archive', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.waConversation.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[WA] Erreur archive:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

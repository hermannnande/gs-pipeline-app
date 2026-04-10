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
  console.log('[WA Webhook GET] Query params:', JSON.stringify(req.query));
  const { valid, challenge } = verifyWebhook(req.query);
  if (valid) return res.status(200).send(challenge);
  return res.status(403).json({ error: 'Verification failed' });
});

router.post('/webhook', async (req, res) => {
  console.log('[WA Webhook POST] Body recu:', JSON.stringify(req.body).slice(0, 1000));

  res.status(200).json({ status: 'ok' });

  try {
    const events = parseWebhookPayload(req.body);
    console.log('[WA Webhook POST] Events parses:', events.length, events.map(e => ({ type: e.type, from: e.from, msgType: e.messageType })));

    for (const evt of events) {
      if (evt.type === 'message') {
        try {
          const result = await handleIncomingMessage(evt);
          console.log('[WA Webhook POST] Message traite:', JSON.stringify(result));
        } catch (msgErr) {
          console.error('[WA Webhook POST] Erreur traitement message:', msgErr.message, msgErr.stack);
        }
      }
    }
  } catch (err) {
    console.error('[WA Webhook] Erreur parse:', err.message, err.stack);
  }
});

// Diagnostic endpoint
router.get('/diag', async (req, res) => {
  const { WA_CONFIG } = await import('../services/whatsapp/config.js');
  const { sendTextMessage } = await import('../services/whatsapp/dialog360.js');
  
  let dbOk = false;
  let dbError = null;
  let tableExists = false;
  try {
    const r = await prisma.$queryRaw`SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name = 'wa_conversations'`;
    tableExists = r[0]?.c > 0 || parseInt(r[0]?.c) > 0;
    dbOk = true;
  } catch (e) {
    dbError = e.message;
  }

  let convCount = null;
  let msgCount = null;
  let recentConv = null;
  let recentMessages = [];
  try {
    convCount = await prisma.waConversation.count();
    msgCount = await prisma.waMessage.count();
    recentConv = await prisma.waConversation.findFirst({ orderBy: { lastMessageAt: 'desc' } });
    if (recentConv) {
      recentMessages = await prisma.waMessage.findMany({
        where: { conversationId: recentConv.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: { id: true, direction: true, actor: true, contentType: true, body: true, externalId: true, timestamp: true, transcription: true },
      });
    }
  } catch (e) {
    dbError = (dbError || '') + ' | ' + e.message;
  }

  let sendTest = null;
  if (req.query.testSend && recentConv?.waId) {
    sendTest = await sendTextMessage(recentConv.waId, 'Test de connexion OB Gestion - ignorez ce message.');
  }

  res.json({
    config: {
      apiKeySet: !!WA_CONFIG.dialog360.apiKey,
      apiKeyPrefix: WA_CONFIG.dialog360.apiKey ? WA_CONFIG.dialog360.apiKey.slice(0, 6) + '...' : 'MISSING',
      apiUrl: WA_CONFIG.dialog360.apiUrl,
      webhookSecretSet: !!WA_CONFIG.dialog360.webhookSecret,
      botEnabled: WA_CONFIG.bot.enabled,
      defaultCompanyId: WA_CONFIG.bot.defaultCompanyId,
      deepgramKeySet: !!WA_CONFIG.transcription.deepgramApiKey,
    },
    database: {
      ok: dbOk,
      tableExists,
      conversations: convCount,
      messages: msgCount,
      error: dbError,
    },
    recentConversation: recentConv ? {
      id: recentConv.id,
      waId: recentConv.waId,
      status: recentConv.status,
      convState: recentConv.convState,
      lastIntent: recentConv.lastIntent,
      lastBotMessage: recentConv.lastBotMessage?.slice(0, 200),
      confidenceScore: recentConv.confidenceScore,
      extractedProduct: recentConv.extractedProduct,
    } : null,
    recentMessages: recentMessages.map(m => ({
      id: m.id,
      dir: m.direction,
      actor: m.actor,
      body: m.body?.slice(0, 150),
      time: m.timestamp,
    })),
    sendTest,
  });
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

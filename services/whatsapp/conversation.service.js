import { prisma } from '../../utils/prisma.js';
import { detectIntent } from './intent-detector.js';
import { processConversation } from './state-machine.js';
import { TEMPLATES } from './response-templates.js';
import { sendTextMessage, downloadMedia } from './dialog360.js';
import { transcribeAudio } from './deepgram.js';
import { createOrderFromConversation } from './order-intake.js';
import { computeTotalAmount } from '../../utils/pricing.js';
import { WA_CONFIG } from './config.js';

export async function handleIncomingMessage({ from, messageId, contactName, messageType, text, audio, image, video, document: doc, timestamp }) {
  const companyId = WA_CONFIG.bot.defaultCompanyId;

  const existing = await prisma.waMessage.findUnique({ where: { externalId: messageId } });
  if (existing) return { duplicate: true };

  let conv = await prisma.waConversation.findUnique({
    where: { waId_companyId: { waId: from, companyId } },
  });

  if (!conv) {
    conv = await prisma.waConversation.create({
      data: {
        waId: from,
        companyId,
        customerName: contactName || null,
        customerPhone: from,
        status: 'BOT_ACTIVE',
        convState: 'NEW',
      },
    });
  }

  let contentType = mapContentType(messageType);
  let body = text || null;
  let mediaUrl = null;
  let mediaMimeType = null;
  let mediaFilename = null;
  let transcription = null;
  let transcriptionOk = null;

  if (audio) {
    mediaUrl = audio.id;
    mediaMimeType = audio.mime_type;
    console.log('[WA] Audio recu — mediaId:', audio.id, '| mime:', audio.mime_type);
    try {
      const audioBuffer = await downloadMedia(audio.id);
      console.log('[WA] Audio download:', audioBuffer ? `${audioBuffer.length} octets` : 'ECHEC');
      if (audioBuffer) {
        const result = await transcribeAudio(audioBuffer, audio.mime_type);
        console.log('[WA] Transcription:', result.ok ? `"${result.text}"` : `ECHEC: ${result.error}`);
        transcription = result.text;
        transcriptionOk = result.ok;
        if (result.ok && result.text) {
          body = result.text;
        }
      }
    } catch (err) {
      console.error('[WA] Erreur transcription:', err.message);
      transcriptionOk = false;
    }
  }

  if (image) {
    mediaUrl = image.id;
    mediaMimeType = image.mime_type;
    body = image.caption || null;
  }
  if (video) {
    mediaUrl = video.id;
    mediaMimeType = video.mime_type;
    body = video.caption || null;
  }
  if (doc) {
    mediaUrl = doc.id;
    mediaMimeType = doc.mime_type;
    mediaFilename = doc.filename || null;
    body = doc.caption || null;
  }

  const inMsg = await prisma.waMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'INBOUND',
      actor: 'CUSTOMER',
      contentType,
      body,
      externalId: messageId,
      mediaUrl,
      mediaMimeType,
      mediaFilename,
      transcription,
      transcriptionOk,
      timestamp: timestamp || new Date(),
    },
  });

  await prisma.waConversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      customerName: contactName || conv.customerName,
    },
  });

  if (conv.status === 'HUMAN_HANDOFF') {
    return { conversationId: conv.id, messageId: inMsg.id, handled: 'human' };
  }

  if (!WA_CONFIG.bot.enabled || !body) {
    return { conversationId: conv.id, messageId: inMsg.id, handled: 'no_bot' };
  }

  const { intent, confidence } = detectIntent(body, conv.convState);
  const stateResult = await processConversation(conv, intent, confidence, body, companyId);

  let responseText = stateResult.response;

  if (stateResult.action === 'CONFIRM_PROMPT') {
    const product = await getProductForConfirm(stateResult.extraction.productId);
    const total = product
      ? computeTotalAmount(product, stateResult.extraction.qty || 1)
      : 9900 * (stateResult.extraction.qty || 1);

    responseText = TEMPLATES.confirmOrder({
      product: stateResult.extraction.product || '?',
      qty: stateResult.extraction.qty || 1,
      name: stateResult.extraction.name || '?',
      phone: stateResult.extraction.phone || from,
      city: stateResult.extraction.city || '?',
      address: stateResult.extraction.address || '',
      total,
    });
  }

  if (stateResult.shouldCreateOrder) {
    try {
      const order = await createOrderFromConversation(conv, stateResult.extraction, companyId);
      responseText = TEMPLATES.orderCreated(order.orderReference);
      stateResult.extraction.orderId = order.id;
    } catch (err) {
      console.error('[WA] Erreur creation commande:', err.message);
      responseText = TEMPLATES.handoffAutomatic('order_error');
      stateResult.newState = 'HUMAN_HANDOFF';
      stateResult.action = 'HANDOFF';
    }
  }

  const updateData = {
    convState: stateResult.newState,
    lastIntent: intent,
    extractedProduct: stateResult.extraction.product,
    extractedProductId: stateResult.extraction.productId,
    extractedQty: stateResult.extraction.qty,
    extractedName: stateResult.extraction.name,
    extractedPhone: stateResult.extraction.phone,
    extractedCity: stateResult.extraction.city,
    extractedCommune: stateResult.extraction.commune,
    extractedAddress: stateResult.extraction.address,
    confidenceScore: confidence,
    lastBotMessage: responseText,
  };

  if (stateResult.extraction.orderId) {
    updateData.orderId = stateResult.extraction.orderId;
  }

  if (stateResult.action === 'HANDOFF') {
    updateData.status = 'HUMAN_HANDOFF';
    updateData.handoffReason = mapHandoffReason(intent);
    updateData.handoffAt = new Date();
  } else if (stateResult.newState === 'COMPLETED') {
    updateData.status = 'RESOLVED';
  } else {
    updateData.status = 'BOT_ACTIVE';
  }

  await prisma.waConversation.update({ where: { id: conv.id }, data: updateData });

  await prisma.waRulesLog.create({
    data: {
      conversationId: conv.id,
      inputText: body,
      detectedIntent: intent,
      confidence,
      extractedData: JSON.stringify(stateResult.extraction),
      actionTaken: stateResult.action,
      responseChosen: responseText?.slice(0, 500),
      convStateBefore: conv.convState,
      convStateAfter: stateResult.newState,
    },
  });

  if (responseText) {
    const sendResult = await sendTextMessage(from, responseText);

    await prisma.waMessage.create({
      data: {
        conversationId: conv.id,
        direction: 'OUTBOUND',
        actor: stateResult.action === 'HANDOFF' ? 'SYSTEM' : 'BOT',
        contentType: 'TEXT',
        body: responseText,
        externalId: sendResult.messageId || `bot_${Date.now()}`,
        timestamp: new Date(),
      },
    });
  }

  return { conversationId: conv.id, messageId: inMsg.id, handled: 'bot', intent, state: stateResult.newState };
}

export async function sendHumanMessage(conversationId, text, userId) {
  const conv = await prisma.waConversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw new Error('Conversation introuvable');

  const sendResult = await sendTextMessage(conv.waId, text);

  const msg = await prisma.waMessage.create({
    data: {
      conversationId,
      direction: 'OUTBOUND',
      actor: 'HUMAN',
      contentType: 'TEXT',
      body: text,
      externalId: sendResult.messageId || `human_${Date.now()}`,
      senderUserId: userId,
      timestamp: new Date(),
    },
  });

  await prisma.waConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return msg;
}

async function getProductForConfirm(productId) {
  if (!productId) return null;
  return prisma.product.findUnique({ where: { id: productId } });
}

function mapContentType(waType) {
  const map = {
    text: 'TEXT', audio: 'AUDIO', image: 'IMAGE', video: 'VIDEO',
    document: 'DOCUMENT', location: 'LOCATION', sticker: 'STICKER',
    reaction: 'REACTION',
  };
  return map[waType] || 'TEXT';
}

function mapHandoffReason(intent) {
  const map = {
    HUMAN_REQUEST: 'CUSTOMER_REQUEST',
    COMPLAINT: 'COMPLAINT',
    UNKNOWN: 'UNKNOWN_INTENT',
  };
  return map[intent] || 'LOW_CONFIDENCE';
}

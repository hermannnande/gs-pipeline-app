import { WA_CONFIG } from './config.js';

const { apiKey, apiUrl } = WA_CONFIG.dialog360;

export async function sendTextMessage(to, text) {
  if (!apiKey) {
    console.warn('[360dialog] API key manquante — message non envoyé');
    return { success: false, error: 'API_KEY_MISSING' };
  }

  try {
    const resp = await fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': apiKey,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('[360dialog] Erreur envoi:', data);
      return { success: false, error: data };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || null,
    };
  } catch (err) {
    console.error('[360dialog] Exception:', err.message);
    return { success: false, error: err.message };
  }
}

export async function downloadMedia(mediaId) {
  if (!apiKey) return null;

  try {
    const resp = await fetch(`${apiUrl}/media/${mediaId}`, {
      headers: { 'D360-API-KEY': apiKey },
    });

    if (!resp.ok) {
      console.error('[360dialog] Erreur download media:', resp.status);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    return Buffer.from(buffer);
  } catch (err) {
    console.error('[360dialog] Exception download media:', err.message);
    return null;
  }
}

export async function getMediaUrl(mediaId) {
  if (!apiKey) return null;

  try {
    const resp = await fetch(`${apiUrl}/media/${mediaId}`, {
      method: 'GET',
      headers: { 'D360-API-KEY': apiKey },
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.url || null;
  } catch (err) {
    console.error('[360dialog] getMediaUrl error:', err.message);
    return null;
  }
}

export function parseWebhookPayload(body) {
  const results = [];

  const entries = body?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      const contacts = value.contacts || [];
      const messages = value.messages || [];
      const statuses = value.statuses || [];

      for (const msg of messages) {
        const contact = contacts.find(c => c.wa_id === msg.from) || {};

        results.push({
          type: 'message',
          from: msg.from,
          messageId: msg.id,
          timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date(),
          contactName: contact.profile?.name || null,
          messageType: msg.type,
          text: msg.text?.body || null,
          audio: msg.audio || null,
          image: msg.image || null,
          video: msg.video || null,
          document: msg.document || null,
          location: msg.location || null,
          sticker: msg.sticker || null,
          reaction: msg.reaction || null,
        });
      }

      for (const status of statuses) {
        results.push({
          type: 'status',
          messageId: status.id,
          status: status.status,
          recipientId: status.recipient_id,
          timestamp: status.timestamp ? new Date(parseInt(status.timestamp) * 1000) : new Date(),
        });
      }
    }
  }

  return results;
}

export function verifyWebhook(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  const expected = WA_CONFIG.dialog360.webhookSecret;

  if (mode === 'subscribe' && token === expected) {
    return { valid: true, challenge };
  }
  return { valid: false };
}

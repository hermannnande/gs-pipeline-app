import { createHash } from 'crypto';

const DEFAULT_PIXEL_ID = process.env.META_PIXEL_ID || '';
const DEFAULT_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const API_VERSION = 'v21.0';

function getTokenForPixel(pixelId) {
  const tokens = process.env.META_PIXEL_TOKENS || '';
  if (tokens) {
    for (const pair of tokens.split(',')) {
      const [pid, tok] = pair.split(':');
      if (pid?.trim() === pixelId) return tok?.trim() || '';
    }
  }
  if (pixelId === DEFAULT_PIXEL_ID) return DEFAULT_ACCESS_TOKEN;
  return DEFAULT_ACCESS_TOKEN;
}

function sha256(value) {
  if (!value) return null;
  const clean = String(value).trim().toLowerCase();
  if (!clean) return null;
  return createHash('sha256').update(clean).digest('hex');
}

function normalizePhone(phone) {
  if (!phone) return null;
  let p = phone.replace(/[^0-9+]/g, '');
  if (!p.startsWith('+')) {
    if (p.startsWith('225')) p = '+' + p;
    else p = '+225' + p;
  }
  return p;
}

export async function sendMetaEvent({ eventName, eventId, sourceUrl, userData = {}, customData = {}, actionSource = 'website', pixelId: overridePixelId } = {}) {
  const pixelId = overridePixelId || DEFAULT_PIXEL_ID;
  const accessToken = getTokenForPixel(pixelId);

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] PIXEL_ID ou ACCESS_TOKEN manquant — event ignore:', eventName);
    return null;
  }

  const eventTime = Math.floor(Date.now() / 1000);

  const hashedUserData = {};
  if (userData.phone) hashedUserData.ph = [sha256(normalizePhone(userData.phone))];
  if (userData.email) hashedUserData.em = [sha256(userData.email)];
  if (userData.firstName) hashedUserData.fn = [sha256(userData.firstName)];
  if (userData.lastName) hashedUserData.ln = [sha256(userData.lastName)];
  if (userData.city) hashedUserData.ct = [sha256(userData.city)];
  hashedUserData.country = [sha256('ci')];

  if (userData.clientIp) hashedUserData.client_ip_address = userData.clientIp;
  if (userData.userAgent) hashedUserData.client_user_agent = userData.userAgent;
  if (userData.fbc) hashedUserData.fbc = userData.fbc;
  if (userData.fbp) hashedUserData.fbp = userData.fbp;

  const eventData = {
    event_name: eventName,
    event_time: eventTime,
    action_source: actionSource,
    event_source_url: sourceUrl || undefined,
    user_data: hashedUserData,
    custom_data: customData,
  };

  if (eventId) eventData.event_id = eventId;

  const payload = { data: [eventData] };

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();

    if (!res.ok) {
      console.error('[Meta CAPI] Erreur:', res.status, JSON.stringify(body));
      return null;
    }

    console.log(`[Meta CAPI] ${eventName} envoye — events_received:`, body.events_received);
    return body;
  } catch (err) {
    console.error('[Meta CAPI] Exception:', err.message);
    return null;
  }
}

export async function sendPurchaseEvent({ orderId, orderRef, amount, currency = 'XOF', productName, productCode, quantity, customerPhone, customerCity, clientIp, userAgent, fbc, fbp, sourceUrl, pixelId }) {
  return sendMetaEvent({
    eventName: 'Purchase',
    eventId: `purchase_${orderRef || orderId}`,
    sourceUrl,
    userData: {
      phone: customerPhone,
      city: customerCity,
      clientIp,
      userAgent,
      fbc,
      fbp,
    },
    customData: {
      currency,
      value: amount,
      content_name: productName,
      content_ids: [productCode],
      content_type: 'product',
      num_items: quantity,
      order_id: orderRef || String(orderId),
    },
    pixelId,
  });
}

import { normalize, removeEmojis } from './normalizer.js';
import { INTENTS, INTENT_PATTERNS } from './config.js';

export function detectIntent(rawText, convState) {
  const text = normalize(removeEmojis(rawText || ''));
  if (!text) return { intent: INTENTS.UNKNOWN, confidence: 0 };

  const scores = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let maxScore = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const matchLen = (text.match(pattern)?.[0] || '').length;
        const score = Math.min(90, 50 + Math.round((matchLen / text.length) * 40));
        maxScore = Math.max(maxScore, score);
      }
    }
    if (maxScore > 0) scores[intent] = maxScore;
  }

  if (convState && Object.keys(scores).length === 0) {
    const contextual = inferFromState(text, convState);
    if (contextual) return contextual;
  }

  if (convState) {
    applyContextBoost(scores, convState);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return { intent: INTENTS.UNKNOWN, confidence: 10 };
  }

  return { intent: sorted[0][0], confidence: sorted[0][1] };
}

function inferFromState(text, convState) {
  switch (convState) {
    case 'ASKING_PRODUCT':
      if (text.length >= 3) return { intent: INTENTS.ORDER_CONTINUE, confidence: 55 };
      break;
    case 'ASKING_QUANTITY':
      if (/[1-9]/.test(text) || /\b(un|deux|trois)\b/.test(text))
        return { intent: INTENTS.ORDER_CONTINUE, confidence: 70 };
      break;
    case 'ASKING_NAME':
      if (text.length >= 3 && /^[a-z\s'-]+$/.test(text))
        return { intent: INTENTS.ORDER_CONTINUE, confidence: 65 };
      break;
    case 'ASKING_PHONE':
      if (/[0-9]{6,}/.test(text.replace(/\s/g, '')))
        return { intent: INTENTS.ORDER_CONTINUE, confidence: 75 };
      break;
    case 'ASKING_LOCATION':
    case 'ASKING_ADDRESS':
      if (text.length >= 3)
        return { intent: INTENTS.ORDER_CONTINUE, confidence: 55 };
      break;
    case 'CONFIRMING_ORDER':
      if (/^(oui|ok|yes|parfait|d'accord|c'est bon)/.test(text))
        return { intent: INTENTS.ORDER_CONFIRM, confidence: 85 };
      if (/^(non|nan|pas|annul)/.test(text))
        return { intent: INTENTS.ORDER_CANCEL, confidence: 80 };
      break;
  }
  return null;
}

function applyContextBoost(scores, convState) {
  const boosts = {
    ASKING_PRODUCT: { ORDER_CONTINUE: 15, PRODUCT_QUESTION: 10 },
    ASKING_QUANTITY: { ORDER_CONTINUE: 15 },
    ASKING_NAME: { ORDER_CONTINUE: 15 },
    ASKING_PHONE: { ORDER_CONTINUE: 15 },
    ASKING_LOCATION: { ORDER_CONTINUE: 15 },
    ASKING_ADDRESS: { ORDER_CONTINUE: 15 },
    CONFIRMING_ORDER: { ORDER_CONFIRM: 20, ORDER_CANCEL: 10, YES: 20, NO: 15 },
  };

  const stateBoosts = boosts[convState];
  if (!stateBoosts) return;

  for (const [intent, boost] of Object.entries(stateBoosts)) {
    if (scores[intent]) {
      scores[intent] = Math.min(95, scores[intent] + boost);
    }
  }
}

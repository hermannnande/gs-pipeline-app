import { INTENTS, CONV_STATES } from './config.js';
import { TEMPLATES } from './response-templates.js';
import { matchProduct, getProductCatalog } from './product-matcher.js';
import { extractQuantity, extractName, extractPhoneNumber, extractCity, normalize } from './normalizer.js';
import { CITY_PATTERNS } from './config.js';
import { computeTotalAmount } from '../../utils/pricing.js';

export async function processConversation(conv, intent, confidence, rawText, companyId) {
  const state = conv.convState || CONV_STATES.NEW;
  const extraction = {
    product: conv.extractedProduct,
    productId: conv.extractedProductId,
    qty: conv.extractedQty,
    name: conv.extractedName,
    phone: conv.extractedPhone,
    city: conv.extractedCity,
    commune: conv.extractedCommune,
    address: conv.extractedAddress,
  };

  let result = { response: null, newState: state, extraction, action: null, shouldCreateOrder: false };

  if (intent === INTENTS.HUMAN_REQUEST || intent === INTENTS.COMPLAINT) {
    result.response = intent === INTENTS.COMPLAINT ? TEMPLATES.handoffAutomatic('complaint') : TEMPLATES.handoff();
    result.newState = CONV_STATES.HUMAN_HANDOFF;
    result.action = 'HANDOFF';
    return result;
  }

  switch (state) {
    case CONV_STATES.NEW:
    case CONV_STATES.GREETING:
      result = await handleNewOrGreeting(intent, rawText, extraction, companyId);
      break;
    case CONV_STATES.ASKING_PRODUCT:
      result = await handleAskingProduct(intent, rawText, extraction, companyId);
      break;
    case CONV_STATES.ASKING_QUANTITY:
      result = handleAskingQuantity(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_NAME:
      result = handleAskingName(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_PHONE:
      result = handleAskingPhone(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_LOCATION:
      result = handleAskingLocation(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_ADDRESS:
      result = handleAskingAddress(intent, rawText, extraction);
      break;
    case CONV_STATES.CONFIRMING_ORDER:
      result = handleConfirming(intent, rawText, extraction, companyId);
      break;
    case CONV_STATES.FAQ:
      result = await handleFaq(intent, rawText, extraction, companyId);
      break;
    case CONV_STATES.COMPLETED:
      result = await handleCompleted(intent, rawText, extraction, companyId);
      break;
    default:
      result = await handleNewOrGreeting(intent, rawText, extraction, companyId);
  }

  return result;
}

async function handleNewOrGreeting(intent, rawText, extraction, companyId) {
  const r = { response: null, newState: CONV_STATES.GREETING, extraction, action: null, shouldCreateOrder: false };

  switch (intent) {
    case INTENTS.GREETING:
      r.response = TEMPLATES.welcome();
      r.newState = CONV_STATES.GREETING;
      break;
    case INTENTS.ORDER_START:
      r.response = TEMPLATES.askProduct();
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    case INTENTS.PRICE_REQUEST:
    case INTENTS.PRODUCT_QUESTION: {
      const match = await matchProduct(rawText, companyId);
      if (match.product) {
        r.response = TEMPLATES.productInfo(match.product);
        r.extraction.product = match.product.nom;
        r.extraction.productId = match.product.id;
        r.newState = CONV_STATES.ASKING_PRODUCT;
      } else {
        const catalog = await getProductCatalog(companyId);
        r.response = TEMPLATES.catalogList(catalog);
        r.newState = CONV_STATES.ASKING_PRODUCT;
      }
      break;
    }
    case INTENTS.DELIVERY_QUESTION:
      r.response = TEMPLATES.deliveryInfo();
      r.newState = CONV_STATES.FAQ;
      break;
    case INTENTS.PAYMENT_QUESTION:
      r.response = TEMPLATES.paymentInfo();
      r.newState = CONV_STATES.FAQ;
      break;
    case INTENTS.ORDER_STATUS:
      r.response = TEMPLATES.statusCheck();
      r.newState = CONV_STATES.FAQ;
      break;
    case INTENTS.THANKS:
      r.response = TEMPLATES.thanks();
      r.newState = CONV_STATES.COMPLETED;
      break;
    default: {
      const tryProduct = await matchProduct(rawText, companyId);
      if (tryProduct.product && tryProduct.confidence >= 50) {
        r.response = TEMPLATES.productInfo(tryProduct.product);
        r.extraction.product = tryProduct.product.nom;
        r.extraction.productId = tryProduct.product.id;
        r.newState = CONV_STATES.ASKING_PRODUCT;
      } else {
        r.response = TEMPLATES.welcome();
        r.newState = CONV_STATES.GREETING;
      }
    }
  }
  return r;
}

async function handleAskingProduct(intent, rawText, extraction, companyId) {
  const r = { response: null, newState: CONV_STATES.ASKING_PRODUCT, extraction: { ...extraction }, action: null, shouldCreateOrder: false };

  if (intent === INTENTS.DELIVERY_QUESTION) {
    r.response = TEMPLATES.deliveryInfo();
    return r;
  }
  if (intent === INTENTS.PAYMENT_QUESTION) {
    r.response = TEMPLATES.paymentInfo();
    return r;
  }

  const norm = normalize(rawText);
  if (/^[1-9]$/.test(norm.trim())) {
    const catalog = await getProductCatalog(companyId);
    const idx = parseInt(norm.trim()) - 1;
    if (idx >= 0 && idx < catalog.length) {
      r.extraction.product = catalog[idx].nom;
      r.extraction.productId = catalog[idx].id;
      r.response = TEMPLATES.askQuantity(catalog[idx].nom);
      r.newState = CONV_STATES.ASKING_QUANTITY;
      return r;
    }
  }

  const match = await matchProduct(rawText, companyId);
  if (match.product && match.confidence >= 40) {
    r.extraction.product = match.product.nom;
    r.extraction.productId = match.product.id;

    const qty = extractQuantity(rawText);
    if (qty) {
      r.extraction.qty = qty;
      r.response = TEMPLATES.askName();
      r.newState = CONV_STATES.ASKING_NAME;
    } else {
      r.response = TEMPLATES.askQuantity(match.product.nom);
      r.newState = CONV_STATES.ASKING_QUANTITY;
    }
  } else {
    r.response = TEMPLATES.productNotFound();
  }

  return r;
}

function handleAskingQuantity(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_QUANTITY, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const qty = extractQuantity(rawText);
  if (qty && qty >= 1 && qty <= 20) {
    r.extraction.qty = qty;
    if (r.extraction.name) {
      if (r.extraction.phone) {
        if (r.extraction.city) {
          r.newState = CONV_STATES.ASKING_ADDRESS;
          r.response = TEMPLATES.askAddress(r.extraction.city);
        } else {
          r.newState = CONV_STATES.ASKING_LOCATION;
          r.response = TEMPLATES.askCity();
        }
      } else {
        r.newState = CONV_STATES.ASKING_PHONE;
        r.response = TEMPLATES.askPhone();
      }
    } else {
      r.newState = CONV_STATES.ASKING_NAME;
      r.response = TEMPLATES.askName();
    }
  } else {
    r.response = `Veuillez indiquer une quantité valide (ex: 1, 2 ou 3).`;
  }
  return r;
}

function handleAskingName(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_NAME, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const name = extractName(rawText);
  if (name) {
    r.extraction.name = name;
    r.newState = CONV_STATES.ASKING_PHONE;
    r.response = TEMPLATES.askPhone();
  } else {
    r.response = `Veuillez me donner votre nom complet (prénom et nom).`;
  }
  return r;
}

function handleAskingPhone(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_PHONE, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const phone = extractPhoneNumber(rawText);
  if (phone) {
    r.extraction.phone = phone;
    r.newState = CONV_STATES.ASKING_LOCATION;
    r.response = TEMPLATES.askCity();
  } else {
    r.response = `Veuillez me donner un numéro de téléphone valide (ex: 07 00 00 00 00).`;
  }
  return r;
}

function handleAskingLocation(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_LOCATION, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const city = extractCity(rawText, CITY_PATTERNS);
  if (city) {
    r.extraction.city = city;
    r.newState = CONV_STATES.ASKING_ADDRESS;
    r.response = TEMPLATES.askAddress(city);
  } else {
    r.response = `Veuillez indiquer votre ville de livraison.`;
  }
  return r;
}

function handleAskingAddress(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_ADDRESS, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const text = rawText.trim();
  if (text.length >= 3) {
    r.extraction.address = text;
    r.newState = CONV_STATES.CONFIRMING_ORDER;
    r.action = 'CONFIRM_PROMPT';
    return r;
  }
  r.response = `Pouvez-vous préciser votre adresse ou un point de repère ?`;
  return r;
}

function handleConfirming(intent, rawText, extraction, companyId) {
  const r = { response: null, newState: CONV_STATES.CONFIRMING_ORDER, extraction: { ...extraction }, action: null, shouldCreateOrder: false };

  if (intent === INTENTS.ORDER_CONFIRM || intent === INTENTS.YES) {
    r.shouldCreateOrder = true;
    r.newState = CONV_STATES.COMPLETED;
    r.action = 'CREATE_ORDER';
    return r;
  }

  if (intent === INTENTS.ORDER_CANCEL || intent === INTENTS.NO) {
    r.response = TEMPLATES.orderCancelled();
    r.newState = CONV_STATES.GREETING;
    r.extraction = { product: null, productId: null, qty: null, name: null, phone: null, city: null, commune: null, address: null };
    r.action = 'CANCEL';
    return r;
  }

  r.response = `Veuillez répondre *OUI* pour confirmer ou *NON* pour annuler.`;
  return r;
}

async function handleFaq(intent, rawText, extraction, companyId) {
  return handleNewOrGreeting(intent, rawText, extraction, companyId);
}

async function handleCompleted(intent, rawText, extraction, companyId) {
  const r = { response: null, newState: CONV_STATES.COMPLETED, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  if (intent === INTENTS.ORDER_START) {
    r.extraction = { product: null, productId: null, qty: null, name: null, phone: null, city: null, commune: null, address: null };
    r.response = TEMPLATES.askProduct();
    r.newState = CONV_STATES.ASKING_PRODUCT;
  } else if (intent === INTENTS.GREETING) {
    r.response = TEMPLATES.welcomeBack(extraction.name);
    r.newState = CONV_STATES.GREETING;
  } else if (intent === INTENTS.THANKS) {
    r.response = TEMPLATES.thanks();
  } else {
    return handleNewOrGreeting(intent, rawText, extraction, companyId);
  }
  return r;
}

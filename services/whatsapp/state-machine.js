import { INTENTS, CONV_STATES, PRODUCT_KNOWLEDGE, PRODUCT_SYNONYMS } from './config.js';
import { TEMPLATES } from './response-templates.js';
import { matchProduct, getProductCatalog } from './product-matcher.js';
import { extractQuantity, extractName, extractPhoneNumber, extractCity, normalize } from './normalizer.js';
import { CITY_PATTERNS } from './config.js';

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

  // A tout moment (sauf CONFIRMING), si le client mentionne un produit,
  // on le detecte et on reoriente la conversation.
  const COLLECTION_STATES = [CONV_STATES.ASKING_QUANTITY, CONV_STATES.ASKING_LOCATION, CONV_STATES.ASKING_PHONE, CONV_STATES.ASKING_NAME, CONV_STATES.ASKING_ADDRESS];
  if (COLLECTION_STATES.includes(state)) {
    const productSwitch = await tryDetectProductSwitch(rawText, companyId);
    if (productSwitch) {
      const r = { response: null, newState: state, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
      r.extraction.product = productSwitch.nom;
      r.extraction.productId = productSwitch.id;
      r.extraction.qty = null;
      const qty = extractQuantity(rawText);
      if (qty) r.extraction.qty = qty;
      const next = advanceToNextMissing(r.extraction);
      r.newState = next.state;
      r.response = next.response;
      r.action = next.action || null;
      return r;
    }
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
    case CONV_STATES.ASKING_LOCATION:
      result = handleAskingLocation(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_PHONE:
      result = handleAskingPhone(intent, rawText, extraction);
      break;
    case CONV_STATES.ASKING_NAME:
      result = handleAskingName(intent, rawText, extraction);
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

async function tryDetectProductSwitch(rawText, companyId) {
  const norm = normalize(rawText);
  const productKeywords = [
    /(?:je (?:veux|voudrais|souhaite|cherche)|(?:la|le|du|des|une?)\s)/,
    /(?:creme|crème|patch|gaine|spray|poudre|serum|sérum)/,
    /(?:minceur|mincir|maigrir|amincissant|ventre|graisse)/,
  ];
  const looksLikeProductRequest = productKeywords.some(p => p.test(norm));
  if (!looksLikeProductRequest && norm.length < 6) return null;

  const match = await matchProduct(rawText, companyId);
  if (match.product && match.confidence >= 60) {
    return match.product;
  }
  return null;
}

function findProductKey(productName) {
  if (!productName) return null;
  const norm = normalize(productName);
  for (const [key, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
    for (const syn of synonyms) {
      if (norm.includes(normalize(syn))) return key;
    }
  }
  return null;
}

function getProductKeyFromExtraction(extraction) {
  if (!extraction.product) return null;
  return findProductKey(extraction.product) || null;
}

function advanceToNextMissing(extraction) {
  if (!extraction.qty) return { state: CONV_STATES.ASKING_QUANTITY, response: TEMPLATES.askQuantity(extraction.product) };
  if (!extraction.city) return { state: CONV_STATES.ASKING_LOCATION, response: TEMPLATES.askCity() };
  if (!extraction.phone) return { state: CONV_STATES.ASKING_PHONE, response: TEMPLATES.askPhone() };
  if (!extraction.name) return { state: CONV_STATES.ASKING_NAME, response: TEMPLATES.askName() };
  return { state: CONV_STATES.CONFIRMING_ORDER, response: null, action: 'CONFIRM_PROMPT' };
}

async function handleNewOrGreeting(intent, rawText, extraction, companyId) {
  const r = { response: null, newState: CONV_STATES.GREETING, extraction: { ...extraction }, action: null, shouldCreateOrder: false };

  switch (intent) {
    case INTENTS.GREETING: {
      const tryProduct = await matchProduct(rawText, companyId);
      if (tryProduct.product && tryProduct.confidence >= 60) {
        r.extraction.product = tryProduct.product.nom;
        r.extraction.productId = tryProduct.product.id;
        r.response = TEMPLATES.productInfo(tryProduct.product);
        r.newState = CONV_STATES.ASKING_PRODUCT;
      } else {
        r.response = TEMPLATES.welcome();
        r.newState = CONV_STATES.GREETING;
      }
      break;
    }
    case INTENTS.ORDER_START: {
      const tryProduct = await matchProduct(rawText, companyId);
      if (tryProduct.product && tryProduct.confidence >= 40) {
        r.extraction.product = tryProduct.product.nom;
        r.extraction.productId = tryProduct.product.id;
        const qty = extractQuantity(rawText);
        if (qty) r.extraction.qty = qty;
        const next = advanceToNextMissing(r.extraction);
        r.newState = next.state;
        r.response = next.response;
        r.action = next.action || null;
      } else {
        r.response = TEMPLATES.askProduct();
        r.newState = CONV_STATES.ASKING_PRODUCT;
      }
      break;
    }
    case INTENTS.PRICE_REQUEST: {
      const match = await matchProduct(rawText, companyId);
      if (match.product) {
        r.extraction.product = match.product.nom;
        r.extraction.productId = match.product.id;
        const pk = getProductKeyFromExtraction(r.extraction);
        r.response = pk ? TEMPLATES.pricingForProduct(pk) : TEMPLATES.productInfo(match.product);
      } else {
        r.response = TEMPLATES.pricingForProduct('creme_minceur') || TEMPLATES.askProduct();
      }
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    }
    case INTENTS.PRODUCT_QUESTION: {
      const match = await matchProduct(rawText, companyId);
      if (match.product) {
        r.extraction.product = match.product.nom;
        r.extraction.productId = match.product.id;
        r.response = TEMPLATES.productInfo(match.product);
      } else {
        const catalog = await getProductCatalog(companyId);
        r.response = TEMPLATES.catalogList(catalog);
      }
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    }
    case INTENTS.PRODUCT_EFFECT: {
      const resp = TEMPLATES.productFaqEffect('creme_minceur');
      r.response = resp ? resp + `\n\nSouhaitez-vous commander ?` : TEMPLATES.welcome();
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    }
    case INTENTS.PRODUCT_HOWTO: {
      const resp = TEMPLATES.productFaqHowto('creme_minceur');
      r.response = resp ? resp + `\n\nVous souhaitez en commander ?` : TEMPLATES.welcome();
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    }
    case INTENTS.PRODUCT_WORKS: {
      const resp = TEMPLATES.productFaqWorks('creme_minceur');
      r.response = resp ? resp + `\n\nVous souhaitez essayer ?` : TEMPLATES.welcome();
      r.newState = CONV_STATES.ASKING_PRODUCT;
      break;
    }
    case INTENTS.HESITATION: {
      r.response = TEMPLATES.productHesitation('creme_minceur') || TEMPLATES.welcome();
      r.newState = CONV_STATES.ASKING_PRODUCT;
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
      if (tryProduct.product && tryProduct.confidence >= 40) {
        r.extraction.product = tryProduct.product.nom;
        r.extraction.productId = tryProduct.product.id;
        r.response = TEMPLATES.productInfo(tryProduct.product);
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
  const pk = getProductKeyFromExtraction(r.extraction);

  if (intent === INTENTS.PRODUCT_EFFECT) {
    const key = pk || 'creme_minceur';
    r.response = (TEMPLATES.productFaqEffect(key) || '') + `\n\nSouhaitez-vous commander ?`;
    return r;
  }
  if (intent === INTENTS.PRODUCT_HOWTO) {
    const key = pk || 'creme_minceur';
    r.response = (TEMPLATES.productFaqHowto(key) || '') + `\n\nVous souhaitez en commander ?`;
    return r;
  }
  if (intent === INTENTS.PRODUCT_WORKS) {
    const key = pk || 'creme_minceur';
    r.response = (TEMPLATES.productFaqWorks(key) || '') + `\n\nVous souhaitez essayer ?`;
    return r;
  }
  if (intent === INTENTS.HESITATION) {
    r.response = TEMPLATES.productHesitation(pk || 'creme_minceur') || TEMPLATES.clarify();
    return r;
  }
  if (intent === INTENTS.PRICE_REQUEST) {
    r.response = TEMPLATES.pricingForProduct(pk || 'creme_minceur') || TEMPLATES.clarify();
    return r;
  }
  if (intent === INTENTS.DELIVERY_QUESTION) { r.response = TEMPLATES.deliveryInfo(); return r; }
  if (intent === INTENTS.PAYMENT_QUESTION) { r.response = TEMPLATES.paymentInfo(); return r; }

  if (intent === INTENTS.YES || intent === INTENTS.ORDER_START || intent === INTENTS.ORDER_CONFIRM) {
    if (r.extraction.product) {
      const next = advanceToNextMissing(r.extraction);
      r.newState = next.state;
      r.response = next.response;
      r.action = next.action || null;
      return r;
    }
  }

  // Si le produit est deja choisi et que le client envoie un chiffre, c'est une quantite
  const qtyFromText = extractQuantity(rawText);
  if (r.extraction.product && qtyFromText && qtyFromText >= 1) {
    r.extraction.qty = qtyFromText;
    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
    return r;
  }

  const match = await matchProduct(rawText, companyId);
  if (match.product && match.confidence >= 40) {
    r.extraction.product = match.product.nom;
    r.extraction.productId = match.product.id;

    const qty = extractQuantity(rawText);
    if (qty) r.extraction.qty = qty;

    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
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
    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
  } else {
    r.response = `Veuillez indiquer une quantité valide (ex: 1, 2 ou 3).`;
  }
  return r;
}

function handleAskingLocation(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_LOCATION, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const city = extractCity(rawText, CITY_PATTERNS);
  if (city) {
    r.extraction.city = city;
    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
  } else {
    r.response = `Veuillez indiquer votre ville de livraison.`;
  }
  return r;
}

function handleAskingPhone(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_PHONE, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const phone = extractPhoneNumber(rawText);
  if (phone) {
    r.extraction.phone = phone;
    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
  } else {
    r.response = `Veuillez me donner un numéro de téléphone valide (ex: 07 00 00 00 00).`;
  }
  return r;
}

function handleAskingName(intent, rawText, extraction) {
  const r = { response: null, newState: CONV_STATES.ASKING_NAME, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
  const name = extractName(rawText);
  if (name) {
    r.extraction.name = name;
    const next = advanceToNextMissing(r.extraction);
    r.newState = next.state;
    r.response = next.response;
    r.action = next.action || null;
  } else {
    r.response = `Veuillez me donner votre nom complet (prénom et nom).`;
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
  if (intent === INTENTS.ORDER_START || intent === INTENTS.YES) {
    const r = { response: null, newState: CONV_STATES.ASKING_PRODUCT, extraction: { ...extraction }, action: null, shouldCreateOrder: false };
    if (extraction.product) {
      const next = advanceToNextMissing(extraction);
      r.newState = next.state;
      r.response = next.response;
      r.action = next.action || null;
    } else {
      r.response = TEMPLATES.askProduct();
    }
    return r;
  }
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

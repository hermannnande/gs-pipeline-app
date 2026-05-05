/**
 * Integration Paystack - paiement Mobile Money + Carte pour les pages de vente.
 * ============================================================================
 *
 * Remplace l'ancienne integration Chariow. Avantages :
 *   - XOF natif (pas de conversion USD)
 *   - Pas de mapping produit a configurer (amount libre par requete)
 *   - Mobile Money DIRECT (Wave / Orange / MTN) sans redirection navigateur
 *   - Webhook signe HMAC SHA512 (pas un secret en query string)
 *   - Verify endpoint pour controle serveur
 *
 * Architecture :
 *
 *   FLUX A - MOBILE MONEY DIRECT (recommande)
 *   ------------------------------------------
 *   1) Frontend -> POST /api/paystack/charge
 *      Recoit { slug, qty, customerName, customerEmail, customerPhone,
 *               customerCity, provider, fbc, fbp, sourceUrl, metaPixelId,
 *               displayedAmount }
 *      Backend appelle https://api.paystack.co/charge avec :
 *        - email, amount (xof * 100), currency: 'XOF'
 *        - mobile_money: { phone, provider: 'wave' | 'orange' | 'mtn' }
 *        - reference: 'pst_<orderRef>' (pour identifier nos transactions)
 *        - metadata: { slug, qty, ... } pour le webhook
 *      Renvoie { reference, status: 'pay_offline', display_text } -> le
 *      frontend affiche "Validez sur votre telephone" + spinner et poll.
 *
 *   FLUX B - REDIRECT CARTE BANCAIRE
 *   ---------------------------------
 *   2) Frontend -> POST /api/paystack/init-transaction
 *      Backend appelle https://api.paystack.co/transaction/initialize avec :
 *        - email, amount, currency: 'XOF'
 *        - reference: 'pst_<orderRef>'
 *        - callback_url: /<slug>/merci?ref=<ref>
 *        - channels: ['card'] (force la carte uniquement, exclut MM)
 *      Renvoie { authorization_url } -> le frontend redirige le navigateur
 *      vers checkout.paystack.com
 *
 *   POLLING (pour Mobile Money en attente)
 *   ---------------------------------------
 *   3) GET /api/paystack/charge/:reference
 *      Le frontend poll cet endpoint toutes les 3-5 secondes pendant que le
 *      client valide sur son telephone. Backend appelle GET /charge/:ref
 *      Paystack et renvoie { status, message }.
 *
 *   WEBHOOK
 *   --------
 *   4) POST /api/paystack/webhook
 *      Recoit charge.success / charge.failed signe HMAC SHA512.
 *      Securite : verifie x-paystack-signature avec PAYSTACK_SECRET_KEY.
 *      Pour event=charge.success :
 *        - resout slug -> productId obgestion (via LandingTemplate ou code)
 *        - cree commande Order avec :
 *            status              = NOUVELLE
 *            modePaiement        = PAYSTACK_MOBILE_MONEY ou PAYSTACK_CARD
 *            referencePayment    = <reference>  (idempotence)
 *            montantPaye         = total (paye en avance)
 *            montantRestant      = 0
 *            sourcePage          = PAYSTACK
 *            quantite            = depuis metadata.qty
 *        - declenche notification websocket (notifyNewOrder)
 *        - declenche Meta CAPI Purchase server-side (deduplique avec pixel
 *          browser via event_id = 'purchase_<reference>')
 *
 *   VERIFY (securite supplementaire)
 *   ---------------------------------
 *   5) GET /api/paystack/verify/:reference
 *      Permet de verifier le statut d'une transaction depuis le serveur,
 *      independamment du webhook (utile sur la page de remerciement pour
 *      confirmer l'etat avant d'afficher "deja paye").
 *
 * Variables d'environnement requises :
 *   PAYSTACK_SECRET_KEY        sk_live_xxx (jamais en frontend !)
 *   PAYSTACK_PUBLIC_KEY        pk_live_xxx (utilisable en frontend si besoin)
 *   FRONTEND_PUBLIC_URL        https://www.obgestion.com (sans / final)
 *
 * IPs Paystack (pour whitelisting webhook) :
 *   52.31.139.75
 *   52.49.173.169
 *   52.214.14.220
 */
import express from 'express';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { notifyNewOrder } from '../utils/notifications.js';
import { sendPurchaseEvent } from '../utils/metaCapi.js';

const router = express.Router();
const PAYSTACK_API_BASE = 'https://api.paystack.co';

// Mapping slug -> pixel Meta. Utilise comme FALLBACK quand le webhook arrive
// sans metadata (ne devrait pas arriver avec Paystack puisqu'on controle
// l'init, mais on garde le filet de securite).
//
// Pour ajouter un nouveau slug payant Paystack : ajouter ici son pixel ID.
const PIXEL_BY_SLUG = {
  'serum-cerne-paye': '26809431761984777',
};

// Providers Mobile Money supportes par Paystack en Cote d'Ivoire.
// Source : https://paystack.com/docs/payments/payment-channels/#mobile-money
const ALLOWED_MM_PROVIDERS = new Set(['wave', 'orange', 'mtn']);

/**
 * Genere une reference Paystack unique pour une transaction.
 * Format : pst_<timestamp>_<8 hex chars>
 * Permet de :
 *   1) detecter cote frontend (ThankYouRouter) qu'une ref vient de Paystack
 *   2) tracer la transaction de bout en bout
 *
 * Important : Paystack n'accepte que [-_.=alphanumeric] dans les ref, donc
 * on evite les UUID v4 (qui contiennent des tirets, OK) ou les caracteres
 * speciaux. Le prefixe 'pst_' rend la detection triviale.
 */
function generatePaystackReference() {
  const ts = Date.now().toString(36);
  const rnd = crypto.randomBytes(4).toString('hex');
  return `pst_${ts}_${rnd}`;
}

/**
 * Convertit un montant XOF en subunit Paystack (multiplie par 100).
 * NB : XOF n'a pas de subunit reelle, mais Paystack exige le ×100.
 * Les fractions sont ignorees cote Paystack.
 */
function toPaystackAmount(xofAmount) {
  return Math.round(Number(xofAmount) * 100);
}

/**
 * Resout le companyId a partir du slug company envoye par le frontend.
 * Default : companyId = 1 (CI).
 */
async function resolveCompanyId(req) {
  const slug = String(
    req.body?.company || req.query.company || req.headers['x-company-slug'] || ''
  ).trim().toLowerCase();
  if (!slug) return 1;
  const company = await prisma.company.findUnique({ where: { slug } });
  return company ? company.id : 1;
}

/**
 * Envoie une requete a l'API Paystack avec gestion uniforme des erreurs.
 */
async function paystackFetch(path, init = {}) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY non configuree');
  }
  const url = `${PAYSTACK_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { status: false, message: 'Reponse non-JSON de Paystack' };
  }
  return { ok: res.ok, status: res.status, body };
}

/**
 * Cree (ou met a jour) une commande dans obgestion a partir d'une transaction
 * Paystack reussie. Idempotent via referencePayment = paystack reference.
 *
 * Appele depuis le webhook charge.success ET (en filet de securite) depuis
 * verify-transaction si le client recharge la page de remerciement avant que
 * le webhook arrive.
 *
 * @param {Object} args
 * @param {Object} args.transaction Donnees Paystack normalisees (champ data.* du verify ou payload webhook)
 * @param {Object} args.req         Requete Express (pour ip/user-agent CAPI)
 * @returns {Promise<{order, alreadyExisted: boolean}|null>}
 */
async function persistOrderFromPaystack({ transaction, req }) {
  const reference = String(transaction.reference || '');
  if (!reference) return null;

  // Idempotence : la meme reference n'est traitee qu'une fois.
  const existing = await prisma.order.findFirst({
    where: { referencePayment: reference },
    select: { id: true, orderReference: true, productId: true },
  });
  if (existing) {
    return { order: existing, alreadyExisted: true };
  }

  // Metadata peut etre une string (JSON serialise par Paystack pour les
  // transactions initialisees via /transaction/initialize) ou un objet
  // (charge API).
  let metadata = transaction.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  metadata = metadata || {};

  const slug = String(metadata.slug || '').trim();
  const qty = Math.max(parseInt(metadata.qty, 10) || 1, 1);
  const companySlug = String(metadata.company || 'ci').trim().toLowerCase();
  const channel = String(transaction.channel || 'mobile_money');
  const isMobileMoney = channel === 'mobile_money';
  const modePaiement = isMobileMoney ? 'PAYSTACK_MOBILE_MONEY' : 'PAYSTACK_CARD';

  const companyRecord = await prisma.company.findUnique({ where: { slug: companySlug } });
  const companyId = companyRecord ? companyRecord.id : 1;

  // Resoudre le produit obgestion :
  //   1) via LandingTemplate.slug -> productId
  //   2) sinon via product.code = SLUG.toUpperCase().replace(/-/g, '_')
  let obgestionProduct = null;
  if (slug) {
    try {
      const template = await prisma.landingTemplate.findFirst({
        where: { slug, companyId },
        select: { productId: true },
      });
      if (template?.productId) {
        obgestionProduct = await prisma.product.findFirst({
          where: { id: template.productId, companyId },
        });
      }
    } catch (lookupErr) {
      console.warn('[paystack] Lookup template echec:', lookupErr.message);
    }
    if (!obgestionProduct) {
      const productCode = slug.toUpperCase().replace(/-/g, '_');
      obgestionProduct = await prisma.product.findFirst({
        where: { code: productCode, companyId },
      });
    }
  }

  // Calcul du montant : on utilise le prix officiel (computeTotalAmount sur
  // le produit obgestion) pour stocker le vrai prix dans la DB. Le montant
  // reellement encaisse est dans transaction.amount / 100.
  let totalAmount = 0;
  if (obgestionProduct) {
    totalAmount = computeTotalAmount(obgestionProduct, qty);
  } else if (metadata.displayed_amount) {
    totalAmount = parseFloat(metadata.displayed_amount) || 0;
  } else {
    totalAmount = parseFloat(transaction.amount || 0) / 100;
  }

  const customer = transaction.customer || {};
  const customerName = String(metadata.customer_name || '').trim()
    || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    || 'Client Paystack';
  const customerPhone = String(metadata.phone || customer.phone || '').trim();
  const customerCity = String(metadata.city || 'Non precisee').trim() || 'Non precisee';

  const orderData = {
    orderReference: randomUUID(),
    companyId,
    clientNom: customerName.slice(0, 200),
    clientTelephone: customerPhone.slice(0, 50),
    clientVille: customerCity.slice(0, 200),
    produitNom: obgestionProduct?.nom || metadata.product_name || 'Produit Paystack',
    produitPage: 'PAYSTACK',
    productId: obgestionProduct?.id || null,
    quantite: qty,
    montant: totalAmount,
    sourceCampagne: obgestionProduct?.code || (slug ? slug.toUpperCase().replace(/-/g, '_') : 'PAYSTACK'),
    sourcePage: 'PAYSTACK',
    status: 'NOUVELLE',
    modePaiement,
    referencePayment: reference,
    montantPaye: totalAmount,
    montantRestant: 0,
  };

  const order = await prisma.order.create({ data: orderData, include: { product: true } });
  console.log(`[paystack] Commande creee : id=${order.id} ref=${order.orderReference} paystack=${reference} channel=${channel}`);

  // Notification websocket (non bloquante)
  try {
    await notifyNewOrder(order);
  } catch (notifError) {
    console.error('[paystack] Erreur notification (non bloquante):', notifError);
  }

  // Meta CAPI Purchase server-side (dedup browser via event_id = 'purchase_<ref>')
  try {
    const userAgent = req?.headers?.['user-agent'] || '';
    const clientIp = (req?.headers?.['x-forwarded-for'] || '').split(',')[0]?.trim() || req?.ip || '';
    const resolvedPixelId = metadata.meta_pixel_id || PIXEL_BY_SLUG[slug] || null;

    // L'eventID doit etre identique cote browser et CAPI : la page merci
    // utilise 'purchase_<reference>'. sendPurchaseEvent prend orderRef et
    // genere automatiquement 'purchase_<orderRef>'.
    await sendPurchaseEvent({
      orderId: order.id,
      orderRef: reference,
      amount: totalAmount,
      currency: 'XOF',
      productName: order.produitNom,
      productCode: order.sourceCampagne,
      quantity: qty,
      customerPhone,
      customerCity,
      clientIp,
      userAgent,
      fbc: metadata.fbc || null,
      fbp: metadata.fbp || null,
      sourceUrl: metadata.source_url || null,
      pixelId: resolvedPixelId,
    });
  } catch (metaErr) {
    console.error('[paystack] Erreur Meta CAPI (non bloquante):', metaErr);
  }

  return { order, alreadyExisted: false };
}

// ============================================================================
// POST /api/paystack/charge
// Mobile Money DIRECT (le client ne quitte JAMAIS la landing).
// ============================================================================
router.post('/charge', async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('[paystack] PAYSTACK_SECRET_KEY non configuree');
      return res.status(500).json({
        error: 'Paiement en ligne temporairement indisponible. Choisissez "A la livraison" ou contactez le support.',
      });
    }

    const {
      slug,
      qty,
      customerName,
      customerEmail,
      customerPhone,
      customerCity,
      provider,
      fbc,
      fbp,
      sourceUrl,
      metaPixelId,
      displayedAmount,
      productName,
    } = req.body;

    if (!slug || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        error: 'Champs requis : slug, customerName, customerEmail, customerPhone.',
      });
    }
    if (!provider || !ALLOWED_MM_PROVIDERS.has(String(provider).toLowerCase())) {
      return res.status(400).json({
        error: 'Operateur invalide. Choisissez Wave, Orange ou MTN.',
      });
    }

    const orderQty = Math.min(Math.max(parseInt(qty, 10) || 1, 1), 5);

    // Le montant reel a debiter (en XOF). Le frontend envoie le montant
    // affiche au client (avec -10% applique) dans displayedAmount. Si absent,
    // on refuse pour ne pas debiter un mauvais montant.
    const xofAmount = parseFloat(displayedAmount || 0);
    if (!Number.isFinite(xofAmount) || xofAmount < 100) {
      return res.status(400).json({
        error: 'Montant invalide. Reessayez ou contactez le support.',
      });
    }

    const reference = generatePaystackReference();
    const company = String(req.body.company || 'ci');

    // Metadata : tout ce qu'on doit retrouver dans le webhook pour creer la
    // commande dans obgestion. Paystack accepte l'objet directement (pas
    // besoin de stringify pour /charge).
    const metadata = {
      slug: String(slug).slice(0, 100),
      qty: String(orderQty),
      company: String(company).slice(0, 50),
      city: String(customerCity || '').slice(0, 100),
      phone: String(customerPhone).slice(0, 30),
      customer_name: String(customerName).slice(0, 200),
      product_name: String(productName || '').slice(0, 200),
      meta_pixel_id: String(metaPixelId || '').slice(0, 100),
      fbc: String(fbc || '').slice(0, 200),
      fbp: String(fbp || '').slice(0, 100),
      source_url: String(sourceUrl || '').slice(0, 200),
      displayed_amount: String(xofAmount),
      custom_fields: [
        { display_name: 'Slug', variable_name: 'slug', value: String(slug) },
        { display_name: 'Quantite', variable_name: 'qty', value: String(orderQty) },
        { display_name: 'Ville', variable_name: 'city', value: String(customerCity || '') },
      ],
    };

    const phoneSanitized = String(customerPhone).replace(/\D/g, '');
    const emailSanitized = String(customerEmail).trim().toLowerCase();

    const paystackPayload = {
      email: emailSanitized.slice(0, 255),
      amount: String(toPaystackAmount(xofAmount)),
      currency: 'XOF',
      reference,
      metadata,
      mobile_money: {
        phone: phoneSanitized.slice(0, 15),
        provider: String(provider).toLowerCase(),
      },
    };

    const { ok, status, body } = await paystackFetch('/charge', {
      method: 'POST',
      body: JSON.stringify(paystackPayload),
    });

    if (!ok) {
      console.error('[paystack] /charge erreur :', status, body);
      return res.status(400).json({
        error: body?.message || 'Erreur Paystack lors de l\'initialisation du paiement.',
        type: body?.type,
        code: body?.code,
      });
    }

    const data = body?.data || {};
    return res.json({
      success: true,
      reference: data.reference || reference,
      status: data.status, // 'pay_offline' | 'pending' | 'success' | 'send_otp' | ...
      display_text: data.display_text || 'Veuillez autoriser le paiement sur votre telephone.',
    });
  } catch (error) {
    console.error('[POST /paystack/charge] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'initialisation du paiement.' });
  }
});

// ============================================================================
// POST /api/paystack/init-transaction
// Cree une transaction et retourne l'authorization_url (FLUX REDIRECT pour cartes).
// ============================================================================
router.post('/init-transaction', async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        error: 'Paiement en ligne temporairement indisponible. Contactez le support.',
      });
    }

    const {
      slug,
      qty,
      customerName,
      customerEmail,
      customerPhone,
      customerCity,
      fbc,
      fbp,
      sourceUrl,
      metaPixelId,
      displayedAmount,
      productName,
      channels, // ['card'] par defaut, ou ['card', 'mobile_money'] pour laisser le client choisir
    } = req.body;

    if (!slug || !customerName || !customerEmail) {
      return res.status(400).json({
        error: 'Champs requis : slug, customerName, customerEmail.',
      });
    }

    const orderQty = Math.min(Math.max(parseInt(qty, 10) || 1, 1), 5);
    const xofAmount = parseFloat(displayedAmount || 0);
    if (!Number.isFinite(xofAmount) || xofAmount < 100) {
      return res.status(400).json({ error: 'Montant invalide.' });
    }

    const reference = generatePaystackReference();
    const company = String(req.body.company || 'ci');
    const baseUrl = (process.env.FRONTEND_PUBLIC_URL || 'https://www.obgestion.com').replace(/\/$/, '');
    const callbackUrl = `${baseUrl}/${slug}/merci?company=${encodeURIComponent(company)}&qty=${orderQty}&ref=${reference}`;

    const metadata = {
      slug: String(slug).slice(0, 100),
      qty: String(orderQty),
      company: String(company).slice(0, 50),
      city: String(customerCity || '').slice(0, 100),
      phone: String(customerPhone || '').slice(0, 30),
      customer_name: String(customerName).slice(0, 200),
      product_name: String(productName || '').slice(0, 200),
      meta_pixel_id: String(metaPixelId || '').slice(0, 100),
      fbc: String(fbc || '').slice(0, 200),
      fbp: String(fbp || '').slice(0, 100),
      source_url: String(sourceUrl || '').slice(0, 200),
      displayed_amount: String(xofAmount),
    };

    // metadata pour /transaction/initialize doit etre stringifie.
    const paystackPayload = {
      email: String(customerEmail).trim().toLowerCase().slice(0, 255),
      amount: String(toPaystackAmount(xofAmount)),
      currency: 'XOF',
      reference,
      callback_url: callbackUrl,
      metadata: JSON.stringify(metadata),
    };
    if (Array.isArray(channels) && channels.length > 0) {
      paystackPayload.channels = channels;
    } else {
      // Par defaut on autorise carte + mobile money (selon ton dashboard).
      paystackPayload.channels = ['card', 'mobile_money'];
    }

    const { ok, status, body } = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(paystackPayload),
    });

    if (!ok) {
      console.error('[paystack] /transaction/initialize erreur :', status, body);
      return res.status(400).json({
        error: body?.message || 'Erreur Paystack lors de l\'initialisation.',
      });
    }

    const data = body?.data || {};
    if (!data.authorization_url) {
      return res.status(502).json({ error: 'Reponse Paystack invalide (pas d\'authorization_url).' });
    }

    return res.json({
      success: true,
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference || reference,
    });
  } catch (error) {
    console.error('[POST /paystack/init-transaction] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ============================================================================
// GET /api/paystack/charge/:reference
// Polling pour les transactions Mobile Money en attente.
// Le frontend appelle cet endpoint toutes les 3-5s pendant que le client
// valide sur son telephone.
// ============================================================================
router.get('/charge/:reference', async (req, res) => {
  try {
    const reference = String(req.params.reference || '');
    if (!reference || !reference.startsWith('pst_')) {
      return res.status(400).json({ error: 'Reference invalide.' });
    }

    const { ok, status, body } = await paystackFetch(`/charge/${encodeURIComponent(reference)}`);
    if (!ok) {
      return res.status(status).json({
        error: body?.message || 'Erreur Paystack.',
        status: body?.data?.status || 'unknown',
      });
    }

    const data = body?.data || {};
    return res.json({
      reference: data.reference || reference,
      status: data.status,           // 'success' | 'pending' | 'failed' | 'timeout' | 'pay_offline' | ...
      message: data.message || data.gateway_response || null,
      display_text: data.display_text || null,
      channel: data.channel || null,
    });
  } catch (error) {
    console.error('[GET /paystack/charge/:reference] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ============================================================================
// GET /api/paystack/verify/:reference
// Verifie une transaction et cree la commande si pas deja faite (filet de
// securite si le webhook tarde / arrive jamais).
// ============================================================================
router.get('/verify/:reference', async (req, res) => {
  try {
    const reference = String(req.params.reference || '');
    if (!reference) {
      return res.status(400).json({ error: 'Reference manquante.' });
    }

    const { ok, status, body } = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (!ok) {
      return res.status(status).json({
        error: body?.message || 'Erreur Paystack verify.',
      });
    }

    const data = body?.data || {};
    const txStatus = data.status;

    // Si la transaction est success, on cree la commande (idempotent).
    let orderInfo = null;
    if (txStatus === 'success') {
      try {
        const result = await persistOrderFromPaystack({ transaction: data, req });
        if (result?.order) {
          orderInfo = {
            order_id: result.order.id,
            order_reference: result.order.orderReference || null,
            already_existed: result.alreadyExisted,
          };
        }
      } catch (persistErr) {
        console.error('[paystack/verify] Erreur persist:', persistErr?.stack || persistErr);
      }
    }

    return res.json({
      reference: data.reference,
      status: txStatus,
      amount: data.amount,
      currency: data.currency,
      channel: data.channel,
      paid_at: data.paid_at,
      gateway_response: data.gateway_response,
      order: orderInfo,
    });
  } catch (error) {
    console.error('[GET /paystack/verify/:reference] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ============================================================================
// POST /api/paystack/submit-otp
// Soumet un OTP demande par Paystack pour completer une transaction.
// ============================================================================
router.post('/submit-otp', async (req, res) => {
  try {
    const { reference, otp } = req.body || {};
    if (!reference || !otp) {
      return res.status(400).json({ error: 'reference et otp sont requis.' });
    }
    const { ok, status, body } = await paystackFetch('/charge/submit_otp', {
      method: 'POST',
      body: JSON.stringify({ reference: String(reference), otp: String(otp) }),
    });
    if (!ok) {
      return res.status(status).json({
        error: body?.message || 'OTP refuse.',
      });
    }
    const data = body?.data || {};
    return res.json({
      reference: data.reference || reference,
      status: data.status,
      message: data.message || data.gateway_response || null,
    });
  } catch (error) {
    console.error('[POST /paystack/submit-otp] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ============================================================================
// POST /api/paystack/webhook
// Recoit les events charge.success / charge.failed signes HMAC SHA512.
// ============================================================================
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('[paystack/webhook] PAYSTACK_SECRET_KEY non configuree');
      return res.status(500).json({ error: 'Webhook non configure' });
    }

    // Verification de la signature HMAC SHA512 (sur le body brut serialise).
    const rawBody = JSON.stringify(req.body);
    const computedHash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    const receivedHash = req.headers['x-paystack-signature'];

    if (!receivedHash || receivedHash !== computedHash) {
      console.warn('[paystack/webhook] Signature invalide / manquante');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ⚠️ Toujours repondre 200 RAPIDEMENT a Paystack pour eviter les retries
    // (les long jobs sont enchaines en async apres res.json).
    res.json({ received: true });

    const payload = req.body || {};
    const event = payload.event;
    const data = payload.data || {};

    console.log(`[paystack/webhook] event=${event} reference=${data.reference || '?'} status=${data.status || '?'}`);

    if (event !== 'charge.success' || data.status !== 'success') {
      // On ignore les autres events (charge.failed, refund.*, etc.) pour le
      // moment. A etendre si besoin (par exemple charge.failed pour annuler
      // un panier en attente).
      return;
    }

    try {
      await persistOrderFromPaystack({ transaction: data, req });
    } catch (persistErr) {
      console.error('[paystack/webhook] Erreur persist:', persistErr?.stack || persistErr);
    }
  } catch (error) {
    console.error('[POST /paystack/webhook] ERREUR:', error?.stack || error);
    // On a deja repondu 200 plus haut donc on ne renvoie rien ici.
  }
});

// ============================================================================
// GET /api/paystack/health
// Verifie que Paystack est correctement configure (pour debug deploiement).
// Ne renvoie JAMAIS la cle API.
// ============================================================================
router.get('/health', (req, res) => {
  res.json({
    secret_key_configured: !!process.env.PAYSTACK_SECRET_KEY,
    public_key_configured: !!process.env.PAYSTACK_PUBLIC_KEY,
    frontend_url: process.env.FRONTEND_PUBLIC_URL || 'https://www.obgestion.com (default)',
    api_base: PAYSTACK_API_BASE,
    supported_mobile_money_providers: Array.from(ALLOWED_MM_PROVIDERS),
    pixel_mappings: Object.keys(PIXEL_BY_SLUG),
  });
});

export default router;

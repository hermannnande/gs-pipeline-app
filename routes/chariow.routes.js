/**
 * Integration Chariow — paiement Mobile Money en ligne pour les pages de vente.
 * ============================================================================
 *
 * Architecture :
 *
 *   1) POST /api/chariow/checkout  (frontend -> backend)
 *      Recoit { slug, qty, customerName, customerEmail, customerPhone, customerCity,
 *               fbc, fbp, sourceUrl, metaPixelId, displayedAmount }
 *      Appelle https://api.chariow.com/v1/checkout avec :
 *        - product_id : resolu via env CHARIOW_PRODUCT_<SLUG>_<QTY>
 *        - email, first_name, last_name, phone (extraits du form)
 *        - redirect_url : /<slug>/merci?company=...&qty=...&ref={sale_id}
 *        - custom_metadata : slug, qty, company, city, phone, fbc, fbp,
 *          meta_pixel_id, source_url (utilise par le webhook pour creer
 *          la commande dans obgestion).
 *      Renvoie { checkout_url, sale_id } -> le frontend redirige le navigateur
 *      vers checkout_url.
 *
 *   2) POST /api/chariow/webhook  (Chariow -> backend, pulse `successful.sale`)
 *      Recoit le payload Chariow d'une vente reussie. Idempotent via le
 *      champ Order.referencePayment qui stocke le sale.id Chariow.
 *      Pour event=successful.sale :
 *        - resout le slug -> productId obgestion (via LandingTemplate ou code)
 *        - cree une commande Order avec :
 *            status              = NOUVELLE
 *            modePaiement        = CHARIOW_MOBILE_MONEY
 *            referencePayment    = sale.id  (idempotence)
 *            montantPaye         = total (paye en avance)
 *            montantRestant      = 0
 *            sourcePage          = CHARIOW
 *            quantite            = depuis custom_metadata.qty
 *        - declenche notification websocket (notifyNewOrder)
 *        - declenche Meta CAPI Purchase server-side (deduplique avec pixel
 *          browser via event_id = orderReference)
 *
 *   3) Securisation du webhook : Chariow ne signe pas explicitement ses webhooks
 *      (cf https://chariow.dev/en/guides/pulses), donc on protege l'endpoint avec
 *      un secret partage configure cote env (CHARIOW_WEBHOOK_SECRET) et passe
 *      soit en ?secret=xxx (URL configuree dans le dashboard Chariow), soit en
 *      header X-Webhook-Secret.
 *
 * Variables d'environnement requises :
 *   CHARIOW_API_KEY                    sk_live_xxx
 *   CHARIOW_WEBHOOK_SECRET             chaine aleatoire (>=32 chars)
 *   FRONTEND_PUBLIC_URL                https://www.obgestion.com (sans / final)
 *   CHARIOW_REQUIRE_SHIPPING           '1' si les produits Chariow ont
 *                                      "Require shipping address" active
 *   CHARIOW_PRODUCT_SERUM_CERNE_PAYE_1 prd_xxx (1 flacon, prix -10% deja applique)
 *   CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2 prd_yyy (2 flacons)
 *   CHARIOW_PRODUCT_SERUM_CERNE_PAYE_3 prd_zzz (3 flacons)
 */
import express from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { notifyNewOrder } from '../utils/notifications.js';
import { sendPurchaseEvent } from '../utils/metaCapi.js';

const router = express.Router();
const CHARIOW_API_BASE = 'https://api.chariow.com/v1';

/**
 * Resout l'ID produit Chariow a partir du slug et de la quantite.
 * Format env : CHARIOW_PRODUCT_<SLUG_UPPERCASE_UNDERSCORE>_<QTY>
 * Ex : slug="serum-cerne-paye", qty=2 -> CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2
 */
function getChariowProductId(slug, qty) {
  if (!slug) return null;
  const key = `CHARIOW_PRODUCT_${String(slug).toUpperCase().replace(/-/g, '_')}_${qty}`;
  return process.env[key] || null;
}

/**
 * Mapping INVERSE : a partir d'un product.id Chariow (ex: prd_021e9v),
 * retrouve le slug obgestion et la quantite via les env vars.
 *
 * Utilise quand le webhook arrive SANS custom_metadata (cas redirection
 * directe vers l'URL publique du produit Chariow, sans API checkout).
 */
function getSlugAndQtyFromChariowProductId(chariowProductId) {
  if (!chariowProductId) return null;
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('CHARIOW_PRODUCT_')) continue;
    if (value !== chariowProductId) continue;
    // key = CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2  ->  slug=serum-cerne-paye, qty=2
    const match = key.match(/^CHARIOW_PRODUCT_(.+)_(\d+)$/);
    if (match) {
      const slug = match[1].toLowerCase().replace(/_/g, '-');
      return { slug, qty: parseInt(match[2], 10) };
    }
  }
  return null;
}

async function resolveCompanyId(req) {
  const slug = String(
    req.body?.company || req.query.company || req.headers['x-company-slug'] || ''
  ).trim().toLowerCase();
  if (!slug) return 1;
  const company = await prisma.company.findUnique({ where: { slug } });
  return company ? company.id : 1;
}

// ============================================================================
// POST /api/chariow/checkout
// Initialise un checkout Chariow et renvoie l'URL de paiement.
// ============================================================================
router.post('/checkout', async (req, res) => {
  try {
    if (!process.env.CHARIOW_API_KEY) {
      console.error('[chariow] CHARIOW_API_KEY non configuree');
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
      fbc,
      fbp,
      sourceUrl,
      metaPixelId,
      displayedAmount,
    } = req.body;

    if (!slug || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        error: 'Champs requis : slug, customerName, customerEmail, customerPhone.',
      });
    }

    const orderQty = Math.min(Math.max(parseInt(qty, 10) || 1, 1), 3);

    const productId = getChariowProductId(slug, orderQty);
    if (!productId) {
      console.error(`[chariow] Pas de mapping produit pour slug=${slug} qty=${orderQty}`);
      return res.status(400).json({
        error: 'Configuration produit manquante pour cette quantite. Contactez le support.',
      });
    }

    // Decoupe nom complet en prenom / nom (Chariow exige les 2 separement)
    const trimmedName = String(customerName).trim();
    const nameParts = trimmedName.split(/\s+/);
    const firstName = (nameParts[0] || trimmedName || 'Client').slice(0, 50);
    const lastName = (nameParts.slice(1).join(' ') || nameParts[0] || 'Client').slice(0, 50);

    const company = String(req.body.company || 'ci');
    const baseUrl = (process.env.FRONTEND_PUBLIC_URL || 'https://www.obgestion.com').replace(/\/$/, '');
    // Important : Chariow remplace {sale_id} par le vrai sale ID au moment de la
    // redirection apres paiement. On peut donc tracker la commande sur la page merci.
    const redirectUrl = `${baseUrl}/${slug}/merci?company=${encodeURIComponent(company)}&qty=${orderQty}&ref={sale_id}`;

    // Custom metadata : tout ce qu'on doit retrouver dans le webhook pour creer
    // la commande dans obgestion (max 10 cles, 255 chars chacune).
    const customMetadata = {
      slug: String(slug).slice(0, 100),
      qty: String(orderQty),
      company: String(company).slice(0, 50),
      city: String(customerCity || '').slice(0, 100),
      phone: String(customerPhone).slice(0, 30),
      meta_pixel_id: String(metaPixelId || '').slice(0, 100),
      fbc: String(fbc || '').slice(0, 200),
      fbp: String(fbp || '').slice(0, 100),
      source_url: String(sourceUrl || '').slice(0, 200),
      displayed_amount: String(displayedAmount || ''),
    };

    const chariowPayload = {
      product_id: productId,
      email: String(customerEmail).trim().toLowerCase().slice(0, 255),
      first_name: firstName,
      last_name: lastName,
      phone: {
        number: String(customerPhone).replace(/\D/g, '').slice(0, 15),
        country_code: 'CI',
      },
      redirect_url: redirectUrl,
      custom_metadata: customMetadata,
    };

    // Si les produits Chariow ont "Require shipping address" active
    if (process.env.CHARIOW_REQUIRE_SHIPPING === '1') {
      chariowPayload.address = customerCity || 'Cote d\'Ivoire';
      chariowPayload.city = customerCity || 'Abidjan';
      chariowPayload.state = customerCity || 'Abidjan';
      chariowPayload.country = 'CI';
      chariowPayload.zip = '00225';
    }

    let chariowResponse;
    try {
      chariowResponse = await fetch(`${CHARIOW_API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CHARIOW_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chariowPayload),
      });
    } catch (fetchErr) {
      console.error('[chariow] Erreur reseau API Chariow:', fetchErr);
      return res.status(502).json({ error: 'Service Chariow injoignable. Reessayez dans un instant.' });
    }

    let chariowData;
    try {
      chariowData = await chariowResponse.json();
    } catch (jsonErr) {
      console.error('[chariow] Reponse Chariow non-JSON:', jsonErr);
      return res.status(502).json({ error: 'Reponse invalide de Chariow.' });
    }

    if (!chariowResponse.ok) {
      console.error('[chariow] Erreur API Chariow:', chariowResponse.status, chariowData);
      return res.status(400).json({
        error: chariowData?.message || 'Erreur Chariow lors de l\'initialisation du paiement.',
        errors: chariowData?.errors,
      });
    }

    const step = chariowData?.data?.step;
    const checkoutUrl = chariowData?.data?.payment?.checkout_url;
    const saleId = chariowData?.data?.purchase?.id;

    if (step === 'already_purchased') {
      return res.status(409).json({
        error: 'Ce client a deja achete ce produit. Choisissez une autre quantite ou un autre email.',
      });
    }

    if (step !== 'payment' || !checkoutUrl) {
      console.error('[chariow] Reponse Chariow inattendue:', chariowData);
      return res.status(400).json({
        error: 'Impossible de generer le lien de paiement. Reessayez.',
      });
    }

    return res.json({ success: true, checkout_url: checkoutUrl, sale_id: saleId });
  } catch (error) {
    console.error('[POST /chariow/checkout] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'initialisation du paiement.' });
  }
});

// ============================================================================
// POST /api/chariow/webhook
// Recoit les pulses Chariow. Pour `successful.sale`, cree la commande dans obgestion.
// ============================================================================
router.post('/webhook', async (req, res) => {
  try {
    // Verification du secret partage (Chariow ne signe pas, on protege via secret URL)
    const expectedSecret = process.env.CHARIOW_WEBHOOK_SECRET;
    const receivedSecret = req.query.secret || req.headers['x-webhook-secret'];
    if (expectedSecret && receivedSecret !== expectedSecret) {
      console.warn('[chariow] Webhook secret invalide / manquant');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body || {};
    const event = payload.event;
    const sale = payload.sale || {};
    const customer = payload.customer || {};
    const product = payload.product || {};
    const meta = sale.custom_metadata || {};

    console.log(`[chariow] Webhook recu: event=${event} sale=${sale.id || '?'} email=${customer.email || '?'}`);

    // On ne traite que les ventes reussies (les autres servent juste pour le monitoring)
    if (event !== 'successful.sale') {
      return res.json({ received: true, processed: false, reason: `event=${event}` });
    }

    if (!sale.id) {
      return res.json({ received: true, processed: false, reason: 'missing_sale_id' });
    }

    // Idempotence : Chariow peut renvoyer le meme webhook plusieurs fois (retries).
    // On utilise referencePayment = sale.id comme cle d'unicite.
    const existing = await prisma.order.findFirst({
      where: { referencePayment: String(sale.id) },
      select: { id: true, orderReference: true },
    });
    if (existing) {
      console.log(`[chariow] Commande deja creee pour sale=${sale.id} (orderId=${existing.id}), webhook ignore`);
      return res.json({
        received: true,
        processed: false,
        reason: 'already_processed',
        orderId: existing.id,
      });
    }

    let slug = String(meta.slug || '').trim();
    let qty = Math.max(parseInt(meta.qty, 10) || 1, 1);
    const companySlug = String(meta.company || 'ci').trim().toLowerCase();

    // Si pas de custom_metadata (cas redirection directe vers l'URL publique
    // Chariow sans passer par notre API), on infere slug+qty via product.id.
    if (!slug && product?.id) {
      const inferred = getSlugAndQtyFromChariowProductId(product.id);
      if (inferred) {
        slug = inferred.slug;
        qty = inferred.qty;
        console.log(`[chariow] Slug/qty inferes via product.id=${product.id} : slug=${slug}, qty=${qty}`);
      } else {
        console.warn(`[chariow] Impossible d'inferer slug/qty pour product.id=${product.id}. Verifiez les env CHARIOW_PRODUCT_*`);
      }
    }

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
        console.warn('[chariow] Lookup template echec:', lookupErr.message);
      }

      if (!obgestionProduct) {
        const productCode = slug.toUpperCase().replace(/-/g, '_');
        obgestionProduct = await prisma.product.findFirst({
          where: { code: productCode, companyId },
        });
      }
    }

    // Calcul du montant : on utilise computeTotalAmount sur le produit obgestion
    // (= prix officiel non remise) pour avoir le vrai prix dans la DB.
    // Le montant reellement encaisse via Chariow est dans sale.amount.value (USD/EUR
    // selon devise) et displayed_amount (XOF -10%) - on le stocke dans modePaiement.
    let totalAmount = 0;
    if (obgestionProduct) {
      totalAmount = computeTotalAmount(obgestionProduct, qty);
    } else if (meta.displayed_amount) {
      totalAmount = parseFloat(meta.displayed_amount) || 0;
    } else {
      // Dernier fallback : on essaie de convertir depuis sale.amount
      totalAmount = parseFloat(sale.amount?.value || 0);
    }

    const customerName =
      `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
      customer.name ||
      'Client Chariow';
    const customerPhone = String(meta.phone || customer.phone || '').trim();
    const customerCity = String(meta.city || 'Non precisee').trim() || 'Non precisee';

    const orderData = {
      orderReference: randomUUID(),
      companyId,
      clientNom: customerName.slice(0, 200),
      clientTelephone: customerPhone.slice(0, 50),
      clientVille: customerCity.slice(0, 200),
      produitNom: obgestionProduct?.nom || product?.name || 'Produit Chariow',
      produitPage: 'CHARIOW',
      productId: obgestionProduct?.id || null,
      quantite: qty,
      montant: totalAmount,
      sourceCampagne: obgestionProduct?.code || slug.toUpperCase().replace(/-/g, '_') || 'CHARIOW',
      sourcePage: 'CHARIOW',
      status: 'NOUVELLE',
      modePaiement: 'CHARIOW_MOBILE_MONEY',
      referencePayment: String(sale.id),
      montantPaye: totalAmount,
      montantRestant: 0,
    };

    let order;
    try {
      order = await prisma.order.create({ data: orderData, include: { product: true } });
      console.log(`[chariow] Commande creee : id=${order.id} ref=${order.orderReference} sale=${sale.id}`);
    } catch (e) {
      console.error('[chariow] Erreur creation commande:', e?.stack || e);
      return res.status(500).json({ error: 'Erreur creation commande', detail: e.message });
    }

    // Notification websocket (non bloquante)
    try {
      await notifyNewOrder(order);
    } catch (notifError) {
      console.error('[chariow] Erreur notification (non bloquante):', notifError);
    }

    // Meta CAPI Purchase server-side (deduplique avec pixel browser via event_id = orderRef)
    try {
      const userAgent = req.headers['user-agent'] || '';
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      await sendPurchaseEvent({
        orderId: order.id,
        orderRef: order.orderReference,
        amount: totalAmount,
        currency: 'XOF',
        productName: order.produitNom,
        productCode: order.sourceCampagne,
        quantity: qty,
        customerPhone,
        customerCity,
        clientIp,
        userAgent,
        fbc: meta.fbc || null,
        fbp: meta.fbp || null,
        sourceUrl: meta.source_url || null,
        pixelId: meta.meta_pixel_id || null,
      });
    } catch (metaErr) {
      console.error('[chariow] Erreur Meta CAPI (non bloquante):', metaErr);
    }

    return res.json({
      received: true,
      processed: true,
      orderId: order.id,
      orderRef: order.orderReference,
    });
  } catch (error) {
    console.error('[POST /chariow/webhook] ERREUR:', error?.stack || error);
    return res.status(500).json({ error: 'Erreur serveur webhook' });
  }
});

// ============================================================================
// GET /api/chariow/health
// Vérifie que Chariow est correctement configure (utile pour debug deploiement).
// Ne renvoie JAMAIS la cle API.
// ============================================================================
router.get('/health', (req, res) => {
  res.json({
    api_key_configured: !!process.env.CHARIOW_API_KEY,
    webhook_secret_configured: !!process.env.CHARIOW_WEBHOOK_SECRET,
    require_shipping: process.env.CHARIOW_REQUIRE_SHIPPING === '1',
    frontend_url: process.env.FRONTEND_PUBLIC_URL || 'https://www.obgestion.com (default)',
    products_mapped: Object.keys(process.env)
      .filter((k) => k.startsWith('CHARIOW_PRODUCT_'))
      .map((k) => ({ env: k, value: '***' + (process.env[k] || '').slice(-6) })),
  });
});

export default router;

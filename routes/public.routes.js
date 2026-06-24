import express from 'express';
import { prisma } from '../utils/prisma.js';
import { computePublicOrderTotal } from '../utils/pricing.js';
import { notifyNewOrder } from '../utils/notifications.js';
import { sendPurchaseEvent } from '../utils/metaCapi.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/** Résout companyId à partir de req.query.company ou req.headers['x-company-slug'] */
async function resolveCompanyId(req) {
  const slug = String(
    req.body?.company || req.query.company || req.headers['x-company-slug'] || ''
  ).trim().toLowerCase();
  if (!slug) return 1;
  const company = await prisma.company.findUnique({ where: { slug } });
  return company ? company.id : 1;
}

async function repairOrdersIdSequenceIfNeeded(error) {
  if (error?.code !== 'P2002') return false;
  const target = error?.meta?.target;
  const isIdTarget =
    Array.isArray(target) ? target.includes('id') : String(target || '').includes('id');
  if (!isIdTarget) return false;
  try {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('orders', 'id'),
        COALESCE((SELECT MAX(id) FROM orders), 0)
      );
    `);
    return true;
  } catch {
    return false;
  }
}

// GET /api/public/products - Liste des produits actifs (public, sans auth)
router.get('/products', async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const products = await prisma.product.findMany({
      where: { actif: true, companyId },
      select: {
        id: true,
        code: true,
        nom: true,
        description: true,
        prixUnitaire: true,
        prix2Unites: true,
        prix3Unites: true,
        imageUrl: true,
      },
      orderBy: { nom: 'asc' },
    });
    res.json({ products });
  } catch (error) {
    console.error('Erreur récupération produits publics:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/public/order - Passer une commande (public, sans auth)
router.post('/order', async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { productId, customerName, customerPhone, customerCity, customerCommune, customerAddress, quantity } = req.body;

    if (!productId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : productId, customerName, customerPhone',
      });
    }

    const product = await prisma.product.findFirst({
      where: { id: parseInt(productId), companyId },
    });

    if (!product || !product.actif) {
      return res.status(400).json({ success: false, error: 'Produit introuvable ou inactif.' });
    }

    const orderQuantity = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    const totalAmount = computePublicOrderTotal(product, orderQuantity);

    const resolvedCity = String(customerCity || '').trim() || 'Non precisee';

    const createData = {
      orderReference: randomUUID(),
      companyId,
      clientNom: customerName.trim(),
      clientTelephone: customerPhone.trim(),
      clientVille: resolvedCity,
      clientCommune: customerCommune?.trim() || null,
      clientAdresse: customerAddress?.trim() || null,
      produitNom: product.nom,
      produitPage: 'FORMULAIRE_WEB',
      productId: product.id,
      quantite: orderQuantity,
      montant: totalAmount,
      sourceCampagne: product.code,
      sourcePage: 'FORMULAIRE_WEB',
      status: 'NOUVELLE',
    };

    let order;
    try {
      order = await prisma.order.create({
        data: createData,
        include: { product: true },
      });
    } catch (e) {
      const repaired = await repairOrdersIdSequenceIfNeeded(e);
      if (!repaired) throw e;
      order = await prisma.order.create({
        data: createData,
        include: { product: true },
      });
    }

    try {
      await notifyNewOrder(order);
    } catch (notifError) {
      console.error('Erreur notification (non bloquante):', notifError);
    }

    try {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      const userAgent = req.headers['user-agent'] || '';
      const fbc = req.body.fbc || null;
      const fbp = req.body.fbp || null;
      const sourceUrl = req.body.sourceUrl || null;
      const capiPixels = [...new Set(
        [req.body.metaPixelId, req.body.secondaryMetaPixelId].filter(Boolean).map(String),
      )];
      const capiBase = {
        orderId: order.id,
        orderRef: order.orderReference,
        amount: totalAmount,
        currency: 'XOF',
        productName: product.nom,
        productCode: product.code,
        quantity: orderQuantity,
        customerPhone: customerPhone.trim(),
        customerCity: resolvedCity,
        clientIp,
        userAgent,
        fbc,
        fbp,
        sourceUrl,
      };
      for (const pixelId of capiPixels) {
        await sendPurchaseEvent({ ...capiBase, pixelId });
      }
    } catch (metaErr) {
      console.error('Erreur Meta CAPI (non bloquante):', metaErr);
    }

    res.status(201).json({
      success: true,
      message: 'Commande passée avec succès !',
      orderReference: order.orderReference,
    });
  } catch (error) {
    console.error('[POST /public/order] ERREUR:', error?.stack || error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la commande.',
    });
  }
});

// Auto-init de la table page_views (le build Vercel n'a pas accès à Supabase pour migrate deploy)
let pageViewTableReady = false;
async function ensurePageViewTable() {
  if (pageViewTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "page_views" (
        "id" SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL DEFAULT 1,
        "slug" TEXT NOT NULL,
        "path" TEXT NOT NULL,
        "templateId" INTEGER,
        "visitorId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "isUnique" BOOLEAN NOT NULL DEFAULT true,
        "isNewSession" BOOLEAN NOT NULL DEFAULT true,
        "referrer" TEXT,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "fbclid" TEXT,
        "gclid" TEXT,
        "userAgent" TEXT,
        "ip" TEXT,
        "country" TEXT,
        "city" TEXT,
        "device" TEXT,
        "browser" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "page_views_companyId_createdAt_idx" ON "page_views"("companyId", "createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "page_views_slug_createdAt_idx" ON "page_views"("slug", "createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "page_views_visitorId_idx" ON "page_views"("visitorId")`);
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "page_views"
        ADD CONSTRAINT "page_views_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch {} // FK déjà créée
    pageViewTableReady = true;
  } catch (e) {
    console.error('Erreur création table page_views:', e.message);
  }
}

function detectDevice(ua = '') {
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return 'tablet';
  if (/mobile|iphone|android/.test(u)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua = '') {
  const u = ua.toLowerCase();
  if (/edg\//.test(u)) return 'Edge';
  if (/chrome\//.test(u) && !/edg\//.test(u)) return 'Chrome';
  if (/firefox\//.test(u)) return 'Firefox';
  if (/safari\//.test(u) && !/chrome\//.test(u)) return 'Safari';
  if (/opr\/|opera/.test(u)) return 'Opera';
  return 'Autre';
}

// POST /api/public/pageview - Enregistre une visite sur une landing page
router.post('/pageview', async (req, res) => {
  try {
    await ensurePageViewTable();
    const companyId = await resolveCompanyId(req);
    const {
      slug, path, visitorId, sessionId, isUnique, isNewSession,
      referrer, utmSource, utmMedium, utmCampaign, fbclid, gclid,
    } = req.body;

    if (!slug || !visitorId || !sessionId) {
      return res.status(400).json({ success: false, error: 'Champs requis manquants.' });
    }

    let templateId = null;
    try {
      const tpl = await prisma.landingTemplate.findFirst({
        where: { slug: String(slug), companyId },
        select: { id: true },
      });
      if (tpl) templateId = tpl.id;
    } catch {}

    const ua = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    await prisma.pageView.create({
      data: {
        companyId,
        slug: String(slug).slice(0, 200),
        path: String(path || '').slice(0, 500),
        templateId,
        visitorId: String(visitorId).slice(0, 100),
        sessionId: String(sessionId).slice(0, 100),
        isUnique: Boolean(isUnique),
        isNewSession: Boolean(isNewSession),
        referrer: referrer ? String(referrer).slice(0, 1000) : null,
        utmSource: utmSource ? String(utmSource).slice(0, 100) : null,
        utmMedium: utmMedium ? String(utmMedium).slice(0, 100) : null,
        utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 200) : null,
        fbclid: fbclid ? String(fbclid).slice(0, 200) : null,
        gclid: gclid ? String(gclid).slice(0, 200) : null,
        userAgent: ua.slice(0, 500),
        ip: ip || null,
        device: detectDevice(ua),
        browser: detectBrowser(ua),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur pageview (non bloquante):', error);
    res.json({ success: false });
  }
});

// GET /api/public/realtime/:slug - Compte les visiteurs actifs sur une page
// dans les 5 dernieres minutes (fenetre glissante). Public, pas d'auth.
// Reponse : { activeVisitors: number, activeSessions: number, totalLastHour: number }
//
// "Actif" = au moins 1 pageview dans les 5 dernieres minutes.
// On compte les visitorId distincts (un meme visiteur sur plusieurs pages = 1 actif).
router.get('/realtime/:slug', async (req, res) => {
  try {
    await ensurePageViewTable();
    const slug = String(req.params.slug || '').slice(0, 200);
    if (!slug) {
      return res.status(400).json({ activeVisitors: 0, activeSessions: 0, totalLastHour: 0 });
    }

    const companyId = await resolveCompanyId(req);
    const now = Date.now();
    const fiveMinAgo = new Date(now - 5 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // Visiteurs distincts actifs (5 min)
    const activeRows = await prisma.pageView.findMany({
      where: { slug, companyId, createdAt: { gte: fiveMinAgo } },
      select: { visitorId: true, sessionId: true },
    });
    const activeVisitors = new Set(activeRows.map((r) => r.visitorId)).size;
    const activeSessions = new Set(activeRows.map((r) => r.sessionId)).size;

    // Total derniere heure
    const totalLastHour = await prisma.pageView.count({
      where: { slug, companyId, createdAt: { gte: oneHourAgo } },
    });

    // Cache-Control court pour limiter le DDoS sans laisser le compteur figer trop
    res.set('Cache-Control', 'public, max-age=8');
    res.json({ activeVisitors, activeSessions, totalLastHour });
  } catch (error) {
    console.error('Erreur realtime/:slug (non bloquante):', error.message);
    // Reponse permissive : 0 plutot qu'erreur, pour ne pas casser le front
    res.json({ activeVisitors: 0, activeSessions: 0, totalLastHour: 0 });
  }
});

// POST /api/public/track-purchase - Renvoie un Purchase CAPI server-side a chaque atterrissage
// sur la page de remerciement. Utilise event_id base sur orderRef pour dedoublonnage avec le pixel browser.
router.post('/track-purchase', async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { ref, slug, sourceUrl, fbc, fbp, pixelId: bodyPixelId, pixelIds: bodyPixelIds } = req.body;

    if (!ref) {
      return res.json({ success: false, reason: 'missing_ref' });
    }

    const order = await prisma.order.findFirst({
      where: { orderReference: String(ref), companyId },
      include: { product: true },
    });

    if (!order) {
      return res.json({ success: false, reason: 'order_not_found' });
    }

    const capiPixels = [...new Set(
      [
        ...(Array.isArray(bodyPixelIds) ? bodyPixelIds : []),
        bodyPixelId,
      ].filter(Boolean).map(String),
    )];

    if (!capiPixels.length && slug) {
      try {
        const tpl = await prisma.landingTemplate.findFirst({
          where: { slug: String(slug), companyId },
          select: { config: true },
        });
        if (tpl) {
          const cfg = JSON.parse(tpl.config);
          if (cfg.metaPixelId) capiPixels.push(String(cfg.metaPixelId));
          if (cfg.secondaryMetaPixelId) capiPixels.push(String(cfg.secondaryMetaPixelId));
        }
      } catch {}
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const capiBase = {
      orderId: order.id,
      orderRef: order.orderReference,
      amount: order.montant,
      currency: 'XOF',
      productName: order.product?.nom || order.produitNom,
      productCode: order.product?.code || order.sourceCampagne,
      quantity: order.quantite || 1,
      customerPhone: order.clientTelephone,
      customerCity: order.clientVille,
      clientIp,
      userAgent,
      fbc: fbc || null,
      fbp: fbp || null,
      sourceUrl: sourceUrl || null,
    };

    const results = [];
    for (const pixelId of capiPixels) {
      results.push(await sendPurchaseEvent({ ...capiBase, pixelId }));
    }

    res.json({ success: true, sent: results.some(Boolean), pixelIds: capiPixels });
  } catch (error) {
    console.error('Erreur track-purchase (non bloquante):', error);
    res.json({ success: false, error: error.message });
  }
});

export default router;

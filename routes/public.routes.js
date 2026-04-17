import express from 'express';
import { prisma } from '../utils/prisma.js';
import { computeTotalAmount } from '../utils/pricing.js';
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
    const totalAmount = computeTotalAmount(product, orderQuantity);

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
      const metaPixelId = req.body.metaPixelId || null;

      await sendPurchaseEvent({
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
        pixelId: metaPixelId,
      });
    } catch (metaErr) {
      console.error('Erreur Meta CAPI (non bloquante):', metaErr);
    }

    res.status(201).json({
      success: true,
      message: 'Commande passée avec succès !',
      orderReference: order.orderReference,
    });
  } catch (error) {
    console.error('Erreur création commande publique:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la commande.' });
  }
});

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

export default router;

import express from 'express';
import { prisma } from '../utils/prisma.js';
import { body, validationResult } from 'express-validator';
import { notifyNewOrder } from '../utils/notifications.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { randomUUID } from 'crypto';

const router = express.Router();

async function repairOrdersIdSequenceIfNeeded(error) {
  // Cas classique après import SQL : la séquence orders.id n'est plus alignée avec MAX(id)
  // => nextval() retourne un id déjà existant => P2002 sur (id)
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
    console.log('🔧 Séquence orders.id réparée (setval sur MAX(id)).');
    return true;
  } catch (e) {
    console.error('❌ Échec réparation séquence orders.id:', e);
    return false;
  }
}

// Middleware pour vérifier l'API Key (sécurité webhook Make)
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.MAKE_WEBHOOK_API_KEY || process.env.WEBHOOK_API_KEY;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API Key manquante. Veuillez fournir X-API-KEY dans les headers.' 
    });
  }
  
  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      error: 'Webhook non configuré (MAKE_WEBHOOK_API_KEY manquante côté serveur).'
    });
  }

  if (apiKey !== expectedApiKey) {
    // Ne jamais loguer la clé complète
    const masked = String(apiKey).length > 6 ? `${String(apiKey).slice(0, 3)}***${String(apiKey).slice(-2)}` : '***';
    console.error('❌ Tentative d\'accès avec API Key invalide (masquée):', masked);
    return res.status(401).json({ 
      success: false,
      error: 'API Key invalide.' 
    });
  }
  
  next();
};

// POST /api/webhook/make - Réception des commandes depuis Make
router.post('/make', verifyApiKey, [
  body('product_key').notEmpty().withMessage('product_key requis'),
  body('customer_name').notEmpty().withMessage('customer_name requis'),
  body('customer_phone').notEmpty().withMessage('customer_phone requis'),
  body('customer_city').notEmpty().withMessage('customer_city requis'),
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides',
        details: errors.array() 
      });
    }

    const {
      product_key,
      customer_name,
      customer_phone,
      customer_city,
      customer_commune,
      customer_address,
      quantity,
      source,
      make_scenario_name,
      campaign_source,
      campaign_name,
      page_url,
      raw_payload,
      companySlug
    } = req.body;

    // Déterminer companyId : companySlug/company dans body ou query, sinon default 1 (CI)
    const slug = String(companySlug || req.body.company || req.query.company || '').trim().toLowerCase();
    let companyId = 1;
    if (slug) {
      const company = await prisma.company.findUnique({
        where: { slug }
      });
      if (company) {
        companyId = company.id;
      } else {
        console.warn(`⚠️ Société non trouvée pour slug "${slug}", utilisation companyId=1`);
      }
    }

    console.log('📥 Commande reçue depuis Make:', {
      product_key,
      customer_name,
      customer_phone,
      customer_city,
      quantity: quantity || 1,
      source
    });

    // Mapping de secours : noms courants des formulaires → codes produit
    const FALLBACK_MAPPING = {
      'chaussette de compression': 'CHAUSSETTE_CHAUFFANTE',
      'chaussettes chauffantes tourmaline': 'CHAUSSETTE_CHAUFFANTE',
      'patch minceur glp': 'PATCH_MINCEUR',
      'patch minceur': 'PATCH_MINCEUR',
      'creme minceur': 'SPRAY_MINCEUR',
      'patch anti douleur': 'SPRAY_DOULEUR',
      'gaine tourmaline': 'GAINE_MINCEUR_TOURMALINE',
      'gaine tourmaline chauffante': 'GAINE_MINCEUR_TOURMALINE_CHAUFFANTE',
      'patch anti cicatrice': 'PATCH_ANTI_CICATRICE',
      'creme anti cerne': 'CREME_ANTI_CERNE',
      'creme anti lipome': 'CREME_ANTI_LIPOME',
      'crème anti-verrues': 'CREME_ANTI_VERRUES',
      'creme verrue tk': 'VERRUE_TK',
      'creme probleme de peau': 'CREME_PROBLEME_DE_PEAU',
      'pack détox minceur': 'PATCH_DETOX_MINCEUR',
      'logo educatif': 'LOGO_EDUCATIF',
      'pourdre pousse cheveux': 'POUDRE_CHEVEUX',
      'creme anti tache': 'CREME_TACHE',
      'crème vitiligo': 'CREME_VITILIGO',
      'spray anti douleur': 'SPRAY_DOULEUR',
      'crème jjl': 'CREME_JLL',
      'semelle massante': 'SEMELLE_MASSANTE',
      'ultra blanchiment dentaire v34': 'ULTRA_BLANCHIMENT_DENTAIRE_V34',
      'crème lèvre rose': 'LEVRE_ROSE',
      'crème anti-hémorroïdes': 'CREME_ANTI_HEMORROIDE',
      'spray minceur': 'SPRAY_MINCEUR',
      'crème anti-cernes2': 'CREME_ANTI_CERNES2',
      'serum ongle': 'SERUM_ONGLE',
      'creme cerne tk': 'CREME_CERNE_TK',
      'creme anti tache2': 'CREME_TACHE2',
      'creme tache tk': 'CREME_TACHE_TK',
      'patch minceur tk': 'PATCH_MINCEUR_TK',
      'lunette de vision noctune': 'LUNETTE_VISION_NOCTUNE',
      'pads rehausseurs poitrine': 'PADS_REHAUSSEURS_POITRINE',
    };

    // Résoudre le product_key : si c'est un nom de formulaire, le convertir en code
    const resolvedKey = FALLBACK_MAPPING[product_key.toLowerCase()] || product_key;

    // 1. Chercher le produit — stratégie multi-fallback
    let product = null;
    let matchMethod = '';

    // 1a. Chercher par le code résolu (après FALLBACK_MAPPING)
    product = await prisma.product.findFirst({
      where: { code: resolvedKey, companyId }
    });
    if (product) matchMethod = resolvedKey !== product_key ? 'fallback_mapping' : 'code_exact';

    // 1b. Chercher par code original (si différent du résolu)
    if (!product && resolvedKey !== product_key) {
      product = await prisma.product.findFirst({
        where: { code: product_key, companyId }
      });
      if (product) matchMethod = 'code_exact';
    }

    // 1c. Chercher par code insensible à la casse
    if (!product) {
      product = await prisma.product.findFirst({
        where: { code: { equals: resolvedKey, mode: 'insensitive' }, companyId }
      });
      if (product) matchMethod = 'code_insensitive';
    }

    // 1d. Chercher par nom exact (le formulaire envoie parfois le nom du produit)
    if (!product) {
      product = await prisma.product.findFirst({
        where: { nom: { equals: product_key, mode: 'insensitive' }, companyId, actif: true }
      });
      if (product) matchMethod = 'nom_exact';
    }

    // 1e. Chercher par nom contenant le product_key (recherche partielle)
    if (!product) {
      product = await prisma.product.findFirst({
        where: { nom: { contains: product_key, mode: 'insensitive' }, companyId, actif: true }
      });
      if (product) matchMethod = 'nom_contains';
    }

    // 1f. Recherche floue : normaliser et comparer
    if (!product) {
      const allProducts = await prisma.product.findMany({
        where: { companyId, actif: true }
      });
      const keyLower = product_key.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç0-9]/g, '');
      product = allProducts.find(p => {
        const nomLower = p.nom.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç0-9]/g, '');
        return nomLower.includes(keyLower) || keyLower.includes(nomLower);
      }) || null;
      if (product) matchMethod = 'fuzzy';
    }

    if (product) {
      if (matchMethod !== 'code_exact') {
        console.log(`🔍 Produit trouvé par ${matchMethod}: "${product_key}" → ${product.nom} (${product.code})`);
      }
    } else {
      console.warn(`⚠️ Produit non trouvé pour "${product_key}", commande créée sans productId`);
    }

    // 2. Calculer les montants
    const orderQuantity = parseInt(quantity) || 1;
    const totalAmount = product
      ? computeTotalAmount(product, orderQuantity)
      : (parseFloat(String(raw_payload?.total || '').replace(/[^0-9.]/g, '')) || 9900) * orderQuantity;

    // 3. Créer la commande dans la base de données
    const createData = {
      orderReference: randomUUID(),
      companyId,
      clientNom: customer_name,
      clientTelephone: customer_phone,
      clientVille: customer_city,
      clientCommune: customer_commune || null,
      clientAdresse: customer_address || null,
      produitNom: product ? product.nom : product_key,
      produitPage: page_url || source || null,
      productId: product ? product.id : null,
      quantite: orderQuantity,
      montant: totalAmount,
      sourceCampagne: campaign_source || campaign_name || make_scenario_name || 'Make',
      sourcePage: source || page_url || make_scenario_name || null,
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
      // Retenter une fois après réparation séquence
      order = await prisma.order.create({
        data: createData,
        include: { product: true },
      });
    }

    // 4. Log pour traçabilité
    console.log('✅ Commande créée depuis Make:', {
      orderId: order.id,
      orderReference: order.orderReference,
      product: product ? product.nom : product_key,
      customer: customer_name,
      amount: totalAmount,
      matchMethod: matchMethod || 'none'
    });

    // 4.5 Envoyer une notification aux appelants
    try {
      notifyNewOrder(order);
    } catch (notifError) {
      console.error('⚠️ Erreur envoi notification:', notifError);
      // Ne pas bloquer la création de commande si la notification échoue
    }

    // 5. Optionnel : Enregistrer le payload brut pour debug si fourni
    if (raw_payload) {
      // Vous pouvez stocker raw_payload dans une table de logs si nécessaire
      console.log('📋 Raw payload Make:', raw_payload);
    }

    // 6. Retourner une réponse de succès
    res.json({
      success: true,
      order_id: order.id,
      order_reference: order.orderReference,
      product: product ? {
        id: product.id,
        name: product.nom,
        code: product.code
      } : { name: product_key, matched: false },
      amount: totalAmount,
      match_method: matchMethod || 'none',
      message: product ? 'Commande créée avec succès' : 'Commande créée (produit non résolu, à vérifier)'
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Prisma fournit souvent un code (ex: P2002, P2003, etc.)
    const prismaCode = error?.code;
    const prismaMeta = error?.meta;

    console.error('❌ Erreur création commande depuis Make:', {
      name: err.name,
      message: err.message,
      code: prismaCode,
      meta: prismaMeta,
    });

    // Réponse de debug minimale (endpoint protégé par X-API-KEY)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la commande',
      debug: {
        name: err.name,
        code: prismaCode || null,
        message: (err.message || '').slice(0, 240),
        meta: prismaMeta || null,
      },
    });
  }
});

// GET /api/webhook/test - Endpoint de test (protégé par API Key)
router.get('/test', verifyApiKey, (req, res) => {
  res.json({
    success: true,
    message: 'Webhook Make fonctionnel !',
    timestamp: new Date().toISOString()
  });
});

// GET /api/webhook/products - Liste des produits disponibles (pour configuration Make)
router.get('/products', verifyApiKey, async (req, res) => {
  try {
    // Filtrer par société si company/companySlug fourni
    const slug = String(req.query.company || req.query.companySlug || '').trim().toLowerCase();
    let companyId = 1;
    if (slug) {
      const company = await prisma.company.findUnique({ where: { slug } });
      if (company) companyId = company.id;
    }

    const products = await prisma.product.findMany({
      where: { companyId },
      select: {
        id: true,
        code: true,
        nom: true,
        prixUnitaire: true,
        prix2Unites: true,
        prix3Unites: true,
        stockActuel: true
      },
      orderBy: {
        nom: 'asc'
      }
    });

    res.json({
      success: true,
      products: products.map(p => ({
        product_key: p.code,
        name: p.nom,
        price_1: p.prixUnitaire,
        price_2: p.prix2Unites || (p.prixUnitaire * 2),
        price_3: p.prix3Unites || (p.prixUnitaire * 3),
        stock: p.stockActuel
      })),
      count: products.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération produits:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

export default router;

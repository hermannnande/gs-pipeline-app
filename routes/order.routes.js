import express from 'express';
import { body, validationResult } from 'express-validator';
import JSZip from 'jszip';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { logAudit } from '../middlewares/audit.middleware.js';
import { notifyOrderValidated, notifyOrderDelivered, notifyOrderRefused } from '../utils/notifications.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { prisma } from '../utils/prisma.js';
import { randomUUID } from 'crypto';

const router = express.Router();

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
    console.log('🔧 Séquence orders.id réparée (setval sur MAX(id)).');
    return true;
  } catch (e) {
    console.error('❌ Échec réparation séquence orders.id:', e);
    return false;
  }
}

// Toutes les routes nécessitent authentification
router.use(authenticate);

/** Fusionne des contraintes AND avec le where Prisma existant. */
function mergeOrderWhereExtras(baseWhere, extras) {
  if (!extras.length) return baseWhere;
  const companyId = baseWhere.companyId;
  const rest = { ...baseWhere };
  delete rest.companyId;
  const parts = [];
  if (Object.keys(rest).length > 0) parts.push(rest);
  parts.push(...extras);
  return { companyId, AND: parts };
}

// GET /api/orders - Liste des commandes (avec filtres selon rôle)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      ville,
      produit,
      startDate,
      endDate,
      callerId,
      delivererId,
      deliveryType,
      page = 1,
      limit = 1000,
      search,
      clientDatabase,
    } = req.query;
    const user = req.user;

    const isClientDb =
      clientDatabase === '1' ||
      clientDatabase === 'true' ||
      String(clientDatabase || '').toLowerCase() === 'yes';

    // Base clients accessible uniquement a l'ADMIN
    if (isClientDb && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé à l\'administrateur.' });
    }

    let where = { companyId: req.user.companyId };

    // Filtres selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant voit :
      // 1. UNIQUEMENT les commandes NOUVELLE et A_APPELER (en attente d'appel)
      // 2. TOUTES les EXPÉDITIONS et EXPRESS (pour gestion)
      where.OR = [
        { status: { in: ['NOUVELLE', 'A_APPELER'] } },
        { deliveryType: 'EXPEDITION' },
        { deliveryType: 'EXPRESS' }
      ];
    } else if (user.role === 'LIVREUR') {
      // Le livreur voit uniquement ses commandes assignées
      where.delivererId = user.id;
    } else if (user.role === 'GESTIONNAIRE' || user.role === 'GESTIONNAIRE_STOCK') {
      // Le gestionnaire et gestionnaire de stock voient toutes les commandes
      // (pas de restriction)
    } else if (user.role === 'ADMIN') {
      // L'admin voit tout (pas de restriction)
    }

    // Filtres supplémentaires
    if (status) where.status = status;
    if (ville) where.clientVille = { contains: ville, mode: 'insensitive' };
    if (produit) where.produitNom = { contains: produit, mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId);
    if (delivererId) where.delivererId = parseInt(delivererId);
    if (deliveryType) where.deliveryType = deliveryType; // ✅ Appliquer le filtre deliveryType
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const extras = [];
    // Même périmètre que l'écran Base clients / export CSV (sans statut précis)
    if (isClientDb && !status) {
      extras.push({ status: { notIn: ['NOUVELLE', 'A_APPELER'] } });
      if (user.role === 'GESTIONNAIRE_STOCK') {
        extras.push({ status: { not: 'VALIDEE' } });
      }
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      extras.push({
        OR: [
          { clientNom: { contains: q, mode: 'insensitive' } },
          { clientTelephone: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (extras.length) {
      where = mergeOrderWhereExtras(where, extras);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const rawLimit = parseInt(limit, 10);
    const limitNum = isClientDb
      ? Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 100))
      : Math.min(10000, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 1000));

    const skip = (pageNum - 1) * limitNum;

    const listQueries = [
      prisma.order.findMany({
        where,
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          },
          product: {
            select: { 
              id: true, 
              code: true, 
              nom: true, 
              prixUnitaire: true,
              prix2Unites: true,
              prix3Unites: true
            }
          }
        },
        orderBy: [
          { priorite: 'desc' }, // Priorité d'abord
          { createdAt: 'desc' } // Puis les plus récentes
        ],
        skip,
        take: limitNum
      }),
      prisma.order.count({ where }),
    ];

    if (isClientDb) {
      listQueries.push(
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        prisma.order.aggregate({
          where: mergeOrderWhereExtras(where, [
            { status: { in: ['VALIDEE', 'ASSIGNEE', 'LIVREE'] } },
          ]),
          _sum: { montant: true },
        }),
        prisma.order.findMany({
          where,
          select: { clientVille: true },
          distinct: ['clientVille'],
          orderBy: { clientVille: 'asc' },
        }),
      );
    }

    const results = await Promise.all(listQueries);
    const orders = results[0];
    const total = results[1];

    let clientDatabaseStats = undefined;
    let distinctVilles = undefined;
    if (isClientDb) {
      const statusGroups = results[2];
      const montantAgg = results[3];
      const villeRows = results[4];
      const byStatus = {};
      for (const row of statusGroups) {
        byStatus[row.status] = row._count._all;
      }
      distinctVilles = villeRows
        .map((r) => r.clientVille)
        .filter((v) => v != null && String(v).trim() !== '');
      clientDatabaseStats = {
        byStatus,
        montantTotal: montantAgg._sum.montant ?? 0,
      };
    }

    const ordersLight = orders.map(({ photoRecuExpedition, photoRecuExpress, ...rest }) => rest);

    res.json({
      orders: ordersLight,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      ...(isClientDb && clientDatabaseStats
        ? { clientDatabaseStats, distinctVilles }
        : {}),
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

/** Normalise un numero CI pour deduplication (!= affichage). */
function normalizePhoneDedupe(raw) {
  if (raw == null || raw === '') return '';
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('00225')) d = d.slice(5);
  else if (d.startsWith('225') && d.length > 10) d = d.slice(3);
  return d.slice(0, 10);
}

function csvEscape(v) {
  const t = String(v ?? '');
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

/**
 * GET /api/orders/contacts-export
 * Export CSV des contacts (commandes hors pipeline « à appeler »), avec telephones dedup.
 * Filtres : productId, productCode, niche (contient sourcePage | produitPage | sourceCampagne),
 * status, ville, dates, callerId, search (nom/tel), delivererId, deliveryType
 */
router.get('/contacts-export', authorize('ADMIN'), async (req, res) => {
  try {
    const user = req.user;
    const {
      productId,
      productCode,
      niche,
      status,
      ville,
      startDate,
      endDate,
      callerId,
      delivererId,
      deliveryType,
      search,
    } = req.query;

    const where = { companyId: req.user.companyId };

    if (user.role === 'APPELANT') {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { status: { in: ['NOUVELLE', 'A_APPELER'] } },
          { deliveryType: 'EXPEDITION' },
          { deliveryType: 'EXPRESS' },
        ],
      });
    } else if (user.role === 'LIVREUR') {
      where.delivererId = user.id;
    }

    if (status) where.status = status;
    if (ville) where.clientVille = { contains: String(ville), mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId, 10);
    if (delivererId) where.delivererId = parseInt(delivererId, 10);
    if (deliveryType) where.deliveryType = deliveryType;

    if (productId) {
      const pid = parseInt(String(productId), 10);
      if (!Number.isNaN(pid)) where.productId = pid;
    }
    if (productCode && String(productCode).trim()) {
      where.AND = where.AND || [];
      where.AND.push({
        product: {
          code: { equals: String(productCode).trim(), mode: 'insensitive' },
        },
      });
    }

    if (niche && String(niche).trim()) {
      const q = String(niche).trim();
      const nicheClause = {
        OR: [
          { produitPage: { contains: q, mode: 'insensitive' } },
          { sourcePage: { contains: q, mode: 'insensitive' } },
          { sourceCampagne: { contains: q, mode: 'insensitive' } },
        ],
      };
      where.AND = where.AND || [];
      where.AND.push(nicheClause);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const searchClause = {
        OR: [
          { clientNom: { contains: q, mode: 'insensitive' } },
          { clientTelephone: { contains: q, mode: 'insensitive' } },
        ],
      };
      where.AND = where.AND || [];
      where.AND.push(searchClause);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    /* Meme logique ecran Base Clients : exclure « non traitees » */
    const pipelineExcl = { status: { notIn: ['NOUVELLE', 'A_APPELER'] } };
    where.AND = where.AND || [];
    where.AND.push(pipelineExcl);

    if (user.role === 'GESTIONNAIRE_STOCK') {
      where.AND.push({ status: { not: 'VALIDEE' } });
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        clientNom: true,
        clientTelephone: true,
        clientVille: true,
        clientCommune: true,
        produitNom: true,
        produitPage: true,
        sourcePage: true,
        sourceCampagne: true,
        status: true,
        createdAt: true,
        product: { select: { code: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100000,
    });

    const seen = new Map();
    for (const o of orders) {
      const key = normalizePhoneDedupe(o.clientTelephone);
      if (!key) continue;
      if (!seen.has(key)) seen.set(key, o);
    }

    const rows = Array.from(seen.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const header = [
      'telephone',
      'nom',
      'ville',
      'commune',
      'produit',
      'code_produit',
      'page_source',
      'campagne',
      'statut_derniere_commande',
      'date_derniere_commande',
    ];
    const lines = [
      header.join(';'),
      ...rows.map((o) =>
        [
          csvEscape(o.clientTelephone),
          csvEscape(o.clientNom),
          csvEscape(o.clientVille),
          csvEscape(o.clientCommune || ''),
          csvEscape(o.produitNom),
          csvEscape(o.product?.code || ''),
          csvEscape(o.produitPage || o.sourcePage || ''),
          csvEscape(o.sourceCampagne || ''),
          csvEscape(o.status),
          csvEscape(new Date(o.createdAt).toISOString()),
        ].join(';'),
      ),
    ];

    const bom = '\ufeff';
    const body = bom + lines.join('\n');
    const stamp = new Date().toISOString().slice(0, 10);
    const fname = `contacts-clients-${stamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(body);
  } catch (error) {
    console.error('Erreur export contacts:', error);
    res.status(500).json({ error: "Erreur lors de l'export des contacts." });
  }
});

/**
 * GET /api/orders/full-export-by-product
 *
 * Export COMPLET de la base de donnees clients depuis la creation du systeme,
 * categorise par produit. Toutes les commandes traitees (hors A_APPELER/NOUVELLE)
 * sont incluses, SANS deduplication par numero (contrairement a /contacts-export).
 *
 * Format : ZIP contenant :
 *   - `_TOUTES-COMMANDES.csv`        : toutes les commandes (triees par produit puis date desc)
 *   - `_RECAP-PRODUITS.csv`          : 1 ligne par produit avec totaux (nb commandes, qty, montant)
 *   - `<CODE_PRODUIT>__<slug-nom>.csv` : 1 fichier par produit avec ses commandes
 *
 * Filtres optionnels (sinon = TOUT depuis la creation) :
 *   - startDate, endDate     : bornes sur createdAt
 *   - status                 : un statut precis
 *   - ville                  : ville client (contient)
 *   - callerId               : appelant qui a traite
 *   - delivererId            : livreur assigne
 *   - deliveryType           : LOCAL / EXPEDITION / EXPRESS
 *   - search                 : nom ou telephone client
 *   - productId / productCode: limite a un seul produit (optionnel)
 *   - niche                  : page produit / source / campagne (contient)
 *
 * Acces : tous roles authentifies, mais filtre par role pour APPELANT et LIVREUR.
 * GESTIONNAIRE_STOCK : exclut VALIDEE (comme Base Clients).
 */
/**
 * GET /api/orders/counts
 * Comptage rapide des commandes en base, par statut. Utile pour verifier
 * combien il y a EXACTEMENT de commandes (toutes versus traitees uniquement).
 */
router.get('/counts', authorize('ADMIN'), async (req, res) => {
  try {
    const user = req.user;
    const where = { companyId: req.user.companyId };

    if (user.role === 'APPELANT') {
      where.AND = [{
        OR: [
          { status: { in: ['NOUVELLE', 'A_APPELER'] } },
          { deliveryType: 'EXPEDITION' },
          { deliveryType: 'EXPRESS' },
        ],
      }];
    } else if (user.role === 'LIVREUR') {
      where.delivererId = user.id;
    }

    const [grandTotal, byStatusRaw, withProduct, withoutProduct] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.order.count({ where: { ...where, productId: { not: null } } }),
      prisma.order.count({ where: { ...where, productId: null } }),
    ]);

    const byStatus = {};
    for (const row of byStatusRaw) byStatus[row.status] = row._count._all;

    const traitees = Object.entries(byStatus)
      .filter(([s]) => !['NOUVELLE', 'A_APPELER'].includes(s))
      .reduce((sum, [, n]) => sum + n, 0);
    const nonTraitees = (byStatus.NOUVELLE || 0) + (byStatus.A_APPELER || 0);

    res.json({
      grandTotal,
      traitees,
      nonTraitees,
      withProduct,
      withoutProduct,
      byStatus,
    });
  } catch (error) {
    console.error('Erreur /orders/counts:', error);
    res.status(500).json({ error: 'Erreur comptage commandes.' });
  }
});

router.get('/full-export-by-product', authorize('ADMIN'), async (req, res) => {
  try {
    const user = req.user;
    const {
      productId,
      productCode,
      niche,
      status,
      ville,
      startDate,
      endDate,
      callerId,
      delivererId,
      deliveryType,
      search,
      includeAll, // si "1" / "true" => inclut NOUVELLE et A_APPELER aussi (export brut)
    } = req.query;

    const includeAllOrders =
      includeAll === '1' || includeAll === 'true' || String(includeAll || '').toLowerCase() === 'yes';

    const where = { companyId: req.user.companyId };

    if (user.role === 'APPELANT') {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { status: { in: ['NOUVELLE', 'A_APPELER'] } },
          { deliveryType: 'EXPEDITION' },
          { deliveryType: 'EXPRESS' },
        ],
      });
    } else if (user.role === 'LIVREUR') {
      where.delivererId = user.id;
    }

    if (status) where.status = status;
    if (ville) where.clientVille = { contains: String(ville), mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId, 10);
    if (delivererId) where.delivererId = parseInt(delivererId, 10);
    if (deliveryType) where.deliveryType = deliveryType;

    if (productId) {
      const pid = parseInt(String(productId), 10);
      if (!Number.isNaN(pid)) where.productId = pid;
    }
    if (productCode && String(productCode).trim()) {
      where.AND = where.AND || [];
      where.AND.push({
        product: {
          code: { equals: String(productCode).trim(), mode: 'insensitive' },
        },
      });
    }

    if (niche && String(niche).trim()) {
      const q = String(niche).trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { produitPage: { contains: q, mode: 'insensitive' } },
          { sourcePage: { contains: q, mode: 'insensitive' } },
          { sourceCampagne: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { clientNom: { contains: q, mode: 'insensitive' } },
          { clientTelephone: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    /* Par defaut on exclut le pipeline "non traitees" (cohrent avec Base Clients).
     * Avec includeAll=1, on garde TOUT (utile pour exports comptables / brutes). */
    where.AND = where.AND || [];
    if (!includeAllOrders) {
      where.AND.push({ status: { notIn: ['NOUVELLE', 'A_APPELER'] } });
    }

    if (user.role === 'GESTIONNAIRE_STOCK') {
      where.AND.push({ status: { not: 'VALIDEE' } });
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderReference: true,
        clientNom: true,
        clientTelephone: true,
        clientVille: true,
        clientCommune: true,
        clientAdresse: true,
        produitNom: true,
        produitPage: true,
        sourcePage: true,
        sourceCampagne: true,
        quantite: true,
        montant: true,
        montantPaye: true,
        modePaiement: true,
        deliveryType: true,
        status: true,
        nombreAppels: true,
        noteAppelant: true,
        noteLivreur: true,
        createdAt: true,
        calledAt: true,
        product: { select: { id: true, code: true, nom: true } },
        caller: { select: { prenom: true, nom: true } },
        deliverer: { select: { prenom: true, nom: true } },
      },
      orderBy: [{ productId: 'asc' }, { createdAt: 'desc' }],
      take: 200000,
    });

    /* Regrouper par produit */
    const groups = new Map(); // key = code produit (ou SANS_PRODUIT)
    for (const o of orders) {
      const code = o.product?.code?.trim() || '_SANS_PRODUIT';
      const nom = o.product?.nom || o.produitNom || 'Sans produit';
      if (!groups.has(code)) {
        groups.set(code, { code, nom, orders: [] });
      }
      groups.get(code).orders.push(o);
    }

    /* Header CSV commun pour les fichiers detailles */
    const detailHeader = [
      'date_creation',
      'reference',
      'code_produit',
      'produit',
      'quantite',
      'montant',
      'montant_paye',
      'mode_paiement',
      'type_livraison',
      'statut',
      'client_nom',
      'client_telephone',
      'client_ville',
      'client_commune',
      'client_adresse',
      'page_source',
      'campagne',
      'nb_appels',
      'appelant',
      'livreur',
      'date_appel',
      'note_appelant',
      'note_livreur',
    ];

    const rowFor = (o) => [
      csvEscape(new Date(o.createdAt).toISOString()),
      csvEscape(o.orderReference || ''),
      csvEscape(o.product?.code || ''),
      csvEscape(o.product?.nom || o.produitNom || ''),
      csvEscape(o.quantite ?? ''),
      csvEscape(o.montant ?? ''),
      csvEscape(o.montantPaye ?? ''),
      csvEscape(o.modePaiement || ''),
      csvEscape(o.deliveryType || ''),
      csvEscape(o.status || ''),
      csvEscape(o.clientNom || ''),
      csvEscape(o.clientTelephone || ''),
      csvEscape(o.clientVille || ''),
      csvEscape(o.clientCommune || ''),
      csvEscape(o.clientAdresse || ''),
      csvEscape(o.produitPage || o.sourcePage || ''),
      csvEscape(o.sourceCampagne || ''),
      csvEscape(o.nombreAppels ?? 0),
      csvEscape(o.caller ? `${o.caller.prenom} ${o.caller.nom}` : ''),
      csvEscape(o.deliverer ? `${o.deliverer.prenom} ${o.deliverer.nom}` : ''),
      csvEscape(o.calledAt ? new Date(o.calledAt).toISOString() : ''),
      csvEscape(o.noteAppelant || ''),
      csvEscape(o.noteLivreur || ''),
    ];

    const bom = '\ufeff';
    const buildCsv = (rows) => bom + [detailHeader.join(';'), ...rows.map((o) => rowFor(o).join(';'))].join('\n');

    const zip = new JSZip();

    /* Fichier global : toutes commandes triees par produit puis date */
    zip.file('_TOUTES-COMMANDES.csv', buildCsv(orders));

    /* Fichier recap : 1 ligne par produit */
    const recapHeader = [
      'code_produit',
      'produit',
      'nb_commandes',
      'qty_totale',
      'montant_total',
      'nb_livrees',
      'nb_validees',
      'nb_annulees',
      'nb_refusees',
      'nb_injoignables',
      'derniere_commande',
    ];
    const recapRows = Array.from(groups.values())
      .map((g) => {
        const list = g.orders;
        const qty = list.reduce((s, o) => s + (o.quantite || 0), 0);
        const montant = list.reduce(
          (s, o) => (['VALIDEE', 'ASSIGNEE', 'LIVREE', 'EXPRESS_LIVRE'].includes(o.status) ? s + (o.montant || 0) : s),
          0,
        );
        const count = (st) => list.filter((o) => o.status === st).length;
        const last = list[0]?.createdAt ? new Date(list[0].createdAt).toISOString() : '';
        return [
          csvEscape(g.code),
          csvEscape(g.nom),
          csvEscape(list.length),
          csvEscape(qty),
          csvEscape(montant),
          csvEscape(count('LIVREE') + count('EXPRESS_LIVRE')),
          csvEscape(count('VALIDEE')),
          csvEscape(count('ANNULEE') + count('ANNULEE_LIVRAISON')),
          csvEscape(count('REFUSEE')),
          csvEscape(count('INJOIGNABLE')),
          csvEscape(last),
        ].join(';');
      });
    zip.file('_RECAP-PRODUITS.csv', bom + [recapHeader.join(';'), ...recapRows].join('\n'));

    /* 1 fichier CSV par produit */
    const slug = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 60);

    for (const g of groups.values()) {
      const safeCode = slug(g.code) || 'sans-code';
      const safeNom = slug(g.nom) || 'sans-nom';
      const filename = `${safeCode}__${safeNom}.csv`;
      zip.file(filename, buildCsv(g.orders));
    }

    /* Mini README dans le zip */
    const readme = [
      `EXPORT BASE CLIENTS - GS Pipeline`,
      `Date export       : ${new Date().toISOString()}`,
      `Nb commandes      : ${orders.length}`,
      `Nb produits       : ${groups.size}`,
      `Filtres appliques :`,
      `  - startDate   : ${startDate || '(depuis la creation)'}`,
      `  - endDate     : ${endDate || '(jusqu\'a aujourd\'hui)'}`,
      `  - status      : ${status || '(tous sauf NOUVELLE/A_APPELER)'}`,
      `  - ville       : ${ville || '(toutes)'}`,
      `  - productId   : ${productId || '(tous)'}`,
      `  - productCode : ${productCode || '(tous)'}`,
      `  - niche       : ${niche || '(toutes)'}`,
      `  - callerId    : ${callerId || '(tous)'}`,
      `  - delivererId : ${delivererId || '(tous)'}`,
      `  - search      : ${search || '(aucun)'}`,
      ``,
      `Fichiers :`,
      `  _TOUTES-COMMANDES.csv : toutes les commandes triees par produit puis date desc`,
      `  _RECAP-PRODUITS.csv   : 1 ligne par produit avec totaux`,
      `  <CODE>__<nom>.csv     : 1 fichier par produit avec ses commandes detaillees`,
      ``,
      `Encodage : UTF-8 avec BOM (Excel compatible). Separateur : point-virgule (;).`,
    ].join('\n');
    zip.file('README.txt', readme);

    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const stamp = new Date().toISOString().slice(0, 10);
    const fname = `base-clients-par-produit-${stamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.setHeader('Content-Length', String(buf.length));
    res.send(buf);
  } catch (error) {
    console.error('Erreur export complet par produit:', error);
    res.status(500).json({ error: "Erreur lors de l'export complet de la base clients." });
  }
});

// GET /api/orders/:id - Détails d'une commande
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier les permissions selon le rôle
    if (user.role === 'APPELANT' && order.callerId !== user.id && order.callerId !== null) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }
    if (user.role === 'LIVREUR' && order.delivererId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande.' });
  }
});

// POST /api/orders - Créer une commande manuellement (Admin/Gestionnaire)
router.post('/', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientNom').notEmpty().withMessage('Nom du client requis'),
  body('clientTelephone').notEmpty().withMessage('Téléphone requis'),
  body('clientVille').notEmpty().withMessage('Ville requise'),
  body('produitNom').notEmpty().withMessage('Nom du produit requis'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('montant').isFloat({ min: 0 }).withMessage('Montant invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderData = {
      companyId: req.user.companyId,
      // IMPORTANT: générer la référence côté serveur pour éviter toute dépendance
      // à un DEFAULT SQL (pgcrypto/gen_random_uuid) côté Supabase.
      orderReference: randomUUID(),
      clientNom: req.body.clientNom,
      clientTelephone: req.body.clientTelephone,
      clientVille: req.body.clientVille,
      clientCommune: req.body.clientCommune,
      clientAdresse: req.body.clientAdresse,
      produitNom: req.body.produitNom,
      produitPage: req.body.produitPage,
      quantite: req.body.quantite,
      montant: req.body.montant,
      sourceCampagne: req.body.sourceCampagne,
      sourcePage: req.body.sourcePage,
      status: 'NOUVELLE'
    };

    let order;
    try {
      order = await prisma.order.create({ data: orderData });
    } catch (e) {
      const repaired = await repairOrdersIdSequenceIfNeeded(e);
      if (!repaired) throw e;
      order = await prisma.order.create({ data: orderData });
    }

    // Créer l'historique initial
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'NOUVELLE',
        changedBy: req.user.id,
        comment: 'Commande créée manuellement'
      }
    });

    res.status(201).json({ order, message: 'Commande créée avec succès.' });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande.' });
  }
});

// POST /api/orders/:id/marquer-appel - Marquer qu'un appel est en cours (sans changer le statut)
router.post('/:id/marquer-appel', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Incrémenter le compteur d'appels et assigner l'appelant
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        nombreAppels: { increment: 1 },
        callerId: order.callerId || user.id, // Assigner l'appelant si pas déjà assigné
        calledAt: order.calledAt || new Date() // Marquer la date du premier appel
      },
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        }
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Appel marqué avec succès.' 
    });
  } catch (error) {
    console.error('Erreur marquer appel:', error);
    res.status(500).json({ error: 'Erreur lors du marquage de l\'appel.' });
  }
});

// POST /api/orders/:id/toggle-priorite - Basculer la priorité d'une commande (ADMIN uniquement)
router.post('/:id/toggle-priorite', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Basculer la priorité
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        priorite: !order.priorite,
        prioriteAt: !order.priorite ? new Date() : null,
        prioritePar: !order.priorite ? user.id : null
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: updatedOrder.priorite ? 'Commande mise en priorité.' : 'Priorité retirée.'
    });
  } catch (error) {
    console.error('Erreur toggle priorité:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la priorité.' });
  }
});

// PUT /api/orders/:id/status - Changer le statut d'une commande
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, raisonRetour, quantiteLivree: bodyQtyLivree } = req.body;
    const user = req.user;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifications selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant peut changer : A_APPELER -> VALIDEE/ANNULEE/INJOIGNABLE
      if (!['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un appelant.' });
      }
      // Assigner l'appelant si ce n'est pas déjà fait
      if (!order.callerId) {
        await prisma.order.update({
          where: { id: parseInt(id), companyId: req.user.companyId },
          data: { 
            callerId: user.id, 
            calledAt: new Date()
          }
        });
      }
    } else if (user.role === 'LIVREUR') {
      // Le livreur peut changer : ASSIGNEE -> LIVREE/LIVREE_PARTIELLE/REFUSEE/ANNULEE_LIVRAISON/RETOURNE
      if (!['LIVREE', 'LIVREE_PARTIELLE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un livreur.' });
      }
      if (order.delivererId !== user.id) {
        return res.status(403).json({ error: 'Cette commande ne vous est pas assignée.' });
      }

      // Motif OBLIGATOIRE quand le colis n'est pas livre (refuse / annule / retourne).
      // Aucune obligation pour une livraison (LIVREE / LIVREE_PARTIELLE).
      const STATUTS_MOTIF_OBLIGATOIRE = ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
      if (STATUTS_MOTIF_OBLIGATOIRE.includes(status) && !String(note || '').trim()) {
        return res.status(400).json({
          error: 'Motif obligatoire : indiquez pourquoi le colis n\'a pas ete livre.',
        });
      }

      // Validation specifique livraison partielle : 1 <= quantiteLivree < order.quantite
      if (status === 'LIVREE_PARTIELLE') {
        const qtyLivree = parseInt(bodyQtyLivree, 10);
        if (!Number.isInteger(qtyLivree) || qtyLivree < 1 || qtyLivree >= order.quantite) {
          return res.status(400).json({
            error: `Quantité livrée invalide. Doit être entre 1 et ${order.quantite - 1} (sur ${order.quantite} commandés).`
          });
        }
      }

      // ✅ Garde-fou anti désynchronisation:
      // Pour LOCAL, on force la confirmation de REMISE avant que le livreur puisse changer le statut.
      // Sinon le stockLocalReserve n'a jamais été alimenté -> LIVREE peut le rendre négatif.
      if (order.deliveryType === 'LOCAL') {
        if (!order.deliveryListId) {
          return res.status(400).json({
            error: 'Commande LOCAL sans tournée associée. Veuillez contacter le gestionnaire.'
          });
        }

        const tourneeStock = await prisma.tourneeStock.findUnique({
          where: { deliveryListId: order.deliveryListId }
        });

        if (!tourneeStock?.colisRemisConfirme) {
          return res.status(400).json({
            error: 'Remise non confirmée. Le gestionnaire de stock doit confirmer la REMISE avant toute mise à jour par le livreur.'
          });
        }

        // 🛡️ Garde-fou anti désynchronisation : tournée déjà clôturée (RETOUR confirmé)
        // Une fois que le gestionnaire de stock a confirmé le RETOUR de la tournée,
        // le stockLocalReserve a été nettoyé et le stockActuel réincrémenté pour les
        // colis non livrés. Modifier le statut après cette étape désynchroniserait le
        // stock (stockLocalReserve négatif ou stockActuel double-compté).
        // → Toute correction post-clôture doit passer par un admin (ajustement manuel).
        if (tourneeStock.colisRetourConfirme) {
          return res.status(400).json({
            error: 'Cette tournée a été clôturée par le gestionnaire de stock. Toute correction doit désormais être effectuée par un admin via un ajustement de stock.'
          });
        }
      }
    }

    // Quantite livree effective pour ce changement de statut :
    //  - LIVREE          → toute la quantite commandee
    //  - LIVREE_PARTIELLE → quantite saisie par le livreur (validee plus haut)
    //  - autres statuts  → null (pas de livraison)
    const qtyLivreePartielle = status === 'LIVREE_PARTIELLE' ? parseInt(bodyQtyLivree, 10) : null;
    const qtyLivreeEffective =
      status === 'LIVREE' ? order.quantite :
      status === 'LIVREE_PARTIELLE' ? qtyLivreePartielle :
      null;

    // Transaction pour gérer le statut + stock de manière cohérente
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la commande
      const updated = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          status,
          noteAppelant: user.role === 'APPELANT' && note ? note : order.noteAppelant,
          noteLivreur: user.role === 'LIVREUR' && note ? note : order.noteLivreur,
          noteGestionnaire: (user.role === 'GESTIONNAIRE' || user.role === 'ADMIN') && note ? note : order.noteGestionnaire,
          validatedAt: status === 'VALIDEE' ? new Date() : order.validatedAt,
          deliveredAt: (status === 'LIVREE' || status === 'LIVREE_PARTIELLE') ? new Date() : order.deliveredAt,
          // quantiteLivree :
          //   - LIVREE_PARTIELLE → valeur partielle saisie
          //   - LIVREE → on stocke explicitement order.quantite pour clarte (utile pour le retour partiel)
          //   - autre → on remet a null (cas correction <24h)
          quantiteLivree: qtyLivreeEffective,
          raisonRetour: status === 'RETOURNE' && raisonRetour ? raisonRetour : order.raisonRetour,
          retourneAt: status === 'RETOURNE' ? new Date() : order.retourneAt
        },
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          },
          product: true
        }
      });

      // ⚠️ STOCK : Le stock NE se déplace PAS lors de l'assignation
      // Le stock se déplacera UNIQUEMENT lors de la confirmation de REMISE
      // par le gestionnaire de stock (voir routes/stock.routes.js ligne 207)

      // RÈGLE MÉTIER 1 : Décrémenter le stock quand la commande passe à LIVRÉE ou LIVREE_PARTIELLE
      // LIVREE         → on décrémente order.quantite (toute la commande)
      // LIVREE_PARTIELLE → on décrémente qtyLivreeEffective (seulement ce qui est livré).
      //                    Le reste (quantite - qtyLivreeEffective) reste dans stockLocalReserve
      //                    et sera retourné lors du confirm-retour gestionnaire stock.
      const isLivraison = (status === 'LIVREE' || status === 'LIVREE_PARTIELLE');
      const wasLivraison = (order.status === 'LIVREE' || order.status === 'LIVREE_PARTIELLE');
      if (isLivraison && !wasLivraison && order.productId) {
        const qtyToDeduct = qtyLivreeEffective || order.quantite;
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          // 📦 LOCAL : Si le colis était chez le livreur (peu importe le statut), réduire stockLocalReserve
          if (order.deliveryType === 'LOCAL') {
            // Liste des statuts où le colis est chez le livreur
            // Aligné avec la logique RETOUR (routes/stock.routes.js ligne 420)
            const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];

            if (statusAvecLivreur.includes(order.status)) {
              // ✅ Le colis était chez le livreur, réduire stockLocalReserve de la quantité livrée
          const stockLocalReserveAvant = product.stockLocalReserve;
              const stockLocalReserveApres = stockLocalReserveAvant - qtyToDeduct;

          await tx.product.update({
            where: { id: order.productId },
                data: { stockLocalReserve: stockLocalReserveApres }
              });

              await tx.stockMovement.create({
            data: {
                  productId: order.productId,
                  type: 'LIVRAISON_LOCAL',
                  quantite: -qtyToDeduct,
                  stockAvant: stockLocalReserveAvant,
                  stockApres: stockLocalReserveApres,
                  orderId: order.id,
                  effectuePar: user.id,
                  motif: status === 'LIVREE_PARTIELLE'
                    ? `Livraison partielle ${order.orderReference} - ${qtyToDeduct}/${order.quantite} pris - ${order.clientNom}`
                    : `Livraison locale ${order.orderReference} - ${order.status} → LIVREE - ${order.clientNom}`
                }
              });
            } else {
              // Cas rare : LOCAL → LIVREE sans passer par les statuts avec livreur
              // Cela peut arriver si la commande n'a pas encore été remise (pas de REMISE confirmée)
              console.warn(`Commande ${order.orderReference} : LOCAL → ${status} depuis statut ${order.status} (pas de REMISE préalable détectée)`);
            }
          }
          // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
          else if (order.deliveryType === 'EXPEDITION') {
            // ✅ Pas de réduction de stock pour EXPEDITION (déjà réduit lors du paiement 100%)
            // La route POST /api/orders/:id/expedition/livrer gère la confirmation de livraison
            // sans toucher au stock
          }
          // ⚡ EXPRESS : Géré par route dédiée
          else if (order.deliveryType === 'EXPRESS') {
            // ✅ EXPRESS géré par route dédiée /api/orders/:id/express/finaliser
            // Le stock est dans stockExpress, pas dans stockActuel
          }
          // 🔹 Autres types (ne devrait pas arriver normalement)
          else {
            // Réduire stockActuel pour les cas non gérés spécifiquement
            const stockAvant = product.stockActuel;
            const stockApres = stockAvant - qtyToDeduct;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockActuel: stockApres }
            });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
                type: 'LIVRAISON',
                quantite: -qtyToDeduct,
                stockAvant,
                stockApres,
              orderId: order.id,
              effectuePar: user.id,
                motif: `Livraison commande ${order.orderReference} - ${order.clientNom}`
              }
            });
          }
        }
      }

      // ⚠️ NOTE : Le stock ne bouge PAS ici lors du changement de statut par le livreur
      // Le stock revient UNIQUEMENT lors de la confirmation de retour par le gestionnaire de stock

      // RÈGLE MÉTIER 2 : Réincrémenter le stock si la commande était LIVRÉE (ou LIVREE_PARTIELLE)
      // et change vers un autre statut (correction < 24h).
      // On utilise la quantite QUI A ETE LIVREE (order.quantiteLivree pour LIVREE_PARTIELLE,
      // sinon order.quantite). Tout le reste etait deja dans stockLocalReserve.
      const wasLivreeOuPartielle = (order.status === 'LIVREE' || order.status === 'LIVREE_PARTIELLE');
      const isNowLivreeOuPartielle = (status === 'LIVREE' || status === 'LIVREE_PARTIELLE');
      if (wasLivreeOuPartielle && !isNowLivreeOuPartielle && order.productId) {
        // Quantite a remettre = celle qui avait ete soustraite a la livraison precedente
        const qtyToReturn = (order.status === 'LIVREE_PARTIELLE' && order.quantiteLivree)
          ? order.quantiteLivree
          : order.quantite;
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          // 📦 LOCAL : Remettre dans stockLocalReserve (le colis est encore chez le livreur)
          if (order.deliveryType === 'LOCAL') {
            const stockLocalReserveAvant = product.stockLocalReserve;
            const stockLocalReserveApres = stockLocalReserveAvant + qtyToReturn;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockLocalReserve: stockLocalReserveApres }
            });

            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION_LIVRAISON_LOCAL',
                quantite: qtyToReturn, // Positif car on rajoute
                stockAvant: stockLocalReserveAvant,
                stockApres: stockLocalReserveApres,
                orderId: order.id,
                effectuePar: user.id,
                motif: `Correction livraison LOCAL ${order.orderReference} - ${order.status} → ${status} (< 24h) - Colis encore chez livreur - ${order.clientNom}`
              }
            });
          }
          // 📮 EXPEDITION : Remettre dans stockActuel (le colis peut revenir)
          else if (order.deliveryType === 'EXPEDITION') {
          const stockAvant = product.stockActuel;
            const stockApres = stockAvant + qtyToReturn;

          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
                type: 'RETOUR_EXPEDITION',
                quantite: qtyToReturn,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
                motif: `Correction EXPEDITION ${order.orderReference} - ${order.status} → ${status} (< 24h) - ${order.clientNom}`
            }
          });
          }
          // ⚡ EXPRESS : Remettre dans stockExpress
          else if (order.deliveryType === 'EXPRESS') {
            const stockExpressAvant = product.stockExpress || 0;
            const stockExpressApres = stockExpressAvant + qtyToReturn;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockExpress: stockExpressApres }
            });

            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION_EXPRESS',
                quantite: qtyToReturn,
                stockAvant: stockExpressAvant,
                stockApres: stockExpressApres,
                orderId: order.id,
                effectuePar: user.id,
                motif: `Correction EXPRESS ${order.orderReference} - ${order.status} → ${status} (< 24h) - ${order.clientNom}`
              }
            });
          }
          // 🔹 Autres types : Comportement par défaut (stockActuel)
          else {
          const stockAvant = product.stockActuel;
            const stockApres = stockAvant + qtyToReturn;

          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'RETOUR',
                quantite: qtyToReturn,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
              motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
            }
          });
          }
        }
      }

      return updated;
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: status,
        changedBy: user.id,
        comment: note
      }
    });

    // Mettre à jour les statistiques
    await updateStatistics(user.id, user.role, order.status, status, order.montant);

    // 🔔 Envoyer les notifications selon le nouveau statut
    try {
      // Commande validée par un appelant
      if (status === 'VALIDEE' && order.status !== 'VALIDEE') {
        notifyOrderValidated(updatedOrder, user);
      }
      
      // Commande livrée par un livreur
      if (status === 'LIVREE' && order.status !== 'LIVREE') {
        if (updatedOrder.deliverer) {
          notifyOrderDelivered(updatedOrder, updatedOrder.deliverer);
        }
      }
      
      // Commande refusée par un livreur
      if (status === 'REFUSEE' && order.status !== 'REFUSEE') {
        if (updatedOrder.deliverer) {
          notifyOrderRefused(updatedOrder, updatedOrder.deliverer);
        }
      }
    } catch (notifError) {
      console.error('⚠️ Erreur envoi notification:', notifError);
      // Ne pas bloquer la mise à jour si la notification échoue
    }

    logAudit(req, {
      action: 'ORDER_STATUS_CHANGE',
      entityType: 'Order',
      entityId: updatedOrder.id,
      details: {
        oldStatus: order.status,
        newStatus: status,
        note: note || null,
        raisonRetour: raisonRetour || null,
        orderId: updatedOrder.id,
        orderRef: updatedOrder.orderReference,
        clientNom: updatedOrder.clientNom,
      },
    });

    res.json({ order: updatedOrder, message: 'Statut mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// Fonction helper pour mettre à jour les statistiques
async function updateStatistics(userId, role, oldStatus, newStatus, montant) {
  // Statistiques journalières (borne du jour)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (role === 'APPELANT') {
    // Statistiques des appelants
    const stat = await prisma.callStatistic.findFirst({
      where: {
        userId,
        date: { gte: todayStart, lt: tomorrowStart }
      },
      orderBy: { date: 'desc' }
    });

    // On compte un "appel" uniquement quand l'appelant produit un résultat (VALIDEE / ANNULEE / INJOIGNABLE).
    // Si correction entre résultats, on ajuste (décrément ancien, incrément nouveau) sans re-compter un nouvel appel.
    const outcomeStatuses = ['VALIDEE', 'ANNULEE', 'INJOIGNABLE'];
    const updateData = {};

    if (oldStatus !== newStatus) {
      // Décrémenter l'ancien résultat si besoin (correction)
      if (oldStatus === 'VALIDEE') updateData.totalValides = { increment: -1 };
      if (oldStatus === 'ANNULEE') updateData.totalAnnules = { increment: -1 };
      if (oldStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: -1 };

      // Incrémenter le nouveau résultat si besoin
      if (newStatus === 'VALIDEE') updateData.totalValides = { increment: (updateData.totalValides?.increment || 0) + 1 };
      if (newStatus === 'ANNULEE') updateData.totalAnnules = { increment: (updateData.totalAnnules?.increment || 0) + 1 };
      if (newStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: (updateData.totalInjoignables?.increment || 0) + 1 };

      // Comptabiliser un appel uniquement quand on passe d'un statut non-résultat à un résultat
      if (!outcomeStatuses.includes(oldStatus) && outcomeStatuses.includes(newStatus)) {
        updateData.totalAppels = { increment: 1 };
      }
    }

    if (stat) {
      // Éviter update vide
      if (Object.keys(updateData).length > 0) {
        await prisma.callStatistic.update({
          where: { id: stat.id },
          data: updateData
        });
      }
    } else {
      const isOutcome = ['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(newStatus);
      await prisma.callStatistic.create({
        data: {
          userId,
          date: todayStart,
          totalAppels: isOutcome ? 1 : 0,
          totalValides: newStatus === 'VALIDEE' ? 1 : 0,
          totalAnnules: newStatus === 'ANNULEE' ? 1 : 0,
          totalInjoignables: newStatus === 'INJOIGNABLE' ? 1 : 0
        }
      });
    }
  } else if (role === 'LIVREUR') {
    // Statistiques des livreurs
    const stat = await prisma.deliveryStatistic.findFirst({
      where: {
        userId,
        date: { gte: todayStart, lt: tomorrowStart }
      },
      orderBy: { date: 'desc' }
    });

    // Ajustements symétriques en cas de correction (ex: LIVREE -> REFUSEE)
    const updateData = {};

    if (oldStatus !== newStatus) {
      // Décrémenter l'ancien statut si besoin
      if (oldStatus === 'LIVREE') {
        updateData.totalLivraisons = { increment: -1 };
        updateData.montantLivre = { increment: -montant };
      }
      if (oldStatus === 'REFUSEE') updateData.totalRefusees = { increment: -1 };
      if (oldStatus === 'ANNULEE_LIVRAISON') updateData.totalAnnulees = { increment: -1 };

      // Incrémenter le nouveau statut si besoin
      if (newStatus === 'LIVREE') {
        updateData.totalLivraisons = { increment: (updateData.totalLivraisons?.increment || 0) + 1 };
        updateData.montantLivre = { increment: (updateData.montantLivre?.increment || 0) + montant };
      }
      if (newStatus === 'REFUSEE') {
        updateData.totalRefusees = { increment: (updateData.totalRefusees?.increment || 0) + 1 };
      }
      if (newStatus === 'ANNULEE_LIVRAISON') {
        updateData.totalAnnulees = { increment: (updateData.totalAnnulees?.increment || 0) + 1 };
      }
    }

    if (stat) {
      if (Object.keys(updateData).length > 0) {
        await prisma.deliveryStatistic.update({
          where: { id: stat.id },
          data: updateData
        });
      }
    } else {
      await prisma.deliveryStatistic.create({
        data: {
          userId,
          date: todayStart,
          totalLivraisons: newStatus === 'LIVREE' ? 1 : 0,
          totalRefusees: newStatus === 'REFUSEE' ? 1 : 0,
          totalAnnulees: newStatus === 'ANNULEE_LIVRAISON' ? 1 : 0,
          montantLivre: newStatus === 'LIVREE' ? montant : 0
        }
      });
    }
  }
}

// POST /api/orders/:id/renvoyer-appel - Renvoyer une commande vers "À appeler"
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.post('/:id/renvoyer-appel', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Empêcher de renvoyer des commandes déjà livrées ou en cours de livraison
    if (['LIVREE', 'ASSIGNEE', 'EXPEDITION', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Impossible de renvoyer une commande en cours de livraison ou déjà livrée.' 
      });
    }

    // Réinitialiser la commande au statut A_APPELER
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        status: 'A_APPELER',
        callerId: null, // Retirer l'appelant assigné
        calledAt: null,
        validatedAt: null,
        noteAppelant: motif ? `[RENVOYÉE] ${motif}` : order.noteAppelant,
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } },
        deliverer: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'A_APPELER',
        changedBy: req.user.id,
        comment: `Commande renvoyée vers "À appeler" par ${req.user.prenom} ${req.user.nom}${motif ? ' - Motif: ' + motif : ''}`
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande renvoyée vers "À appeler" avec succès.' 
    });
  } catch (error) {
    console.error('Erreur renvoi commande:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de la commande.' });
  }
});

// POST /api/orders/:id/attente-paiement - Marquer une commande en attente de paiement
// Accessible par APPELANT, ADMIN et GESTIONNAIRE
router.post('/:id/attente-paiement', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande n'est pas déjà traitée
    if (!['A_APPELER', 'NOUVELLE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cette commande a déjà été traitée.' 
      });
    }

    // Marquer en attente de paiement
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        enAttentePaiement: true,
        attentePaiementAt: new Date(),
        callerId: req.user.id, // Assigner l'appelant
        calledAt: new Date(),
        noteAppelant: note ? `[EN ATTENTE PAIEMENT] ${note}` : '[EN ATTENTE PAIEMENT] Client prêt à payer',
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status, // Le statut ne change pas
        changedBy: req.user.id,
        comment: `Marquée "En attente de paiement" par ${req.user.prenom} ${req.user.nom}${note ? ' - Note: ' + note : ''}`
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande marquée en attente de paiement.' 
    });
  } catch (error) {
    console.error('Erreur attente paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise en attente de paiement.' });
  }
});

// PUT /api/orders/:id/quantite - Modifier la quantité d'une commande (NOUVELLE, A_APPELER, VALIDEE)
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/quantite', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('quantite').isInt({ min: 1 }).withMessage('La quantité doit être au minimum 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantite } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: { product: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est NOUVELLE, A_APPELER ou VALIDEE
    if (!['NOUVELLE', 'A_APPELER', 'VALIDEE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Seules les commandes NOUVELLE, A_APPELER ou VALIDEES peuvent être modifiées.' 
      });
    }

    // Calculer le nouveau montant:
    // - Si le produit est lié -> utiliser le produit complet (avec prix par paliers)
    // - Sinon -> fallback sur l'ancien calcul (proportionnel)
    let nouveauMontant;
    if (order.product) {
      // Passer le produit complet pour prendre en compte prix2Unites et prix3Unites
      nouveauMontant = computeTotalAmount(order.product, quantite);
    } else {
      // Fallback : calcul proportionnel si pas de produit lié
      const prixUnitaire = order.quantite ? Number(order.montant) / Number(order.quantite) : Number(order.montant);
      nouveauMontant = computeTotalAmount(prixUnitaire, quantite);
    }

    // Pas de vérification de stock - on autorise les modifications même avec stock insuffisant
    // Le stock sera renouvelé plus tard

    // Transaction pour mettre à jour la commande et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Ajuster le stock si nécessaire
      if (order.product && order.status === 'VALIDEE') {
        const differenceQuantite = quantite - order.quantite;
        
        if (order.deliveryType === 'EXPEDITION') {
          // Pour EXPEDITION, le stock a déjà été réduit lors de la création
          // Récupérer le stock actuel avant modification
          const stockAvant = order.product.stockActuel;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          // Ajuster selon la différence
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockActuel: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION' : 'RETOUR',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        } else if (order.deliveryType === 'EXPRESS') {
          // Pour EXPRESS, ajuster le stockExpress
          const stockAvant = order.product.stockExpress;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockExpress: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION_EXPRESS' : 'ANNULATION_EXPRESS',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        }
      }

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          quantite: quantite,
          montant: nouveauMontant,
          montantRestant: order.montantRestant 
            ? (nouveauMontant - (order.montantPaye || 0)) 
            : null,
        },
        include: {
          product: true,
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        }
      });

      // Enregistrer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Quantité modifiée: ${order.quantite} → ${quantite} | Montant: ${order.montant} FCFA → ${nouveauMontant} FCFA`
        }
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: `Quantité modifiée avec succès: ${order.quantite} → ${quantite}` 
    });
  } catch (error) {
    console.error('Erreur modification quantité:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la quantité.' });
  }
});

// PUT /api/orders/:id/adresse - Modifier l'adresse de livraison d'une commande VALIDEE
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/adresse', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientVille').notEmpty().withMessage('La ville est requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { clientVille, clientCommune, clientAdresse } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est VALIDEE (pas encore assignée)
    if (order.status !== 'VALIDEE') {
      return res.status(400).json({ 
        error: 'Seules les commandes VALIDEES (non assignées) peuvent avoir leur adresse modifiée.' 
      });
    }

    // Mettre à jour l'adresse
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          clientVille,
          clientCommune: clientCommune || order.clientCommune,
          clientAdresse: clientAdresse || order.clientAdresse,
        }
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Adresse modifiée: ${order.clientVille} → ${clientVille}${clientCommune ? ' | ' + clientCommune : ''}${clientAdresse ? ' | ' + clientAdresse : ''}`
        }
      });

      return updated;
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Adresse de livraison modifiée avec succès.' 
    });
  } catch (error) {
    console.error('Erreur modification adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'adresse.' });
  }
});

// PUT /api/orders/:id - Modifier une commande (Admin/Gestionnaire)
router.put('/:id', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Ne pas permettre la modification du statut par cette route
    delete updateData.status;

    const order = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: updateData,
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true }
        }
      }
    });

    res.json({ order, message: 'Commande modifiée avec succès.' });
  } catch (error) {
    console.error('Erreur modification commande:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la commande.' });
  }
});

// POST /api/orders/:id/expedition - Créer une EXPÉDITION (paiement 100%)
router.post('/:id/expedition', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, note } = req.body;

    const order = await prisma.order.findFirst({ 
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande a un produit lié
    if (!order.productId) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de produit associé.' });
    }

    if (!order.product) {
      return res.status(400).json({ error: 'Produit non trouvé pour cette commande.' });
    }

    if (parseFloat(montantPaye) < order.montant) {
      return res.status(400).json({ 
        error: 'Le montant payé doit être égal au montant total pour une EXPÉDITION.' 
      });
    }

    // Transaction pour mettre à jour la commande ET réduire le stock immédiatement
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le stock actuel dans la transaction pour éviter les problèmes de concurrence
      const product = await tx.product.findUnique({
        where: { id: order.productId }
      });

      if (!product) {
        throw new Error('Produit introuvable');
      }

      // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPEDITION
      // Le stock sera renouvelé plus tard

      // Réduire le stock immédiatement (peut devenir négatif)
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant - order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockActuel: stockApres },
      });

      // Créer un mouvement de stock
      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'RESERVATION',
          quantite: -order.quantite,
          stockAvant,
          stockApres,
          orderId: order.id,
          effectuePar: req.user.id,
          motif: `Réservation stock pour EXPÉDITION ${order.orderReference} - ${order.clientNom}`
        }
      });

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          status: 'EXPEDITION',
          deliveryType: 'EXPEDITION',
          montantPaye: parseFloat(montantPaye),
          montantRestant: 0,
          modePaiement,
          referencePayment,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement EXPEDITION pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
        },
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: 'EXPEDITION',
          changedBy: req.user.id,
          comment: `EXPÉDITION - Paiement total: ${montantPaye} FCFA via ${modePaiement}${referencePayment ? ' - Réf: ' + referencePayment : ''} | Stock réduit: ${order.quantite}`,
        },
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: 'Commande transférée en EXPÉDITION avec succès. Stock réduit immédiatement.' 
    });
  } catch (error) {
    console.error('Erreur création EXPÉDITION:', error);
    // Si l'erreur vient de la transaction (throw new Error), renvoyer le message
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'expédition.' });
  }
});

// POST /api/orders/:id/express - Créer un EXPRESS (paiement 10%)
router.post('/:id/express', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
  body('agenceRetrait').notEmpty().withMessage('Agence de retrait requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, agenceRetrait, note } = req.body;

    const order = await prisma.order.findFirst({ 
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    const dixPourcent = order.montant * 0.10;
    const montantRestant = order.montant - parseFloat(montantPaye);

    if (parseFloat(montantPaye) < dixPourcent * 0.8) {
      return res.status(400).json({ 
        error: `Le montant payé doit être au moins 10% du total (${Math.round(dixPourcent)} FCFA).` 
      });
    }

    // Transaction pour gérer le stock EXPRESS
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          status: 'EXPRESS',
          deliveryType: 'EXPRESS',
          montantPaye: parseFloat(montantPaye),
          montantRestant,
          modePaiement,
          referencePayment,
          agenceRetrait,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement avance EXPRESS (10%) pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
        },
      });

      // Déplacer le stock vers stock EXPRESS (réservé)
      if (order.productId && order.product) {
        const product = order.product;
        const stockNormalAvant = product.stockActuel;
        const stockExpressAvant = product.stockExpress || 0;
        const stockNormalApres = stockNormalAvant - order.quantite;
        const stockExpressApres = stockExpressAvant + order.quantite;

        // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPRESS
        await tx.product.update({
          where: { id: order.productId },
          data: { 
            stockActuel: stockNormalApres,
            stockExpress: stockExpressApres,
          },
        });

        // Créer mouvement de réservation EXPRESS
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RESERVATION_EXPRESS',
            quantite: order.quantite,
            stockAvant: stockNormalAvant,
            stockApres: stockNormalApres,
            effectuePar: req.user.id,
            motif: `Réservation EXPRESS - ${order.orderReference} - Acompte payé, en attente retrait agence ${agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS',
        changedBy: req.user.id,
        comment: `EXPRESS - Acompte: ${montantPaye} FCFA via ${modePaiement} | Restant: ${Math.round(montantRestant)} FCFA | Agence: ${agenceRetrait}${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande transférée en EXPRESS avec succès. Stock réservé.' 
    });
  } catch (error) {
    console.error('Erreur création EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'express.' });
  }
});

// PUT /api/orders/:id/express/arrive - Marquer un EXPRESS comme arrivé en agence
router.put('/:id/express/arrive', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id: parseInt(id), companyId: req.user.companyId } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (!['EXPRESS', 'EXPRESS_ENVOYE'].includes(order.status)) {
      return res.status(400).json({ error: 'Cette commande n\'est pas un EXPRESS en attente d\'arrivée.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        status: 'EXPRESS_ARRIVE',
        arriveAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Colis arrivé en agence: ${order.agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Colis marqué comme arrivé en agence.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/orders/:id/express/assign - Assigner un livreur à un EXPRESS (envoi vers agence)
router.post('/:id/express/assign', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('delivererId').isInt().withMessage('Livreur invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delivererId } = req.body;
    const orderId = parseInt(id);

    const order = await prisma.order.findFirst({ where: { id: orderId, companyId: req.user.companyId } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée.' });

    if (order.deliveryType !== 'EXPRESS' || order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Seules les commandes EXPRESS (statut EXPRESS) peuvent être assignées.' });
    }

    const deliverer = await prisma.user.findFirst({ where: { id: parseInt(delivererId), companyId: req.user.companyId } });
    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId, companyId: req.user.companyId },
      data: {
        delivererId: parseInt(delivererId),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: orderId,
        oldStatus: order.status,
        newStatus: order.status, // pas de changement de statut
        changedBy: req.user.id,
        comment: `EXPRESS assigné au livreur ${deliverer.prenom} ${deliverer.nom} pour envoi à l'agence ${order.agenceRetrait || ''}`.trim(),
      },
    });

    res.json({
      order: updatedOrder,
      message: 'Livreur assigné à l’EXPRESS avec succès.',
    });
  } catch (error) {
    console.error('Erreur assignation EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de l’assignation de l’EXPRESS.' });
  }
});

// POST /api/orders/:id/express/expedier - Livreur confirme l'envoi du colis vers l'agence
router.post('/:id/express/expedier', authorize('LIVREUR', 'ADMIN'), [
  body('codeExpress').notEmpty().withMessage('Le code / référence d’envoi est obligatoire'),
  body('note').optional({ nullable: true }).isString().withMessage('Note invalide'),
  body('photoRecuExpress').optional({ nullable: true }).isString().withMessage('Photo invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { codeExpress, note, photoRecuExpress } = req.body;

    const order = await prisma.order.findFirst({ where: { id: parseInt(id), companyId: req.user.companyId } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée.' });

    if (order.deliveryType !== 'EXPRESS' || order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Cette commande n’est pas un EXPRESS en attente d’envoi.' });
    }

    if (req.user.role === 'LIVREUR') {
      if (!order.delivererId || order.delivererId !== req.user.id) {
        return res.status(403).json({ error: 'Cet EXPRESS ne vous est pas assigné.' });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        status: 'EXPRESS_ENVOYE',
        expressEnvoyeAt: new Date(),
        expressEnvoyePar: req.user.id,
        codeExpress: String(codeExpress).trim(),
        noteLivreur: note ? String(note).trim() : order.noteLivreur,
        photoRecuExpress: photoRecuExpress ? String(photoRecuExpress).trim() : null,
        photoRecuExpressUploadedAt: photoRecuExpress ? new Date() : null,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS_ENVOYE',
        changedBy: req.user.id,
        comment: `EXPRESS envoyé vers agence ${order.agenceRetrait || ''} | Code: ${String(codeExpress).trim()}`.trim(),
      },
    });

    logAudit(req, {
      action: 'EXPRESS_EXPEDIER',
      entityType: 'Order',
      entityId: updatedOrder.id,
      details: { codeExpress, orderId: updatedOrder.id, orderRef: updatedOrder.orderReference },
    });

    res.json({
      order: updatedOrder,
      message: 'EXPRESS marqué comme envoyé vers l’agence.',
    });
  } catch (error) {
    console.error('Erreur expédier EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation d’envoi EXPRESS.' });
  }
});

// POST /api/orders/:id/express/notifier - Notifier le client (EXPRESS arrivé)
router.post('/:id/express/notifier', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id: parseInt(id), companyId: req.user.companyId } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        clientNotifie: true,
        notifieAt: new Date(),
        notifiePar: req.user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Client ${order.clientNom} notifié de l'arrivée du colis à l'agence ${order.agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Client notifié avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la notification.' });
  }
});

// POST /api/orders/:id/expedition/livrer - Livreur confirme livraison EXPÉDITION
router.post('/:id/expedition/livrer', authorize('LIVREUR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { codeExpedition, note, photoRecuExpedition } = req.body;

    // Validation : Code d'expédition obligatoire
    if (!codeExpedition || !codeExpedition.trim()) {
      return res.status(400).json({ error: 'Le code d\'expédition est obligatoire.' });
    }

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPEDITION' && order.status !== 'ASSIGNEE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas une EXPÉDITION ou n\'est pas assignée.' });
    }
    
    // Vérifier que le livreur est bien assigné à cette commande
    if (req.user.role === 'LIVREUR' && order.delivererId !== req.user.id) {
      return res.status(403).json({ error: 'Cette expédition ne vous est pas assignée.' });
    }

    // Mettre à jour la commande (PAS de réduction de stock car déjà réduit lors de la création EXPÉDITION)
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id), companyId: req.user.companyId },
      data: {
        status: 'LIVREE',
        deliveredAt: new Date(),
        delivererId: req.user.id || order.delivererId,
        noteLivreur: note || order.noteLivreur,
        codeExpedition: codeExpedition.trim(),
        photoRecuExpedition: photoRecuExpedition ? photoRecuExpedition.trim() : null, // ✅ Photo facultative
        photoRecuExpeditionUploadedAt: photoRecuExpedition ? new Date() : null, // ✅ Date si photo présente
        expedieAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'LIVREE',
        changedBy: req.user.id,
        comment: `EXPÉDITION confirmée comme livrée/expédiée par ${req.user.prenom} ${req.user.nom}${note ? ' - ' + note : ''}`,
      },
    });

    logAudit(req, {
      action: 'EXPEDITION_LIVRER',
      entityType: 'Order',
      entityId: updatedOrder.id,
      details: { codeExpedition, orderId: updatedOrder.id, orderRef: updatedOrder.orderReference },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPÉDITION confirmée comme expédiée/livrée.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de livraison.' });
  }
});

// POST /api/orders/:id/express/finaliser - Finaliser EXPRESS (paiement des 90% restants)
router.post('/:id/express/finaliser', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const montantTotal = (order.montantPaye || 0) + parseFloat(montantPaye);
    
    if (montantTotal < order.montant * 0.95) {
      return res.status(400).json({ 
        error: `Le montant total payé (${Math.round(montantTotal)} FCFA) est insuffisant. Attendu: ${Math.round(order.montant)} FCFA.` 
      });
    }

    // Transaction pour gérer le stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: {
          status: 'EXPRESS_LIVRE',
          montantPaye: montantTotal,
          montantRestant: 0,
          deliveredAt: new Date(),
        },
      });

      // Réduire le stock EXPRESS (pas le stock normal, déjà déplacé lors de la création)
      if (order.productId && order.product) {
        const product = order.product;
        const stockExpressAvant = product.stockExpress || 0;
        const stockExpressApres = stockExpressAvant - order.quantite;

        await tx.product.update({
          where: { id: order.productId },
          data: { stockExpress: stockExpressApres },
        });

        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RETRAIT_EXPRESS',
            quantite: -order.quantite,
            stockAvant: stockExpressAvant,
            stockApres: stockExpressApres,
            effectuePar: req.user.id,
            motif: `EXPRESS retiré par client - ${order.orderReference} - Agence: ${order.agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_LIVRE',
        changedBy: req.user.id,
        comment: `Paiement final: ${montantPaye} FCFA via ${modePaiement} | Total payé: ${Math.round(montantTotal)} FCFA${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPRESS finalisé avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la finalisation.' });
  }
});

// POST /api/orders/:id/expedition/assign - Assigner un livreur à une EXPÉDITION
router.post('/:id/expedition/assign', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('delivererId').isInt().withMessage('Livreur invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delivererId } = req.body;
    const orderId = parseInt(id);

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }
    if (order.status !== 'EXPEDITION') {
      return res.status(400).json({ error: 'Seules les commandes EXPÉDITION peuvent être assignées.' });
    }

    // Vérifier que le livreur existe
    const deliverer = await prisma.user.findFirst({
      where: { id: parseInt(delivererId), companyId: req.user.companyId }
    });

    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    // Créer une DeliveryList pour l'EXPÉDITION (comme pour les livraisons locales)
    const deliveryDate = new Date();
    const deliveryList = await prisma.deliveryList.create({
      data: {
        nom: `EXPÉDITION ${order.orderReference} - ${order.clientVille}`,
        date: deliveryDate,
        delivererId: parseInt(delivererId),
        zone: order.clientVille
      }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId, companyId: req.user.companyId },
      data: {
        delivererId: parseInt(delivererId),
        deliveryListId: deliveryList.id,
        deliveryDate: deliveryDate,
        status: 'ASSIGNEE', // Passe en ASSIGNEE une fois assignée
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'ASSIGNEE',
        changedBy: req.user.id,
        comment: `EXPÉDITION assignée au livreur ${deliverer.prenom} ${deliverer.nom}.`
      }
    });

    res.json({ 
      order: updatedOrder,
      deliveryList,
      message: 'EXPÉDITION assignée au livreur avec succès. Le gestionnaire de stock doit confirmer la remise du colis.' 
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation du livreur:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'assignation du livreur.' });
  }
});

// DELETE /api/orders/:id - Supprimer une commande (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la commande avec ses informations de produit
    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId },
      include: {
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Transaction pour gérer la suppression et la restauration du stock
    await prisma.$transaction(async (tx) => {
      // Restaurer le stock si nécessaire selon le type et statut
      if (order.productId && order.product) {
        let needsStockRestoration = false;
        let stockField = 'stockActuel';

        // EXPÉDITION : stock réduit dès la création, restaurer si pas encore livrée
        if (order.deliveryType === 'EXPEDITION' && ['EXPEDITION', 'ASSIGNEE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockActuel';
        }
        
        // EXPRESS : stock EXPRESS réduit, restaurer si statuts EXPRESS ou EXPRESS_ARRIVE
        else if (order.deliveryType === 'EXPRESS' && ['EXPRESS', 'EXPRESS_ARRIVE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockExpress';
        }

        // Commandes livrées : stock déjà réduit, restaurer
        else if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
          needsStockRestoration = true;
          stockField = order.deliveryType === 'EXPRESS' ? 'stockExpress' : 'stockActuel';
        }

        if (needsStockRestoration) {
          const currentStock = order.product[stockField];
          const newStock = currentStock + order.quantite;

          // Restaurer le stock
          await tx.product.update({
            where: { id: order.productId },
            data: { [stockField]: newStock }
          });

          // Créer un mouvement de stock pour la restauration
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'CORRECTION',
              quantite: order.quantite,
              stockAvant: currentStock,
              stockApres: newStock,
              effectuePar: req.user.id,
              motif: `Restauration ${stockField} suite à suppression de la commande ${order.orderReference} (${order.deliveryType || 'LOCALE'})`
            }
          });
        }
      }

      // Supprimer les mouvements de stock liés à cette commande
      await tx.stockMovement.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer l'historique des statuts
      await tx.statusHistory.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer la commande (deleteMany pour isoler par companyId)
      const deleted = await tx.order.deleteMany({
        where: { id: parseInt(id), companyId: req.user.companyId }
      });
      if (deleted.count === 0) {
        throw new Error('Commande non trouvée ou accès refusé.');
      }
    });

    res.json({ message: 'Commande supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande.' });
  }
});

// POST /api/orders/bulk-delete - Supprimer plusieurs commandes à la fois (Admin uniquement)
router.post('/bulk-delete', authorize('ADMIN'), [
  body('orderIds').isArray({ min: 1 }).withMessage('La liste des IDs est requise'),
  body('orderIds.*').isInt().withMessage('Chaque ID doit être un nombre')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderIds } = req.body;
    const numericIds = orderIds.map(id => parseInt(id));

    // Récupérer toutes les commandes à supprimer avec leurs informations de produit
    const orders = await prisma.order.findMany({
      where: { id: { in: numericIds }, companyId: req.user.companyId },
      include: { product: true }
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Aucune commande trouvée.' });
    }

    // Transaction pour gérer toutes les suppressions
    const result = await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      let restoredStock = {};

      for (const order of orders) {
        // Restaurer le stock si nécessaire selon le type et statut
        if (order.productId && order.product) {
          let needsStockRestoration = false;
          let stockField = 'stockActuel';

          // EXPÉDITION : stock réduit dès la création, restaurer si pas encore livrée
          if (order.deliveryType === 'EXPEDITION' && ['EXPEDITION', 'ASSIGNEE'].includes(order.status)) {
            needsStockRestoration = true;
            stockField = 'stockActuel';
          }
          
          // EXPRESS : stock EXPRESS réduit, restaurer si statuts EXPRESS ou EXPRESS_ARRIVE
          else if (order.deliveryType === 'EXPRESS' && ['EXPRESS', 'EXPRESS_ARRIVE'].includes(order.status)) {
            needsStockRestoration = true;
            stockField = 'stockExpress';
          }

          // Commandes livrées : stock déjà réduit, restaurer
          else if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
            needsStockRestoration = true;
            stockField = order.deliveryType === 'EXPRESS' ? 'stockExpress' : 'stockActuel';
          }

          if (needsStockRestoration) {
            const currentStock = order.product[stockField];
            const newStock = currentStock + order.quantite;

            // Restaurer le stock
            await tx.product.update({
              where: { id: order.productId },
              data: { [stockField]: newStock }
            });

            // Créer un mouvement de stock pour la restauration
            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION',
                quantite: order.quantite,
                stockAvant: currentStock,
                stockApres: newStock,
                effectuePar: req.user.id,
                motif: `Restauration ${stockField} suite à suppression multiple de la commande ${order.orderReference} (${order.deliveryType || 'LOCALE'})`
              }
            });

            // Tracker les restaurations de stock pour le résumé
            if (!restoredStock[order.productId]) {
              restoredStock[order.productId] = {
                nom: order.product.nom,
                quantite: 0
              };
            }
            restoredStock[order.productId].quantite += order.quantite;
          }
        }

        // Supprimer les mouvements de stock liés à cette commande
        await tx.stockMovement.deleteMany({
          where: { orderId: order.id }
        });

        // Supprimer l'historique des statuts
        await tx.statusHistory.deleteMany({
          where: { orderId: order.id }
        });

        deletedCount++;
      }

      // Supprimer toutes les commandes en une seule requête
      await tx.order.deleteMany({
        where: { id: { in: numericIds }, companyId: req.user.companyId }
      });

      return { deletedCount, restoredStock };
    });

    res.json({ 
      message: `${result.deletedCount} commande(s) supprimée(s) avec succès.`,
      deletedCount: result.deletedCount,
      restoredStock: result.restoredStock
    });
  } catch (error) {
    console.error('Erreur suppression multiple commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des commandes.' });
  }
});

// PUT /api/orders/:id/note-appelant - Modifier la note appelant d'une commande
// Accessible uniquement par ADMIN et GESTIONNAIRE (gestionnaire principal)
router.put('/:id/note-appelant', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('noteAppelant')
    .optional({ nullable: true })
    .isString()
    .withMessage('La note appelant doit être une chaîne de caractères'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { noteAppelant } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    const normalizedNote =
      typeof noteAppelant === 'string'
        ? (noteAppelant.trim() === '' ? null : noteAppelant.trim())
        : null;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id), companyId: req.user.companyId },
        data: { noteAppelant: normalizedNote },
        include: {
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        }
      });

      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Note appelant modifiée par ${req.user.prenom} ${req.user.nom}`
        }
      });

      return updated;
    });

    res.json({
      order: updatedOrder,
      message: 'Note appelant modifiée avec succès.'
    });
  } catch (error) {
    console.error('Erreur modification note appelant:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la note appelant.' });
  }
});

export default router;


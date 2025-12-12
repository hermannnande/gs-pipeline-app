import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/products - Liste des produits
router.get('/', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { actif, search } = req.query;

    const where = {};
    if (actif !== undefined) where.actif = actif === 'true';
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { nom: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
  }
});

// GET /api/products/:id - Détail d'un produit
router.get('/:id', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit.' });
  }
});

// POST /api/products - Créer un produit (Admin uniquement)
router.post('/', authorize('ADMIN'), [
  body('code').notEmpty().withMessage('Code requis'),
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prixUnitaire').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('stockActuel').optional().isInt({ min: 0 }).withMessage('Stock invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, nom, description, prixUnitaire, stockActuel, stockAlerte } = req.body;

    // Vérifier si le code existe déjà
    const existing = await prisma.product.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({ error: 'Un produit avec ce code existe déjà.' });
    }

    const product = await prisma.product.create({
      data: {
        code,
        nom,
        description,
        prixUnitaire: parseFloat(prixUnitaire),
        stockActuel: parseInt(stockActuel) || 0,
        stockAlerte: parseInt(stockAlerte) || 10
      }
    });

    // Créer un mouvement initial si stock > 0
    if (product.stockActuel > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'APPROVISIONNEMENT',
          quantite: product.stockActuel,
          stockAvant: 0,
          stockApres: product.stockActuel,
          effectuePar: req.user.id,
          motif: 'Stock initial lors de la création du produit'
        }
      });
    }

    res.status(201).json({ product, message: 'Produit créé avec succès.' });
  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
});

// PUT /api/products/:id - Modifier un produit (Admin uniquement)
router.put('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prixUnitaire, stockAlerte, actif, code } = req.body;

    const updateData = {};
    if (code) updateData.code = code;
    if (nom) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (prixUnitaire) updateData.prixUnitaire = parseFloat(prixUnitaire);
    if (stockAlerte !== undefined) updateData.stockAlerte = parseInt(stockAlerte);
    if (actif !== undefined) updateData.actif = actif;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ product, message: 'Produit modifié avec succès.' });
  } catch (error) {
    console.error('Erreur modification produit:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du produit.' });
  }
});

// DELETE /api/products/:id - Supprimer un produit (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    // Vérifier si le produit est lié à des commandes
    if (product._count.orders > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer ce produit. Il est lié à ${product._count.orders} commande(s).`,
        hint: 'Vous pouvez désactiver le produit au lieu de le supprimer.'
      });
    }

    // Supprimer les mouvements de stock associés en premier
    await prisma.stockMovement.deleteMany({
      where: { productId: parseInt(id) }
    });

    // Supprimer le produit
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
  }
});

// POST /api/products/:id/stock/adjust - Ajuster le stock manuellement (Admin et Gestionnaire Stock)
router.post('/:id/stock/adjust', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), [
  body('quantite').isInt().withMessage('Quantité invalide'),
  body('type').isIn(['APPROVISIONNEMENT', 'CORRECTION', 'PERTE']).withMessage('Type invalide'),
  body('motif').notEmpty().withMessage('Motif requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantite, type, motif } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const qte = parseInt(quantite);
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant + qte;

    if (stockApres < 0) {
      return res.status(400).json({ error: 'Le stock ne peut pas être négatif.' });
    }

    // Transaction pour assurer la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le stock
      const updatedProduct = await tx.product.update({
        where: { id: parseInt(id) },
        data: { stockActuel: stockApres }
      });

      // Créer le mouvement
      const movement = await tx.stockMovement.create({
        data: {
          productId: parseInt(id),
          type,
          quantite: qte,
          stockAvant,
          stockApres,
          effectuePar: req.user.id,
          motif
        }
      });

      return { product: updatedProduct, movement };
    });

    res.json({ 
      ...result, 
      message: 'Stock ajusté avec succès.' 
    });
  } catch (error) {
    console.error('Erreur ajustement stock:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajustement du stock.' });
  }
});

// GET /api/products/low-stock - Produits avec stock faible
router.get('/alerts/low-stock', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    // Récupérer tous les produits actifs et filtrer en JavaScript
    const allProducts = await prisma.product.findMany({
      where: { actif: true },
      orderBy: { stockActuel: 'asc' }
    });

    // Filtrer ceux dont le stock est <= stock d'alerte
    const products = allProducts.filter(p => p.stockActuel <= p.stockAlerte);

    res.json({ products });
  } catch (error) {
    console.error('Erreur récupération alertes stock:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes.' });
  }
});

export default router;



import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/fix-express-stock - Corriger le stock EXPRESS de la chaussette chauffante
router.post('/fix-express-stock', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🔧 Correction du stock EXPRESS de la chaussette chauffante...');

    // Trouver le produit chaussette chauffante
    const product = await prisma.product.findFirst({
      where: {
        code: 'CHAUSSETTE_CHAUFFANTE'
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit chaussette chauffante non trouvé.' });
    }

    if ((product.stockExpress || 0) === 0) {
      return res.json({ message: 'Le stock EXPRESS est déjà à 0. Aucune correction nécessaire.' });
    }

    // Mettre à jour le stock EXPRESS à 0
    const stockAvant = product.stockExpress || 0;
    
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stockExpress: 0 }
      });

      // Créer le mouvement de stock pour la traçabilité
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantite: stockAvant,
          type: 'RETRAIT_EXPRESS',
          stockAvant: stockAvant,
          stockApres: 0,
          effectuePar: req.user.id,
          motif: '[CORRECTION MANUELLE] Commande EXPRESS déjà retirée, stock EXPRESS remis à 0'
        }
      });
    });

    console.log(`✅ ${product.nom}: Stock EXPRESS ${stockAvant} → 0`);

    res.json({
      message: 'Stock EXPRESS corrigé avec succès.',
      produit: product.nom,
      stockAvant,
      stockApres: 0
    });
  } catch (error) {
    console.error('❌ Erreur correction stock EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la correction du stock EXPRESS.' });
  }
});

export default router;


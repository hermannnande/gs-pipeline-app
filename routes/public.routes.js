import express from 'express';
import { prisma } from '../utils/prisma.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { notifyNewOrder } from '../utils/notifications.js';
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
    return true;
  } catch {
    return false;
  }
}

// GET /api/public/products - Liste des produits actifs (public, sans auth)
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { actif: true },
      select: {
        id: true,
        code: true,
        nom: true,
        description: true,
        prixUnitaire: true,
        prix2Unites: true,
        prix3Unites: true,
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
    const { productId, customerName, customerPhone, customerCity, customerCommune, customerAddress, quantity } = req.body;

    if (!productId || !customerName || !customerPhone || !customerCity) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis : productId, customerName, customerPhone, customerCity',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product || !product.actif) {
      return res.status(400).json({ success: false, error: 'Produit introuvable ou inactif.' });
    }

    const orderQuantity = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    const totalAmount = computeTotalAmount(product, orderQuantity);

    const createData = {
      orderReference: randomUUID(),
      clientNom: customerName.trim(),
      clientTelephone: customerPhone.trim(),
      clientVille: customerCity.trim(),
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

export default router;

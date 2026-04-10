import { prisma } from '../../utils/prisma.js';
import { randomUUID } from 'crypto';
import { computeTotalAmount } from '../../utils/pricing.js';
import { notifyNewOrder } from '../../utils/notifications.js';

export async function createOrderFromConversation(conv, extraction, companyId) {
  let product = null;
  if (extraction.productId) {
    product = await prisma.product.findUnique({ where: { id: extraction.productId } });
  }

  const qty = extraction.qty || 1;
  const totalAmount = product
    ? computeTotalAmount(product, qty)
    : 9900 * qty;

  const createData = {
    orderReference: randomUUID(),
    companyId,
    clientNom: extraction.name || conv.customerName || 'Client WhatsApp',
    clientTelephone: extraction.phone || conv.waId,
    clientVille: extraction.city || 'Non renseigné',
    clientCommune: extraction.commune || null,
    clientAdresse: extraction.address || null,
    produitNom: product ? product.nom : extraction.product || 'Produit WhatsApp',
    productId: product ? product.id : null,
    quantite: qty,
    montant: totalAmount,
    sourceCampagne: 'WHATSAPP_BOT',
    sourcePage: 'WhatsApp',
    status: 'NOUVELLE',
  };

  let order;
  try {
    order = await prisma.order.create({ data: createData, include: { product: true } });
  } catch (e) {
    if (e?.code === 'P2002') {
      const target = e?.meta?.target;
      const isIdTarget = Array.isArray(target) ? target.includes('id') : String(target || '').includes('id');
      if (isIdTarget) {
        await prisma.$executeRawUnsafe(`
          SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 0));
        `);
        order = await prisma.order.create({ data: createData, include: { product: true } });
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }

  await prisma.waConversation.update({
    where: { id: conv.id },
    data: { orderId: order.id },
  });

  try {
    notifyNewOrder(order);
  } catch (err) {
    console.error('[WA] Erreur notification:', err.message);
  }

  console.log(`[WA] Commande créée: #${order.id} (${order.orderReference}) — ${order.clientNom} — ${order.produitNom}`);
  return order;
}

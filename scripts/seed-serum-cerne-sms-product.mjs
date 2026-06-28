#!/usr/bin/env node
/**
 * Cree (ou met a jour) le produit obgestion `SERUM_CERNE_SMS` pour la landing SMS.
 * Prix : 6 500 / 11 100 / 13 900 FCFA (paiement a la livraison).
 *
 * Usage : node scripts/seed-serum-cerne-sms-product.mjs
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const COMPANY_ID = parseInt(process.env.COMPANY_ID || '1', 10);
const CODE = 'SERUM_CERNE_SMS';
const PRICES = { prixUnitaire: 6500, prix2Unites: 12000, prix3Unites: 15000 };

async function main() {
  console.log(`[seed] companyId = ${COMPANY_ID}`);

  const source = await prisma.product.findFirst({
    where: { code: 'SERUM_CERNE', companyId: COMPANY_ID },
  });

  const existing = await prisma.product.findFirst({
    where: { code: CODE, companyId: COMPANY_ID },
  });

  if (existing) {
    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...PRICES,
        nom: 'Serum Anti-Cernes Premium (SMS)',
        actif: true,
      },
    });
    console.log(`[seed] Produit ${CODE} mis a jour (id=${updated.id})`);
    console.log(`       prixUnitaire=${updated.prixUnitaire} prix2=${updated.prix2Unites} prix3=${updated.prix3Unites}`);
    return;
  }

  const created = await prisma.product.create({
    data: {
      code: CODE,
      nom: 'Serum Anti-Cernes Premium (SMS)',
      description: source?.description || 'Serum dermatologique anti-cernes — offre SMS prospects.',
      ...PRICES,
      stockActuel: 0,
      stockExpress: 0,
      stockLocalReserve: 0,
      stockAlerte: source?.stockAlerte || 10,
      imageUrl: source?.imageUrl || null,
      actif: true,
      companyId: COMPANY_ID,
    },
  });

  console.log(`[seed] OK Produit cree : id=${created.id} code=${created.code}`);
  console.log(`       prixUnitaire=${created.prixUnitaire} prix2=${created.prix2Unites} prix3=${created.prix3Unites}`);
}

main()
  .catch((e) => {
    console.error('[seed] ERREUR :', e?.stack || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

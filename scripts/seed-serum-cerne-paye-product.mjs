#!/usr/bin/env node
/**
 * Cree (ou met a jour) le produit obgestion `SERUM_CERNE_PAYE` qui sera
 * reference par les commandes Chariow.
 *
 * Stratégie :
 *   - Cherche d'abord le produit `SERUM_CERNE` ou `SERUM_CERNE_TK` dans la
 *     base obgestion pour cloner ses prix (9 900 / 16 900 / 24 900 FCFA).
 *   - Cree un nouveau produit `SERUM_CERNE_PAYE` avec les memes prix mais
 *     un nom different (« Serum Anti-Cernes Premium - Mobile Money »).
 *   - Si le produit existe deja, ne fait rien (idempotent).
 *
 * Usage :
 *   node scripts/seed-serum-cerne-paye-product.mjs
 *
 * Variables d'env requises :
 *   DATABASE_URL  (auto-charge via dotenv si .env present)
 *   COMPANY_ID    (optionnel, defaut = 1)
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const COMPANY_ID = parseInt(process.env.COMPANY_ID || '1', 10);
const NEW_CODE = 'SERUM_CERNE_PAYE';
const SOURCE_CODES = ['SERUM_CERNE_TK', 'SERUM_CERNE']; // tentatives par ordre

async function main() {
  console.log(`[seed] companyId = ${COMPANY_ID}`);

  // 1. Verifier si le produit existe deja
  const existing = await prisma.product.findFirst({
    where: { code: NEW_CODE, companyId: COMPANY_ID },
  });

  if (existing) {
    console.log(`[seed] Le produit ${NEW_CODE} existe deja (id=${existing.id}). Rien a faire.`);
    console.log(`       Pour le mettre a jour, supprimez-le d'abord ou modifiez via l'admin.`);
    return;
  }

  // 2. Trouver un produit source pour cloner les prix
  let source = null;
  for (const code of SOURCE_CODES) {
    source = await prisma.product.findFirst({
      where: { code, companyId: COMPANY_ID },
    });
    if (source) {
      console.log(`[seed] Source trouvee : ${code} (id=${source.id})`);
      break;
    }
  }

  if (!source) {
    console.error(`[seed] ERREUR : aucun produit source trouve parmi ${SOURCE_CODES.join(', ')}.`);
    console.error(`       Creez d'abord le produit serum-cerne dans l'admin obgestion,`);
    console.error(`       OU executez ce script avec des prix manuels.`);
    process.exit(1);
  }

  // 3. Cloner avec le nouveau code
  const created = await prisma.product.create({
    data: {
      code: NEW_CODE,
      nom: 'Serum Anti-Cernes Premium (Mobile Money)',
      description: source.description || 'Serum dermatologique anti-cernes - paiement Mobile Money en ligne via Chariow.',
      prixUnitaire: source.prixUnitaire,
      prix2Unites: source.prix2Unites,
      prix3Unites: source.prix3Unites,
      stockActuel: 0,
      stockExpress: 0,
      stockLocalReserve: 0,
      stockAlerte: source.stockAlerte || 10,
      imageUrl: source.imageUrl,
      actif: true,
      companyId: COMPANY_ID,
    },
  });

  console.log(`[seed] OK Produit cree :`);
  console.log(`       id           = ${created.id}`);
  console.log(`       code         = ${created.code}`);
  console.log(`       nom          = ${created.nom}`);
  console.log(`       prixUnitaire = ${created.prixUnitaire}`);
  console.log(`       prix2Unites  = ${created.prix2Unites}`);
  console.log(`       prix3Unites  = ${created.prix3Unites}`);
  console.log('');
  console.log(`       N'oubliez pas d'approvisionner le stock dans l'admin obgestion`);
  console.log(`       avant de lancer les premieres commandes Chariow.`);
}

main()
  .catch((e) => {
    console.error('[seed] ERREUR :', e?.stack || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

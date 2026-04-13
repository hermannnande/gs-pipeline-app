/**
 * Script to create the landing_templates table and seed the first template.
 * Run: node scripts/seed-template.mjs
 * Requires DATABASE_URL in .env
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const VERRUE_TK_CONFIG = {
  productCode: 'VERRUE_TK',
  title: 'Creme Anti-Verrue VERRUE TK',
  subtitle: 'Soin anti-verrue',
  description: 'Formule ciblee pour les verrues visibles. Application simple et sans douleur. Resultats constates en quelques jours.',
  badge: 'BEST-SELLER',
  prices: { 1: 9900, 2: 14900, 3: 24900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 boite', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 boites', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ],
  images: {
    hero: '/verrue-tk/hero.webp',
    gallery: ['/verrue-tk/gallery-1.webp', '/verrue-tk/gallery-2.webp', '/verrue-tk/gallery-3.webp'],
    usage: '/verrue-tk/usage.webp',
    banner: '/verrue-tk/banner-clients.webp',
    avant: '/verrue-tk/avant.webp',
    apres: '/verrue-tk/apres.webp',
  },
  videos: ['/verrue-tk/video-1.mp4', '/verrue-tk/video-2.mp4', '/verrue-tk/video-3.mp4'],
  reviews: [
    { init: 'AK', bg: 'bg-amber-500', n: 'Awa K.', v: 'Abidjan', q: 'En 5 jours la verrue a seche completement. Ma peau est redevenue lisse. Incroyable.', s: 5 },
    { init: 'JM', bg: 'bg-sky-500', n: 'Jean-Marc B.', v: 'Bouake', q: 'Livraison le lendemain. Resultat visible des la premiere semaine. Je recommande.', s: 5 },
    { init: 'MD', bg: 'bg-emerald-500', n: 'Mariam D.', v: 'Yopougon', q: 'Commande pour ma mere. Verrues depuis 2 ans. Apres 10 jours, presque fini.', s: 5 },
    { init: 'KF', bg: 'bg-violet-500', n: 'Kouassi F.', v: 'Daloa', q: 'Premiere creme qui marche. Application facile, pas de douleur. Merci.', s: 5 },
    { init: 'FS', bg: 'bg-rose-500', n: 'Fatou S.', v: 'San Pedro', q: 'Service client au top. 2 semaines plus tard, plus rien sur ma peau.', s: 4 },
    { init: 'IT', bg: 'bg-teal-500', n: 'Ibrahim T.', v: 'Korhogo', q: "J'hesitais. Maintenant je regrette de ne pas avoir commande plus tot.", s: 5 },
  ],
  toasts: [
    { n: 'Awa K.', v: 'Abidjan', t: '2 min' },
    { n: 'Jean M.', v: 'Bouake', t: '5 min' },
    { n: 'Mariam D.', v: 'Yopougon', t: '8 min' },
    { n: 'Kouassi F.', v: 'Daloa', t: '12 min' },
    { n: 'Fatou S.', v: 'San Pedro', t: '15 min' },
    { n: 'Ibrahim T.', v: 'Korhogo', t: '18 min' },
    { n: 'Aminata C.', v: 'Man', t: '22 min' },
  ],
  sections: {
    stats: [
      { n: '1 200+', l: 'Clients satisfaits' },
      { n: '24h', l: 'Livraison Abidjan' },
      { n: '4.8/5', l: 'Note moyenne' },
      { n: '98%', l: 'Recommandent' },
    ],
    howToUse: [
      { n: '01', t: 'Nettoyez', d: "Lavez la zone concernee a l'eau propre.", ico: '💧' },
      { n: '02', t: 'Appliquez', d: 'Deposez une petite quantite de creme.', ico: '🧴' },
      { n: '03', t: 'Repetez', d: 'Suivez la routine conseillee.', ico: '🔁' },
      { n: '04', t: 'Observez', d: "Constatez l'amelioration.", ico: '✨' },
    ],
    faq: [
      { q: 'Est-ce douloureux ?', a: 'Non. Application locale, douce et rapide.' },
      { q: 'Dois-je payer avant ?', a: 'Non. Paiement uniquement a la reception.' },
      { q: 'Quand je vois les resultats ?', a: 'La plupart des clients voient une amelioration en quelques jours.' },
      { q: 'Comment suis-je contacte ?', a: 'Notre equipe vous appelle dans les heures qui suivent.' },
      { q: 'Convient a tous types de peau ?', a: 'Oui, formule concue pour tous les types de peau.' },
      { q: 'Plusieurs boites ?', a: '2 boites a 14 900 F ou 3 boites a 24 900 F. Offres groupees populaires.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
      { ico: '🛡️', t: 'Commande securisee', d: 'Verifiez avant de payer' },
    ],
  },
  thankYouUrl: '/anti-verrue/merci',
};

async function main() {
  console.log('Creating landing_templates table if needed...');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "landing_templates" (
        "id" SERIAL PRIMARY KEY,
        "nom" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "productCode" TEXT,
        "productId" INTEGER REFERENCES "products"("id"),
        "config" TEXT NOT NULL,
        "assetsFolder" TEXT,
        "actif" BOOLEAN DEFAULT true,
        "companyId" INTEGER DEFAULT 1 REFERENCES "companies"("id"),
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table created/exists');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "landing_templates_companyId_idx" ON "landing_templates"("companyId");`);
    console.log('✓ Index created');
  } catch (e) {
    console.log('Table may already exist:', e.message?.slice(0, 100));
  }

  const existing = await prisma.$queryRawUnsafe(`SELECT id FROM "landing_templates" WHERE slug = 'creme-anti-verrue' LIMIT 1`);
  if (Array.isArray(existing) && existing.length > 0) {
    console.log('Template "creme-anti-verrue" already exists, skipping seed.');
  } else {
    const product = await prisma.product.findFirst({ where: { code: 'VERRUE_TK' } });

    await prisma.$executeRawUnsafe(
      `INSERT INTO "landing_templates" ("nom", "slug", "description", "productCode", "productId", "config", "assetsFolder", "actif", "companyId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      'Creme Anti-Verrue TK',
      'creme-anti-verrue',
      'Page de vente pour la creme anti-verrue VERRUE TK — template original optimise',
      'VERRUE_TK',
      product?.id || null,
      JSON.stringify(VERRUE_TK_CONFIG),
      'verrue-tk',
      true,
      1
    );
    console.log('✓ Template "creme-anti-verrue" seeded');
  }

  console.log('\nDone!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

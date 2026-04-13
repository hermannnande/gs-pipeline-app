import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

let tableReady = false;

const SEED_CONFIG = JSON.stringify({
  productCode:'VERRUE_TK',title:'Creme Anti-Verrue VERRUE TK',subtitle:'Soin anti-verrue',
  description:'Formule ciblee pour les verrues visibles. Application simple et sans douleur. Resultats constates en quelques jours.',
  badge:'BEST-SELLER',prices:{1:9900,2:14900,3:24900},oldPrice:15000,discount:'-34%',
  qtyOptions:[{v:1,label:'1 boite',sub:'9 900 FCFA',save:''},{v:2,label:'2 boites',sub:'14 900 FCFA',tag:'Populaire',save:'Economisez 4 900 F'},{v:3,label:'3 boites',sub:'24 900 FCFA',tag:'Meilleure offre',save:'Economisez 4 800 F'}],
  images:{hero:'/verrue-tk/hero.webp',gallery:['/verrue-tk/gallery-1.webp','/verrue-tk/gallery-2.webp','/verrue-tk/gallery-3.webp'],usage:'/verrue-tk/usage.webp',banner:'/verrue-tk/banner-clients.webp',avant:'/verrue-tk/avant.webp',apres:'/verrue-tk/apres.webp'},
  videos:['/verrue-tk/video-1.mp4','/verrue-tk/video-2.mp4','/verrue-tk/video-3.mp4'],
  reviews:[{init:'AK',bg:'bg-amber-500',n:'Awa K.',v:'Abidjan',q:'En 5 jours la verrue a seche completement.',s:5},{init:'JM',bg:'bg-sky-500',n:'Jean-Marc B.',v:'Bouake',q:'Livraison le lendemain. Resultat visible.',s:5},{init:'MD',bg:'bg-emerald-500',n:'Mariam D.',v:'Yopougon',q:'Apres 10 jours, presque fini.',s:5},{init:'KF',bg:'bg-violet-500',n:'Kouassi F.',v:'Daloa',q:'Premiere creme qui marche.',s:5},{init:'FS',bg:'bg-rose-500',n:'Fatou S.',v:'San Pedro',q:'Service client au top.',s:4},{init:'IT',bg:'bg-teal-500',n:'Ibrahim T.',v:'Korhogo',q:"J'hesitais. Je recommande.",s:5}],
  toasts:[{n:'Awa K.',v:'Abidjan',t:'2 min'},{n:'Jean M.',v:'Bouake',t:'5 min'},{n:'Mariam D.',v:'Yopougon',t:'8 min'},{n:'Kouassi F.',v:'Daloa',t:'12 min'},{n:'Fatou S.',v:'San Pedro',t:'15 min'}],
  sections:{
    stats:[{n:'1 200+',l:'Clients satisfaits'},{n:'24h',l:'Livraison Abidjan'},{n:'4.8/5',l:'Note moyenne'},{n:'98%',l:'Recommandent'}],
    howToUse:[{n:'01',t:'Nettoyez',d:"Lavez la zone a l'eau propre.",ico:'💧'},{n:'02',t:'Appliquez',d:'Deposez la creme.',ico:'🧴'},{n:'03',t:'Repetez',d:'Suivez la routine.',ico:'🔁'},{n:'04',t:'Observez',d:"Constatez l'amelioration.",ico:'✨'}],
    faq:[{q:'Est-ce douloureux ?',a:'Non. Application douce.'},{q:'Dois-je payer avant ?',a:'Non. Paiement a la reception.'},{q:'Quand je vois les resultats ?',a:'En quelques jours.'},{q:'Comment suis-je contacte ?',a:'Appel dans les heures qui suivent.'},{q:'Convient a tous types de peau ?',a:'Oui.'},{q:'Plusieurs boites ?',a:'2 boites 14 900 F, 3 boites 24 900 F.'}],
    trustBadges:[{ico:'🚚',t:'Livraison rapide',d:'24h Abidjan'},{ico:'💰',t:'Paiement livraison',d:'Aucun risque'},{ico:'📞',t:'Support client',d:'7j/7'},{ico:'🛡️',t:'Commande securisee',d:'Verifiez avant de payer'}]
  },
  thankYouUrl:'/anti-verrue/merci'
});

async function ensureTable() {
  if (tableReady) return;
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
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "landing_templates_companyId_idx" ON "landing_templates"("companyId");`);

    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "landing_templates"`);
    if (rows?.[0]?.c === 0) {
      const product = await prisma.product.findFirst({ where: { code: 'VERRUE_TK' } });
      await prisma.$executeRawUnsafe(
        `INSERT INTO "landing_templates" ("nom","slug","description","productCode","productId","config","assetsFolder","actif","companyId","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
        'Creme Anti-Verrue TK','creme-anti-verrue','Page de vente creme anti-verrue — template original',
        'VERRUE_TK', product?.id || null, SEED_CONFIG, 'verrue-tk', true, 1
      );
      console.log('✓ Template "creme-anti-verrue" auto-seeded');
    }

    tableReady = true;
  } catch (e) {
    if (e?.message?.includes('already exists')) { tableReady = true; return; }
    console.error('ensureTable error:', e?.message);
  }
}

// GET /api/templates/public/:slug — accès public pour le rendu (MUST be before /:id)
router.get('/public/:slug', async (req, res) => {
  try {
    await ensureTable();
    const template = await prisma.landingTemplate.findUnique({
      where: { slug: req.params.slug },
      include: { product: { select: { id: true, nom: true, code: true, prixUnitaire: true, prix2Unites: true, prix3Unites: true, imageUrl: true } } },
    });
    if (!template || !template.actif) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ template });
  } catch (error) {
    console.error('Erreur get public template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/templates — liste tous les templates (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const templates = await prisma.landingTemplate.findMany({
      where: { companyId: req.user.companyId },
      include: { product: { select: { id: true, nom: true, code: true, imageUrl: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ templates });
  } catch (error) {
    console.error('Erreur liste templates:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/templates/:id — un template
router.get('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const template = await prisma.landingTemplate.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId },
      include: { product: { select: { id: true, nom: true, code: true, imageUrl: true } } },
    });
    if (!template) return res.status(404).json({ error: 'Template introuvable.' });
    res.json({ template });
  } catch (error) {
    console.error('Erreur get template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/templates — créer un template
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const { nom, slug, description, productCode, productId, config, assetsFolder, actif } = req.body;
    if (!nom || !slug) return res.status(400).json({ error: 'Nom et slug requis.' });

    const existing = await prisma.landingTemplate.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: 'Ce slug existe deja.' });

    const template = await prisma.landingTemplate.create({
      data: {
        nom,
        slug,
        description: description || null,
        productCode: productCode || null,
        productId: productId ? parseInt(productId) : null,
        config: typeof config === 'string' ? config : JSON.stringify(config || {}),
        assetsFolder: assetsFolder || null,
        actif: actif !== false,
        companyId: req.user.companyId,
      },
      include: { product: { select: { id: true, nom: true, code: true } } },
    });
    res.status(201).json({ template });
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/templates/:id — modifier un template
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    const existing = await prisma.landingTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Template introuvable.' });

    const { nom, slug, description, productCode, productId, config, assetsFolder, actif } = req.body;

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.landingTemplate.findUnique({ where: { slug } });
      if (slugTaken) return res.status(409).json({ error: 'Ce slug existe deja.' });
    }

    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (productCode !== undefined) data.productCode = productCode;
    if (productId !== undefined) data.productId = productId ? parseInt(productId) : null;
    if (config !== undefined) data.config = typeof config === 'string' ? config : JSON.stringify(config);
    if (assetsFolder !== undefined) data.assetsFolder = assetsFolder;
    if (actif !== undefined) data.actif = actif;

    const template = await prisma.landingTemplate.update({
      where: { id },
      data,
      include: { product: { select: { id: true, nom: true, code: true } } },
    });
    res.json({ template });
  } catch (error) {
    console.error('Erreur update template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/templates/:id — supprimer un template
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    const existing = await prisma.landingTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Template introuvable.' });

    await prisma.landingTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/templates/:id/duplicate — dupliquer un template
router.post('/:id/duplicate', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    const source = await prisma.landingTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!source) return res.status(404).json({ error: 'Template introuvable.' });

    const { nom, slug, productCode, productId } = req.body;
    const newSlug = slug || `${source.slug}-copie-${Date.now()}`;
    const newNom = nom || `${source.nom} (copie)`;

    const template = await prisma.landingTemplate.create({
      data: {
        nom: newNom,
        slug: newSlug,
        description: source.description,
        productCode: productCode || source.productCode,
        productId: productId ? parseInt(productId) : source.productId,
        config: source.config,
        assetsFolder: source.assetsFolder,
        actif: false,
        companyId: req.user.companyId,
      },
      include: { product: { select: { id: true, nom: true, code: true } } },
    });
    res.status(201).json({ template });
  } catch (error) {
    console.error('Erreur duplication template:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;

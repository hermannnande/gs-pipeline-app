import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

let tableReady = false;
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

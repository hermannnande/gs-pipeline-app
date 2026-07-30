import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'GESTIONNAIRE'));

// Dépenses journalières diverses (carburant, emballage, communication…).
// Multi-tenant : toujours scopé sur req.user.companyId.

// GET /api/daily-expenses?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { companyId: req.user.companyId };

    if (from || to) {
      where.date = {};
      if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.date.gte = new Date(`${from}T00:00:00.000Z`);
      if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.date.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const expenses = await prisma.dailyExpense.findMany({
      where,
      include: { createdBy: { select: { id: true, nom: true, prenom: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });

    const total = expenses.reduce((s, e) => s + e.montant, 0);
    res.json({ expenses, total, count: expenses.length });
  } catch (error) {
    console.error('Erreur liste dépenses journalières:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses.' });
  }
});

// POST /api/daily-expenses { date, libelle, montant, categorie? }
router.post('/', async (req, res) => {
  try {
    const { date, libelle, montant, categorie } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) requise.' });
    }
    const today = new Date().toISOString().slice(0, 10); // Abidjan = UTC
    if (date > today) {
      return res.status(400).json({ error: 'La date ne peut pas être dans le futur.' });
    }
    if (!libelle || !String(libelle).trim()) {
      return res.status(400).json({ error: 'Le libellé est requis.' });
    }
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre > 0.' });
    }

    const expense = await prisma.dailyExpense.create({
      data: {
        companyId: req.user.companyId,
        date: new Date(`${date}T00:00:00.000Z`),
        libelle: String(libelle).trim(),
        montant: montantNum,
        categorie: (categorie || 'DIVERS').toUpperCase(),
        createdById: req.user.id,
      },
      include: { createdBy: { select: { id: true, nom: true, prenom: true } } },
    });

    res.status(201).json({ expense });
  } catch (error) {
    console.error('Erreur création dépense journalière:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la dépense.' });
  }
});

// DELETE /api/daily-expenses/:id (scopé companyId)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'id invalide.' });

    const deleted = await prisma.dailyExpense.deleteMany({
      where: { id, companyId: req.user.companyId },
    });
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Dépense non trouvée.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression dépense journalière:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la dépense.' });
  }
});

export default router;

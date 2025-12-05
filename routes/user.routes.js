import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Toutes les routes nécessitent authentification
router.use(authenticate);

// GET /api/users - Liste des utilisateurs (Admin et Gestionnaire)
router.get('/', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { role, actif } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (actif !== undefined) where.actif = actif === 'true';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        actif: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// POST /api/users - Créer un utilisateur (Admin uniquement)
router.post('/', authorize('ADMIN'), [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('role').isIn(['ADMIN', 'GESTIONNAIRE', 'APPELANT', 'LIVREUR']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nom, prenom, telephone, role } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        role
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        actif: true,
        createdAt: true
      }
    });

    res.status(201).json({ user, message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
  }
});

// PUT /api/users/:id - Modifier un utilisateur (Admin uniquement)
router.put('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nom, prenom, telephone, role, actif, password } = req.body;

    const updateData = {};
    if (email) updateData.email = email.toLowerCase();
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (role) updateData.role = role;
    if (actif !== undefined) updateData.actif = actif;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        actif: true,
        updatedAt: true
      }
    });

    res.json({ user, message: 'Utilisateur modifié avec succès.' });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'utilisateur.' });
  }
});

// DELETE /api/users/:id - Désactiver un utilisateur (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre la suppression de son propre compte
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { actif: false }
    });

    res.json({ message: 'Utilisateur désactivé avec succès.' });
  } catch (error) {
    console.error('Erreur désactivation utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation de l\'utilisateur.' });
  }
});

export default router;



import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// POST /api/auth/login - Connexion
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Configuration serveur invalide (JWT_SECRET manquant).',
        code: 'CONFIG_JWT_SECRET_MISSING'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    if (!user.actif) {
      return res.status(401).json({ error: 'Compte désactivé. Contactez l\'administrateur.' });
    }

    // Vérifier le mot de passe
    // - Supporte migration depuis mots de passe non-hashés (auto-conversion en bcrypt)
    // - Évite les 500 en cas de hash invalide
    const stored = user.password || '';
    const looksBcrypt = typeof stored === 'string' && stored.startsWith('$2');

    let isValidPassword = false;
    if (looksBcrypt) {
      try {
        isValidPassword = await bcrypt.compare(password, stored);
      } catch (e) {
        // Hash invalide -> on traite comme mot de passe incorrect (au lieu d'un 500)
        console.error('Erreur bcrypt.compare (hash invalide?) pour user', user.id, e);
        isValidPassword = false;
      }
    } else {
      // Fallback plaintext (migration)
      isValidPassword = password === stored;
      if (isValidPassword) {
        // Auto-migration: convertir en bcrypt pour la suite
        try {
          const hashed = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed }
          });
        } catch (e) {
          console.error('Impossible de migrer le password en bcrypt pour user', user.id, e);
        }
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion.', code: 'LOGIN_INTERNAL_ERROR' });
  }
});

// GET /api/auth/me - Récupérer l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    res.json({ user });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur.' });
  }
});

export default router;











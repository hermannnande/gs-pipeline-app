import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { body, validationResult } from 'express-validator';
import prisma from '../config/prisma.js';

const router = express.Router();

// Formule de Haversine pour calculer la distance entre deux coordonnées GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// 📍 Marquer l'arrivée
router.post('/mark-arrival',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR'),
  [
    body('latitude').isFloat().withMessage('Latitude requise'),
    body('longitude').isFloat().withMessage('Longitude requise'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude } = req.body;
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Vérifier si déjà pointé aujourd'hui
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      if (existingAttendance) {
        return res.status(400).json({ 
          error: 'Vous avez déjà marqué votre présence aujourd\'hui',
          attendance: existingAttendance
        });
      }

      // Récupérer TOUTES les configurations de bureaux actifs
      const storeConfigs = await prisma.storeConfig.findMany({
        where: { actif: true },
        orderBy: { id: 'asc' }
      });
      
      if (!storeConfigs || storeConfigs.length === 0) {
        return res.status(500).json({ 
          error: 'Aucune configuration de bureau trouvée. Veuillez contacter l\'administrateur.' 
        });
      }

      // Calculer la distance pour CHAQUE bureau et trouver le plus proche
      let closestStore = null;
      let minDistance = Infinity;
      
      for (const store of storeConfigs) {
        const dist = calculateDistance(
          latitude, 
          longitude, 
          store.latitude, 
          store.longitude
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          closestStore = store;
        }
      }

      const distance = minDistance;
      const storeConfig = closestStore;

      // Vérifier si dans la zone (du bureau le plus proche)
      const validee = distance <= storeConfig.rayonTolerance;
      
      // ❌ REJETER si hors zone
      if (!validee) {
        console.log(`❌ Pointage REFUSÉ - ${req.user.prenom} ${req.user.nom} - Distance: ${Math.round(distance)}m du bureau "${storeConfig.nom}" (max ${storeConfig.rayonTolerance}m)`);
        
        // Afficher tous les bureaux disponibles
        const bureauList = storeConfigs.map(s => `${s.nom} (${s.rayonTolerance}m)`).join(', ');
        
        return res.status(400).json({
          success: false,
          error: 'HORS_ZONE',
          message: `❌ Vous êtes ABSENT - Vous êtes à ${Math.round(distance)}m du bureau le plus proche "${storeConfig.nom}". Vous devez être à moins de ${storeConfig.rayonTolerance}m de l'un des bureaux : ${bureauList}`,
          distance: Math.round(distance),
          rayonTolerance: storeConfig.rayonTolerance,
          closestStore: storeConfig.nom,
          availableStores: storeConfigs.map(s => s.nom),
          validee: false,
          status: 'ABSENT'
        });
      }
      
      // Déterminer la validation (uniquement si dans la zone)
      let validation = 'VALIDE';
      const now = new Date();
      const heureOuverture = new Date();
      const [heureO, minuteO] = storeConfig.heureOuverture.split(':');
      heureOuverture.setHours(parseInt(heureO), parseInt(minuteO), 0, 0);
      
      if (now > heureOuverture) {
        const retardMinutes = Math.floor((now - heureOuverture) / (1000 * 60));
        if (retardMinutes > storeConfig.toleranceRetard) {
          validation = 'RETARD';
        }
      }

      // Enregistrer la présence (uniquement si dans la zone)
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          heureArrivee: new Date(),
          latitudeArrivee: latitude,
          longitudeArrivee: longitude,
          distanceArrivee: distance,
          storeLocationId: storeConfig.id,  // Bureau utilisé
          validee,
          validation,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          deviceInfo: req.headers['user-agent'] || 'unknown'
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        }
      });

      console.log(`✅ Pointage VALIDE - ${req.user.prenom} ${req.user.nom} - Bureau: ${storeConfig.nom} - Distance: ${Math.round(distance)}m - ${validation}`);

      res.json({
        success: true,
        message: validation === 'RETARD'
          ? `⚠️ Présence enregistrée avec retard à ${new Date().toLocaleTimeString('fr-FR')} (Bureau: ${storeConfig.nom})`
          : `✅ Présence enregistrée à ${new Date().toLocaleTimeString('fr-FR')} (Bureau: ${storeConfig.nom})`,
        attendance,
        distance: Math.round(distance),
        rayonTolerance: storeConfig.rayonTolerance,
        storeName: storeConfig.nom,
        validee: true,
        validation,
        status: 'PRESENT'
      });

    } catch (error) {
      console.error('Erreur pointage arrivée:', error);
      res.status(500).json({ error: 'Erreur lors du pointage' });
    }
  }
);

// 📍 Marquer le départ
router.post('/mark-departure',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR'),
  [
    body('latitude').isFloat().withMessage('Latitude requise'),
    body('longitude').isFloat().withMessage('Longitude requise'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude } = req.body;
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Trouver le pointage d'aujourd'hui
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      if (!attendance) {
        return res.status(400).json({ 
          error: 'Aucun pointage d\'arrivée trouvé pour aujourd\'hui' 
        });
      }

      if (attendance.heureDepart) {
        return res.status(400).json({ 
          error: 'Vous avez déjà marqué votre départ aujourd\'hui' 
        });
      }

      // Récupérer toutes les configs de bureaux actifs
      const storeConfigs = await prisma.storeConfig.findMany({
        where: { actif: true }
      });
      
      // Trouver le bureau le plus proche
      let closestStore = null;
      let minDistance = Infinity;
      
      for (const store of storeConfigs) {
        const dist = calculateDistance(
          latitude, 
          longitude, 
          store.latitude, 
          store.longitude
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          closestStore = store;
        }
      }
      
      const distance = minDistance;

      // Mettre à jour
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          heureDepart: new Date(),
          latitudeDepart: latitude,
          longitudeDepart: longitude,
          distanceDepart: distance
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        }
      });

      console.log(`👋 Départ enregistré - ${req.user.prenom} ${req.user.nom} - ${new Date().toLocaleTimeString('fr-FR')}`);

      res.json({
        success: true,
        message: `✅ Départ enregistré à ${new Date().toLocaleTimeString('fr-FR')}`,
        attendance: updatedAttendance
      });

    } catch (error) {
      console.error('Erreur pointage départ:', error);
      res.status(500).json({ error: 'Erreur lors du départ' });
    }
  }
);

// 📊 Obtenir ma présence du jour
router.get('/my-attendance-today', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      }
    });

    res.json({ attendance });

  } catch (error) {
    console.error('Erreur récupération présence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// 📊 Historique des présences (Admin/Gestionnaire)
router.get('/history', 
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE'),
  async (req, res) => {
    try {
      const { userId, date, startDate, endDate, validee, page = 1, limit = 30 } = req.query;
      
      const where = {};
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      // Filtre par date unique
      if (date) {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.date = {
          gte: selectedDate,
          lt: nextDay
        };
      }
      // Filtre par plage de dates
      else if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      // PAR DÉFAUT : Afficher uniquement AUJOURD'HUI
      else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        where.date = {
          gte: today,
          lt: tomorrow
        };
      }

      if (validee !== undefined) {
        where.validee = validee === 'true';
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { heureArrivee: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      const total = await prisma.attendance.count({ where });

      res.json({
        attendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur historique:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
  }
);

// 🔧 Récupérer la configuration du magasin
router.get('/store-config', authenticate, async (req, res) => {
  try {
    const storeConfig = await prisma.storeConfig.findFirst();
    
    if (!storeConfig) {
      return res.status(404).json({ 
        error: 'Configuration non trouvée' 
      });
    }

    res.json({ config: storeConfig });

  } catch (error) {
    console.error('Erreur récupération config:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// 🔧 Mettre à jour la configuration (Admin uniquement)
router.put('/store-config',
  authenticate,
  authorize('ADMIN'),
  [
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('rayonTolerance').optional().isInt({ min: 10, max: 500 }),
    body('heureOuverture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('heureFermeture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('toleranceRetard').optional().isInt({ min: 0, max: 60 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const storeConfig = await prisma.storeConfig.upsert({
        where: { id: 1 },
        update: req.body,
        create: {
          ...req.body,
          nom: req.body.nom || 'Magasin Principal'
        }
      });

      res.json({
        success: true,
        message: 'Configuration mise à jour',
        config: storeConfig
      });

    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
);

export default router;

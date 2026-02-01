import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

function toUtcDateStart(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function parseHHMM(hhmm, fallback = '08:00') {
  const v = typeof hhmm === 'string' ? hhmm.trim() : '';
  const m = v.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) {
    const mf = String(fallback).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return { hours: Number(mf?.[1] ?? 8), minutes: Number(mf?.[2] ?? 0) };
  }
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

// Formule de Haversine (distance en mètres)
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // m
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getClosestActiveStoreConfig(latitude, longitude) {
  const stores = await prisma.storeConfig.findMany({
    where: { actif: true },
    orderBy: { id: 'asc' },
  });

  if (!stores.length) return null;

  let closest = stores[0];
  let minDistance = Infinity;

  for (const s of stores) {
    const d = haversineMeters(latitude, longitude, s.latitude, s.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = s;
    }
  }

  return { store: closest, distance: minDistance };
}

// POST /api/attendance/mark-arrival
router.post(
  '/mark-arrival',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR'),
  [body('latitude').isFloat().withMessage('Latitude requise'), body('longitude').isFloat().withMessage('Longitude requise')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const userId = req.user.id;

      const today = toUtcDateStart();

      // Refuser si déjà pointé aujourd'hui
      const existing = await prisma.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Déjà pointé aujourd’hui.' });
      }

      const closest = await getClosestActiveStoreConfig(latitude, longitude);
      if (!closest) {
        return res.status(404).json({ error: 'Configuration du magasin/bureau non trouvée.' });
      }

      const { store, distance } = closest;
      const rayon = Number(store.rayonTolerance ?? 50);

      if (distance > rayon) {
        return res.status(400).json({
          success: false,
          error: 'HORS_ZONE',
          message: `❌ Vous êtes à ${Math.round(distance)}m du magasin (max ${rayon}m).`,
          distance: Math.round(distance),
          rayonTolerance: rayon,
          storeName: store.nom,
          validee: false,
          validation: 'HORS_ZONE',
          status: 'ABSENT',
        });
      }

      const now = new Date();
      const { hours: oh, minutes: om } = parseHHMM(store.heureOuverture, '08:00');
      const toleranceMin = Number(store.toleranceRetard ?? 15);
      const opening = new Date(now);
      opening.setHours(oh, om, 0, 0);
      const lateThreshold = new Date(opening.getTime() + toleranceMin * 60 * 1000);

      const validation = now > lateThreshold ? 'RETARD' : 'VALIDE';

      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          heureArrivee: now,
          latitudeArrivee: latitude,
          longitudeArrivee: longitude,
          distanceArrivee: distance,
          storeLocationId: store.id,
          validee: true,
          validation,
          ipAddress: String(req.headers['x-forwarded-for'] || req.ip || 'unknown').slice(0, 200),
          deviceInfo: String(req.headers['user-agent'] || 'unknown').slice(0, 250),
        },
      });

      return res.json({
        success: true,
        message:
          validation === 'RETARD'
            ? `⚠️ Présence enregistrée avec retard à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (Bureau: ${store.nom})`
            : `✅ Présence enregistrée à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (Bureau: ${store.nom})`,
        attendance,
        distance: Math.round(distance),
        rayonTolerance: rayon,
        storeName: store.nom,
        validee: true,
        validation,
        status: validation === 'RETARD' ? 'RETARD' : 'PRESENT',
      });
    } catch (e) {
      console.error('Erreur pointage arrivée:', e);
      return res.status(500).json({ error: 'Erreur lors du pointage' });
    }
  }
);

// POST /api/attendance/mark-departure
router.post(
  '/mark-departure',
  authenticate,
  authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR'),
  [body('latitude').isFloat().withMessage('Latitude requise'), body('longitude').isFloat().withMessage('Longitude requise')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const userId = req.user.id;
      const today = toUtcDateStart();

      const attendance = await prisma.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!attendance) {
        return res.status(400).json({ error: 'Aucun pointage d’arrivée trouvé pour aujourd’hui.' });
      }
      if (attendance.heureDepart) {
        return res.status(400).json({ error: 'Vous avez déjà marqué votre départ aujourd’hui.' });
      }

      // Distance départ (info)
      const closest = await getClosestActiveStoreConfig(latitude, longitude);
      const distance = closest?.distance ?? null;

      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          heureDepart: new Date(),
          latitudeDepart: latitude,
          longitudeDepart: longitude,
          distanceDepart: distance,
        },
      });

      return res.json({
        success: true,
        message: `✅ Départ enregistré à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        attendance: updated,
      });
    } catch (e) {
      console.error('Erreur pointage départ:', e);
      return res.status(500).json({ error: 'Erreur lors du départ' });
    }
  }
);

// GET /api/attendance/my-attendance-today
router.get('/my-attendance-today', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = toUtcDateStart();

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    return res.json({ attendance });
  } catch (e) {
    console.error('Erreur récupération présence:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET /api/attendance/history (Admin/Gestionnaire)
router.get('/history', authenticate, authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { userId, date, startDate, endDate, page = 1, limit = 30 } = req.query;

    const where = {};
    if (userId) where.userId = parseInt(String(userId), 10);

    if (date) {
      const d = new Date(String(date));
      d.setUTCHours(0, 0, 0, 0);
      where.date = d;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toUtcDateStart(new Date(String(startDate)));
      if (endDate) where.date.lte = toUtcDateStart(new Date(String(endDate)));
    }

    const take = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 30));
    const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * take;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: { select: { id: true, nom: true, prenom: true, role: true } },
        },
        orderBy: [{ date: 'desc' }, { heureArrivee: 'desc' }],
        skip,
        take,
      }),
      prisma.attendance.count({ where }),
    ]);

    return res.json({
      attendances,
      pagination: { total, page: Math.max(1, parseInt(String(page), 10) || 1), limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (e) {
    console.error('Erreur historique:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET /api/attendance/store-config
router.get('/store-config', authenticate, async (req, res) => {
  try {
    const configs = await prisma.storeConfig.findMany({ orderBy: { id: 'asc' } });
    if (!configs.length) return res.status(404).json({ error: 'Configuration non trouvée' });
    return res.json({ configs });
  } catch (e) {
    console.error('Erreur récupération config:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// PUT /api/attendance/store-config (Admin)
router.put(
  '/store-config',
  authenticate,
  authorize('ADMIN'),
  [
    body('id').optional().isInt(),
    body('nom').optional().isString(),
    body('adresse').optional().isString(),
    body('latitude').isFloat().withMessage('Latitude requise'),
    body('longitude').isFloat().withMessage('Longitude requise'),
    body('rayonTolerance').optional().isInt({ min: 10, max: 10000 }),
    body('heureOuverture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('heureFermeture').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('toleranceRetard').optional().isInt({ min: 0, max: 240 }),
    body('actif').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = req.body.id ? parseInt(String(req.body.id), 10) : null;
      const data = {
        nom: req.body.nom,
        adresse: req.body.adresse,
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
        rayonTolerance: req.body.rayonTolerance != null ? parseInt(String(req.body.rayonTolerance), 10) : undefined,
        heureOuverture: req.body.heureOuverture,
        heureFermeture: req.body.heureFermeture,
        toleranceRetard: req.body.toleranceRetard != null ? parseInt(String(req.body.toleranceRetard), 10) : undefined,
        actif: req.body.actif,
      };

      let config;
      if (id) {
        config = await prisma.storeConfig.update({ where: { id }, data });
      } else {
        config = await prisma.storeConfig.create({
          data: {
            nom: data.nom || 'Magasin Principal',
            adresse: data.adresse || null,
            latitude: data.latitude,
            longitude: data.longitude,
            rayonTolerance: data.rayonTolerance ?? 50,
            heureOuverture: data.heureOuverture || '08:00',
            heureFermeture: data.heureFermeture || '18:00',
            toleranceRetard: data.toleranceRetard ?? 15,
            actif: data.actif ?? true,
          },
        });
      }

      return res.json({ success: true, message: 'Configuration enregistrée', config });
    } catch (e) {
      console.error('Erreur mise à jour config:', e);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
);

export default router;


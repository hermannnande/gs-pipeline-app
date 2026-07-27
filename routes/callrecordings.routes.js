import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { logAudit } from '../middlewares/audit.middleware.js';
import multer from 'multer';
import { prisma } from '../utils/prisma.js';
import { supabaseAdmin } from '../utils/supabaseAdmin.js';

const router = express.Router();

// Bucket Supabase Storage dédié (PRIVÉ) — lecture via URLs signées (1 h).
// Réutilise le client service partagé (utils/supabaseAdmin.js, pattern du chat).
// ⚠️ Créer le bucket "call-recordings" (private) dans Supabase si absent.
const BUCKET = 'call-recordings';
const SIGNED_URL_TTL = 3600; // secondes (1 h)

// Upload (Vercel serverless) : stockage mémoire + envoi vers Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 Mo max
  },
  fileFilter: (req, file, cb) => {
    // Audio uniquement (l'app Android envoie m4a/mp3/amr/3gp selon le téléphone)
    const mime = file.mimetype || '';
    if (mime.startsWith('audio/') || mime === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio sont acceptés'));
    }
  }
});

// Enrobe multer pour renvoyer du JSON propre au lieu d'une page d'erreur HTML
const uploadAudio = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const isSize = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        error: isSize ? 'Fichier trop volumineux (25 Mo max).' : (err.message || 'Fichier invalide.')
      });
    }
    next();
  });
};

router.use(authenticate);

function requireSupabaseStorage(res) {
  if (!supabaseAdmin) {
    res.status(500).json({
      error: "Supabase Storage non configuré. Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY côté serveur.",
    });
    return false;
  }
  return true;
}

// Normalise un numéro : chiffres uniquement, indicatif 225 retiré en tête
// (les fiches clients sont saisies sans indicatif la plupart du temps).
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00225')) d = d.slice(5);
  else if (d.startsWith('225')) d = d.slice(3);
  return d;
}

const EXT_BY_MIME = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/webm': '.webm',
  'audio/amr': '.amr',
  'audio/3gpp': '.3gp',
};

function extFor(mimeType) {
  return EXT_BY_MIME[mimeType] || '.mp3';
}

// URL signée de lecture (1 h) — null si échec (fichier supprimé, bucket absent…)
async function signUrl(filePath) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL);
    if (error) {
      console.warn(`[call-recordings] createSignedUrl échouée (${filePath}):`, error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (e) {
    console.warn(`[call-recordings] createSignedUrl exception (${filePath}):`, e.message);
    return null;
  }
}

async function withSignedUrls(records) {
  return Promise.all(records.map(async (r) => ({ ...r, signedUrl: await signUrl(r.filePath) })));
}

// ========================================
// POST /api/call-recordings — upload d'un enregistrement (tout rôle connecté, typiquement APPELANT)
// multipart: file (audio) + phone, direction, startedAt, durationSec, orderId?
// ========================================
router.post('/', uploadAudio, async (req, res) => {
  try {
    if (!requireSupabaseStorage(res)) return;

    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ error: 'Fichier audio manquant (champ "file").' });
    }

    const phoneRaw = req.body.phone;
    if (!phoneRaw || !String(phoneRaw).trim()) {
      return res.status(400).json({ error: 'Le champ "phone" est requis.' });
    }
    const phone = normalizePhone(phoneRaw);
    if (phone.length < 8) {
      return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
    }

    const direction = String(req.body.direction || 'OUTGOING').toUpperCase() === 'INCOMING' ? 'INCOMING' : 'OUTGOING';

    let startedAt = new Date(req.body.startedAt);
    if (isNaN(startedAt.getTime())) startedAt = new Date();

    let durationSec = parseInt(req.body.durationSec, 10);
    if (isNaN(durationSec) || durationSec < 0) durationSec = 0;

    // Commande liée : explicite (orderId) ou match par téléphone (8 derniers chiffres, la plus récente)
    let orderId = parseInt(req.body.orderId, 10);
    if (!isNaN(orderId)) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, companyId: req.user.companyId },
        select: { id: true }
      });
      if (!order) {
        return res.status(400).json({ error: `Commande #${orderId} introuvable dans votre entreprise.` });
      }
    } else {
      orderId = null;
      const last8 = phone.slice(-8);
      const matched = await prisma.order.findFirst({
        where: {
          companyId: req.user.companyId,
          clientTelephone: { contains: last8 }
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });
      if (matched) orderId = matched.id;
    }

    // Chemin objet : {companyId}/{userId}/{startedAtMs}-{orderId|'na'}{ext}
    const ext = extFor(file.mimetype);
    const objectName = `${req.user.companyId}/${req.user.id}/${startedAt.getTime()}-${orderId || 'na'}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(objectName, file.buffer, {
        contentType: file.mimetype || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[call-recordings] Upload Supabase échoué:', uploadError);
      return res.status(500).json({ error: "Échec de l'upload du fichier audio." });
    }

    let recording;
    try {
      recording = await prisma.callRecording.create({
        data: {
          userId: req.user.id,
          orderId,
          phone,
          direction,
          startedAt,
          durationSec,
          filePath: objectName,
          mimeType: file.mimetype || 'audio/mpeg',
        },
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
          order: { select: { id: true, clientNom: true } }
        }
      });
    } catch (dbError) {
      // Nettoyage du fichier orphelin si l'insert DB échoue
      console.error('[call-recordings] Insert DB échoué, suppression du fichier:', dbError);
      await supabaseAdmin.storage.from(BUCKET).remove([objectName]).catch(() => {});
      return res.status(500).json({ error: "Échec de l'enregistrement en base." });
    }

    res.status(201).json({ recording });
  } catch (error) {
    console.error('Erreur upload enregistrement appel:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'enregistrement." });
  }
});

// ========================================
// GET /api/call-recordings — liste paginée (ADMIN, GESTIONNAIRE)
// Query: userId, orderId, date (YYYY-MM-DD), page (défaut 1) — 20/page
// ========================================
router.get('/', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    if (!requireSupabaseStorage(res)) return;

    const { userId, orderId, date } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = 20;

    const where = { user: { companyId: req.user.companyId } };
    if (userId) where.userId = parseInt(userId, 10);
    if (orderId) where.orderId = parseInt(orderId, 10);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Journée bornée en UTC (Abidjan = UTC)
      where.startedAt = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`)
      };
    }

    const [total, records] = await Promise.all([
      prisma.callRecording.count({ where }),
      prisma.callRecording.findMany({
        where,
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
          order: { select: { id: true, clientNom: true } }
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const recordings = await withSignedUrls(records);
    res.json({ total, page, pageSize, recordings });
  } catch (error) {
    console.error('Erreur liste enregistrements appels:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements.' });
  }
});

// ========================================
// GET /api/call-recordings/by-order/:orderId — enregistrements d'une commande
// ADMIN/GESTIONNAIRE : tous ; APPELANT : uniquement les siens
// ========================================
router.get('/by-order/:orderId', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    if (!requireSupabaseStorage(res)) return;

    const orderId = parseInt(req.params.orderId, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'orderId invalide.' });
    }

    const where = {
      orderId,
      user: { companyId: req.user.companyId }
    };
    // Un appelant ne voit que ses propres enregistrements
    if (req.user.role === 'APPELANT') {
      where.userId = req.user.id;
    }

    const records = await prisma.callRecording.findMany({
      where,
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: 100
    });

    const recordings = await withSignedUrls(records);
    res.json({ recordings });
  } catch (error) {
    console.error('Erreur enregistrements par commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements.' });
  }
});

// ========================================
// DELETE /api/call-recordings/:id — supprimer un enregistrement (ADMIN, GESTIONNAIRE)
// Supprime le fichier du bucket (erreur storage loguée, non bloquante) puis la ligne DB.
// ========================================
router.delete('/:id', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    if (!requireSupabaseStorage(res)) return;

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'id invalide.' });
    }

    const recording = await prisma.callRecording.findFirst({
      where: { id, user: { companyId: req.user.companyId } }
    });
    if (!recording) {
      return res.status(404).json({ error: 'Enregistrement non trouvé.' });
    }

    // Fichier d'abord (erreur loguée mais suppression DB quand même).
    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([recording.filePath]);
    if (removeError) {
      console.warn(`[call-recordings] Suppression storage échouée (${recording.filePath}):`, removeError.message);
    }

    await prisma.callRecording.delete({ where: { id } });

    logAudit(req, {
      action: 'CALL_RECORDING_DELETE',
      entityType: 'CallRecording',
      entityId: id,
      details: {
        recordingUserId: recording.userId,
        orderId: recording.orderId,
        phone: recording.phone,
        startedAt: recording.startedAt,
        storageRemoved: !removeError,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Erreur suppression enregistrement appel:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'enregistrement.' });
  }
});

export default router;

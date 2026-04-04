import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

function toLogKey(row) {
  return [
    row.userId,
    row.action,
    row.entityType || '',
    row.entityId || '',
    new Date(row.createdAt).toISOString(),
  ].join('|');
}

// GET /api/audit/logs - Journal d'audit complet
router.get('/logs', async (req, res) => {
  try {
    const {
      userId,
      action,
      startDate,
      endDate,
      ipAddress,
      page = 1,
      limit = 50,
    } = req.query;

    const where = { companyId: req.user.companyId };
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (ipAddress) where.ipAddress = { contains: ipAddress };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, nom: true, prenom: true, role: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Erreur audit logs:', error);
    res.status(500).json({ error: 'Erreur récupération audit.' });
  }
});

// GET /api/audit/devices - Analyse des devices par utilisateur (détection partage)
router.get('/devices', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where = { companyId: req.user.companyId };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const rawDevices = await prisma.auditLog.groupBy({
      by: ['userId', 'ipAddress', 'deviceFingerprint'],
      where,
      _count: { id: true },
      _max: { createdAt: true },
      _min: { createdAt: true },
    });

    const userIds = [...new Set(rawDevices.map((d) => d.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nom: true, prenom: true, role: true, email: true },
    });
    const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Regrouper par fingerprint pour détecter partage
    const fingerprintMap = {};
    for (const row of rawDevices) {
      const fp = row.deviceFingerprint || 'unknown';
      if (!fingerprintMap[fp]) fingerprintMap[fp] = new Set();
      fingerprintMap[fp].add(row.userId);
    }
    const sharedFingerprints = Object.entries(fingerprintMap)
      .filter(([, userSet]) => userSet.size > 1)
      .map(([fp, userSet]) => ({
        fingerprint: fp,
        users: [...userSet].map((uid) => usersMap[uid] || { id: uid }),
        count: userSet.size,
      }));

    // Regrouper par IP pour détecter partage
    const ipMap = {};
    for (const row of rawDevices) {
      const ip = row.ipAddress || 'unknown';
      if (!ipMap[ip]) ipMap[ip] = new Set();
      ipMap[ip].add(row.userId);
    }
    const sharedIPs = Object.entries(ipMap)
      .filter(([, userSet]) => userSet.size > 1)
      .map(([ip, userSet]) => ({
        ip,
        users: [...userSet].map((uid) => usersMap[uid] || { id: uid }),
        count: userSet.size,
      }));

    // Résumé par utilisateur
    const perUser = {};
    for (const row of rawDevices) {
      if (!perUser[row.userId]) {
        perUser[row.userId] = {
          user: usersMap[row.userId],
          ips: new Set(),
          fingerprints: new Set(),
          totalActions: 0,
          lastActivity: null,
        };
      }
      perUser[row.userId].ips.add(row.ipAddress || 'unknown');
      perUser[row.userId].fingerprints.add(row.deviceFingerprint || 'unknown');
      perUser[row.userId].totalActions += row._count.id;
      const maxDate = row._max.createdAt;
      if (!perUser[row.userId].lastActivity || maxDate > perUser[row.userId].lastActivity) {
        perUser[row.userId].lastActivity = maxDate;
      }
    }
    const userSummaries = Object.values(perUser).map((u) => ({
      ...u,
      ips: [...u.ips],
      fingerprints: [...u.fingerprints],
      ipCount: u.ips.size,
      fingerprintCount: u.fingerprints.size,
    }));

    res.json({
      userSummaries,
      sharedFingerprints,
      sharedIPs,
      alerts: {
        sharedDeviceCount: sharedFingerprints.length,
        sharedIPCount: sharedIPs.length,
      },
    });
  } catch (error) {
    console.error('Erreur audit devices:', error);
    res.status(500).json({ error: 'Erreur analyse devices.' });
  }
});

// GET /api/audit/user/:userId - Détail audit d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total, user] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId, companyId: req.user.companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where: { userId, companyId: req.user.companyId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nom: true, prenom: true, role: true, email: true },
      }),
    ]);

    res.json({ user, logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Erreur audit user:', error);
    res.status(500).json({ error: 'Erreur récupération audit utilisateur.' });
  }
});

// POST /api/audit/backfill - Importer les anciennes actions dans audit_logs
router.post('/backfill', async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [statusHistoryRows, attendanceRows] = await Promise.all([
      prisma.statusHistory.findMany({
        where: {
          order: { companyId },
        },
        include: {
          order: {
            select: {
              id: true,
              orderReference: true,
              clientNom: true,
              companyId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.attendance.findMany({
        where: {
          user: { companyId },
        },
        select: {
          id: true,
          userId: true,
          validation: true,
          ipAddress: true,
          deviceInfo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const wantedLogs = [];

    for (const h of statusHistoryRows) {
      wantedLogs.push({
        userId: h.changedBy,
        action: 'ORDER_STATUS_CHANGE',
        entityType: 'Order',
        entityId: h.orderId,
        details: JSON.stringify({
          oldStatus: h.oldStatus,
          newStatus: h.newStatus,
          orderId: h.orderId,
          orderRef: h.order?.orderReference || null,
          clientNom: h.order?.clientNom || null,
          source: 'status_history',
          statusHistoryId: h.id,
        }),
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        companyId,
        createdAt: h.createdAt,
      });
    }

    for (const a of attendanceRows) {
      wantedLogs.push({
        userId: a.userId,
        action: 'ATTENDANCE_MARK',
        entityType: 'Attendance',
        entityId: a.id,
        details: JSON.stringify({
          validation: a.validation,
          source: 'attendances',
          attendanceId: a.id,
        }),
        ipAddress: a.ipAddress || null,
        userAgent: a.deviceInfo || null,
        deviceFingerprint: null,
        companyId,
        createdAt: a.createdAt,
      });
    }

    if (!wantedLogs.length) {
      return res.json({
        success: true,
        inserted: 0,
        message: 'Aucune donnée historique à importer.',
      });
    }

    const minDate = wantedLogs[0].createdAt;
    const maxDate = wantedLogs[wantedLogs.length - 1].createdAt;

    const existing = await prisma.auditLog.findMany({
      where: {
        companyId,
        action: { in: ['ORDER_STATUS_CHANGE', 'ATTENDANCE_MARK'] },
        createdAt: { gte: minDate, lte: maxDate },
      },
      select: {
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    });

    const existingSet = new Set(existing.map(toLogKey));
    const toInsert = wantedLogs.filter((row) => !existingSet.has(toLogKey(row)));

    if (toInsert.length > 0) {
      await prisma.auditLog.createMany({ data: toInsert });
    }

    return res.json({
      success: true,
      inserted: toInsert.length,
      scanned: wantedLogs.length,
      message: `${toInsert.length} action(s) historique(s) importée(s).`,
    });
  } catch (error) {
    console.error('Erreur backfill audit:', error);
    return res.status(500).json({ error: 'Erreur import historique audit.' });
  }
});

export default router;

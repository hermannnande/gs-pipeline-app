import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

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

export default router;

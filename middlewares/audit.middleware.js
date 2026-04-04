import { prisma } from '../utils/prisma.js';
import crypto from 'crypto';

function extractIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function buildFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const lang = req.headers['accept-language'] || '';
  const enc = req.headers['accept-encoding'] || '';
  const raw = `${ua}|${lang}|${enc}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export async function logAudit(req, { action, entityType, entityId, details }) {
  try {
    if (!req.user?.id) return;

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: extractIp(req),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
        deviceFingerprint: buildFingerprint(req),
        companyId: req.user.companyId || 1,
      },
    });
  } catch (err) {
    console.error('[AUDIT] Erreur écriture audit_log:', err.message);
  }
}

export function auditAction(action, opts = {}) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = opts.entityIdFrom === 'params'
          ? parseInt(req.params.id, 10) || null
          : opts.entityIdFrom === 'body'
            ? body?.order?.id || body?.id || null
            : null;

        logAudit(req, {
          action,
          entityType: opts.entityType || null,
          entityId,
          details: opts.detailsFn ? opts.detailsFn(req, body) : null,
        });
      }
      return originalJson(body);
    };
    next();
  };
}

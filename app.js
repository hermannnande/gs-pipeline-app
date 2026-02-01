import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import statsRoutes from './routes/stats.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import productRoutes from './routes/product.routes.js';
import accountingRoutes from './routes/accounting.routes.js';
import expressRoutes from './routes/express.routes.js';
import stockRoutes from './routes/stock.routes.js';
import stockAnalysisRoutes from './routes/stock.analysis.routes.js';
import rdvRoutes from './routes/rdv.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import chatRoutes from './routes/chat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import { prisma, prismaInitError } from './utils/prisma.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export function createApp() {
  const app = express();

  // CORS (configurable via env)
  const extraOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedExact = new Set([
    'http://localhost:3000',
    'http://localhost:5000',
    'https://gs-pipeline-app.vercel.app',
    'https://obgestion.com',
    'https://www.obgestion.com',
    ...extraOrigins,
  ]);

  const allowedPatterns = [
    /https:\/\/gs-pipeline-app-.*\.vercel\.app$/,
    /https:\/\/.*\.vercel\.app$/,
  ];

  app.use(
    cors({
      origin: (origin, cb) => {
        // Postman / curl / SSR sans Origin
        if (!origin) return cb(null, true);
        if (allowedExact.has(origin)) return cb(null, true);
        if (allowedPatterns.some((r) => r.test(origin))) return cb(null, true);
        return cb(new Error('Origin non autorisée par CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
      credentials: true,
    })
  );

  // Limite utile pour uploads base64 / pièces jointes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Routes API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/delivery', deliveryRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/stock', stockRoutes);
  app.use('/api/stock-analysis', stockAnalysisRoutes);
  app.use('/api/accounting', accountingRoutes);
  app.use('/api/express', expressRoutes);
  app.use('/api/rdv', rdvRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/attendance', attendanceRoutes);

  // Routes de test
  app.get('/', (req, res) => {
    res.json({
      message: 'API GS Pipeline - Back-office e-commerce',
      version: '1.0.0',
      status: 'running',
    });
  });

  app.get('/api/health', async (req, res) => {
    let dbStatus = {
      configured: !!process.env.DATABASE_URL,
      reachable: false,
      error: null,
    };

    if (dbStatus.configured && !prismaInitError) {
      try {
        // Test minimal de connexion DB via Prisma
        // (permet d’identifier mauvais user/password/host/pooler)
        await prisma.$queryRaw`SELECT 1`;
        dbStatus.reachable = true;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        dbStatus.error = {
          name: e?.name || err.name,
          code: e?.code,
          message: (e?.message || err.message || '').slice(0, 220),
        };
      }
    }

    res.json({
      status: 'healthy',
      database: dbStatus,
      prisma: prismaInitError ? `error: ${prismaInitError.message}` : 'ok',
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
        chatBucket: process.env.SUPABASE_CHAT_BUCKET || 'chat',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
  });

  // Erreurs globales
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err?.stack || err);
    res.status(500).json({
      error: 'Erreur serveur',
      message: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  });

  return app;
}

const app = createApp();
export default app;


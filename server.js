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
import stockRoutes from './routes/stock.routes.js';
import { scheduleCleanupJob } from './jobs/cleanupPhotos.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://gs-pipeline-app.vercel.app',
    'https://obgestion.com',
    'https://www.obgestion.com',
    /https:\/\/gs-pipeline-app-.*\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  credentials: true,
}));

// Augmenter la limite de taille pour les requêtes (nécessaire pour upload photos base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/accounting', accountingRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API GS Pipeline - Back-office e-commerce',
    version: '1.0.0',
    status: 'running'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur serveur', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});


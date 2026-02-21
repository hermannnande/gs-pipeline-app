import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
import publicRoutes from './routes/public.routes.js';
import { scheduleCleanupJob } from './jobs/cleanupPhotos.js';
import { initializeChatSocket } from './utils/chatSocket.js';
import { setSocketServers } from './utils/socket.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Configuration Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://gs-pipeline-app.vercel.app',
      'https://obgestion.com',
      'https://www.obgestion.com',
      /https:\/\/gs-pipeline-app-.*\.vercel\.app$/
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Namespace dédié au chat (authentifié) pour ne pas casser les notifications existantes
const chatNamespace = io.of('/chat');

// Rendre io accessibles globalement (sans import circulaire)
setSocketServers(io, chatNamespace);

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
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/express', expressRoutes);
app.use('/api/rdv', rdvRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/public', publicRoutes);

// Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

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

// Gestion des connexions Socket.io pour notifications générales
io.on('connection', (socket) => {
  console.log(`✅ Client connecté: ${socket.id}`);
  
  // Rejoindre une room basée sur le rôle de l'utilisateur
  socket.on('join-role', (role) => {
    socket.join(role);
    console.log(`👤 Socket ${socket.id} a rejoint la room: ${role}`);
  });
  
  // Rejoindre une room spécifique à un utilisateur
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 Socket ${socket.id} a rejoint la room: user-${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Client déconnecté: ${socket.id}`);
  });
});

// Initialiser le système de chat Socket.io (namespace /chat)
initializeChatSocket(chatNamespace);

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket prêt pour les notifications en temps réel`);
  console.log(`💬 Chat en temps réel activé`);
});


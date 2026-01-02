import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chatIo } from '../utils/socket.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration multer pour upload fichiers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/chat');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Autoriser images et documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

router.use(authenticate);

// ========================================
// CONVERSATIONS
// ========================================

// GET /api/chat/conversations - Liste des conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true,
                actif: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Calculer les messages non lus pour chaque conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(p => p.userId === userId);
        const lastReadAt = participant?.lastReadAt || new Date(0);

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
            deletedAt: null
          }
        });

        return {
          ...conv,
          unreadCount,
          lastMessage: conv.messages[0] || null
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations.' });
  }
});

// POST /api/chat/conversations - Créer une conversation
router.post('/conversations', async (req, res) => {
  try {
    const { type, name, description, participantIds } = req.body;
    const userId = req.user.id;

    // Validation
    if (!type || !['PRIVATE', 'GROUP', 'BROADCAST'].includes(type)) {
      return res.status(400).json({ error: 'Type de conversation invalide.' });
    }

    if (type === 'BROADCAST' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les admins peuvent créer des broadcasts.' });
    }

    if (type === 'PRIVATE') {
      if (!participantIds || participantIds.length !== 1) {
        return res.status(400).json({ error: 'Une conversation privée nécessite exactement 1 destinataire.' });
      }

      // Vérifier si une conversation privée existe déjà entre ces 2 utilisateurs
      const existingConv = await prisma.conversation.findFirst({
        where: {
          type: 'PRIVATE',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: participantIds[0] } } }
          ]
        },
        include: {
          participants: {
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
          }
        }
      });

      if (existingConv) {
        return res.json({ conversation: existingConv, existed: true });
      }
    }

    if (type === 'GROUP' && !name) {
      return res.status(400).json({ error: 'Un nom est requis pour les groupes.' });
    }

    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        type,
        name,
        description,
        createdBy: userId,
        participants: {
          create: [
            // Créateur
            {
              userId,
              isAdmin: true
            },
            // Autres participants
            ...(participantIds || []).map(id => ({
              userId: parseInt(id),
              isAdmin: false
            }))
          ]
        }
      },
      include: {
        participants: {
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
        },
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la conversation.' });
  }
});

// GET /api/chat/conversations/:id - Détails d'une conversation
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true,
                actif: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur récupération conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la conversation.' });
  }
});

// PUT /api/chat/conversations/:id - Mettre à jour une conversation
router.put('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est admin de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId,
        isAdmin: true
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Vous devez être admin de cette conversation.' });
    }

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description
      },
      include: {
        participants: {
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
        }
      }
    });

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur mise à jour conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la conversation.' });
  }
});

// POST /api/chat/conversations/:id/participants - Ajouter un participant
router.post('/conversations/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const userId = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Liste d\'utilisateurs requise.' });
    }

    // Vérifier que l'utilisateur est admin de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId,
        isAdmin: true
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Vous devez être admin de cette conversation.' });
    }

    // Ajouter les participants
    await prisma.conversationParticipant.createMany({
      data: userIds.map(uid => ({
        conversationId: parseInt(id),
        userId: parseInt(uid),
        isAdmin: false
      })),
      skipDuplicates: true
    });

    // Message système
    await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: userId,
        type: 'SYSTEM',
        content: `${req.user.prenom} ${req.user.nom} a ajouté ${userIds.length} participant(s)`
      }
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        participants: {
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
        }
      }
    });

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur ajout participants:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout des participants.' });
  }
});

// DELETE /api/chat/conversations/:id/participants/:userId - Retirer un participant
router.delete('/conversations/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est admin OU qu'il se retire lui-même
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId,
        isAdmin: true
      }
    });

    if (!participant && parseInt(participantId) !== userId) {
      return res.status(403).json({ error: 'Permission refusée.' });
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId: parseInt(id),
          userId: parseInt(participantId)
        }
      }
    });

    // Message système
    const user = await prisma.user.findUnique({ where: { id: parseInt(participantId) } });
    await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: userId,
        type: 'SYSTEM',
        content: `${user.prenom} ${user.nom} a quitté la conversation`
      }
    });

    res.json({ message: 'Participant retiré avec succès.' });
  } catch (error) {
    console.error('Erreur retrait participant:', error);
    res.status(500).json({ error: 'Erreur lors du retrait du participant.' });
  }
});

// ========================================
// MESSAGES
// ========================================

// GET /api/chat/conversations/:id/messages - Messages d'une conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    const where = {
      conversationId: parseInt(id),
      deletedAt: null
    };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        },
        reads: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Marquer comme lu
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: parseInt(id),
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
  }
});

// POST /api/chat/conversations/:id/messages - Envoyer un message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: userId,
        content: content.trim(),
        type: 'TEXT',
        replyToId: replyToId ? parseInt(replyToId) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        }
      }
    });

    // Mettre à jour lastMessageAt de la conversation
    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() }
    });

    // Temps réel (namespace /chat) - utile si un client envoie via REST
    if (chatIo) {
      chatIo.to(`conversation:${id}`).emit('message:new', message);
    }

    res.json({ message });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message.' });
  }
});

// POST /api/chat/upload - Upload fichier/image
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileMimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('Erreur upload fichier:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier.' });
  }
});

// POST /api/chat/conversations/:id/messages/file - Envoyer un fichier/image
router.post('/conversations/:id/messages/file', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: parseInt(id),
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const messageType = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE';

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: userId,
        content: content || null,
        type: messageType,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileMimeType: req.file.mimetype
      },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      }
    });

    // Mettre à jour lastMessageAt
    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() }
    });

    // Temps réel (namespace /chat) - IMPORTANT pour les messages fichier/image
    if (chatIo) {
      chatIo.to(`conversation:${id}`).emit('message:new', message);
    }

    res.json({ message });
  } catch (error) {
    console.error('Erreur envoi fichier:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du fichier.' });
  }
});

// PUT /api/chat/messages/:id - Modifier un message
router.put('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé.' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres messages.' });
    }

    if (message.type !== 'TEXT') {
      return res.status(400).json({ error: 'Seuls les messages texte peuvent être modifiés.' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(id) },
      data: {
        content,
        isEdited: true
      },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      }
    });

    res.json({ message: updatedMessage });
  } catch (error) {
    console.error('Erreur modification message:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du message.' });
  }
});

// DELETE /api/chat/messages/:id - Supprimer un message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé.' });
    }

    // Seul l'auteur ou un admin peut supprimer
    if (message.senderId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission refusée.' });
    }

    // Soft delete
    await prisma.message.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        content: '[Message supprimé]'
      }
    });

    res.json({ message: 'Message supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du message.' });
  }
});

// POST /api/chat/messages/:id/reactions - Ajouter une réaction
router.post('/messages/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji requis.' });
    }

    const reaction = await prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId: parseInt(id),
          userId,
          emoji
        }
      },
      create: {
        messageId: parseInt(id),
        userId,
        emoji
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    res.json({ reaction });
  } catch (error) {
    console.error('Erreur ajout réaction:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la réaction.' });
  }
});

// DELETE /api/chat/messages/:id/reactions/:emoji - Retirer une réaction
router.delete('/messages/:id/reactions/:emoji', async (req, res) => {
  try {
    const { id, emoji } = req.params;
    const userId = req.user.id;

    await prisma.messageReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId: parseInt(id),
          userId,
          emoji: decodeURIComponent(emoji)
        }
      }
    });

    res.json({ message: 'Réaction retirée avec succès.' });
  } catch (error) {
    console.error('Erreur retrait réaction:', error);
    res.status(500).json({ error: 'Erreur lors du retrait de la réaction.' });
  }
});

// PUT /api/chat/messages/:id/pin - Épingler/désépingler un message
router.put('/messages/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) },
      include: { conversation: true }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé.' });
    }

    // Vérifier que l'utilisateur est admin de la conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId,
        isAdmin: true
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Seuls les admins peuvent épingler des messages.' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(id) },
      data: { isPinned }
    });

    res.json({ message: updatedMessage });
  } catch (error) {
    console.error('Erreur épinglage message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'épinglage du message.' });
  }
});

// ========================================
// RECHERCHE
// ========================================

// GET /api/chat/search - Rechercher dans les messages
router.get('/search', async (req, res) => {
  try {
    const { q, conversationId } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Requête de recherche trop courte (min 2 caractères).' });
    }

    const where = {
      content: {
        contains: q,
        mode: 'insensitive'
      },
      deletedAt: null,
      conversation: {
        participants: {
          some: {
            userId
          }
        }
      }
    };

    if (conversationId) {
      where.conversationId = parseInt(conversationId);
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        conversation: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json({ messages });
  } catch (error) {
    console.error('Erreur recherche messages:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche.' });
  }
});

// ========================================
// ADMIN - SUPERVISION
// ========================================

// GET /api/chat/admin/stats - Statistiques chat (Admin uniquement)
router.get('/admin/stats', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) dateFilter.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [
      totalConversations,
      totalMessages,
      totalUsers,
      activeUsers,
      messagesByType
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count({ where: { ...dateFilter, deletedAt: null } }),
      prisma.user.count({ where: { actif: true } }),
      prisma.conversationParticipant.groupBy({
        by: ['userId'],
        _count: true
      }),
      prisma.message.groupBy({
        by: ['type'],
        where: { ...dateFilter, deletedAt: null },
        _count: true
      })
    ]);

    // Top utilisateurs actifs
    const topUsers = await prisma.message.groupBy({
      by: ['senderId'],
      where: { ...dateFilter, deletedAt: null },
      _count: true,
      orderBy: {
        _count: {
          senderId: 'desc'
        }
      },
      take: 10
    });

    const topUsersWithDetails = await Promise.all(
      topUsers.map(async (u) => {
        const user = await prisma.user.findUnique({
          where: { id: u.senderId },
          select: { id: true, nom: true, prenom: true, role: true }
        });
        return {
          user,
          messageCount: u._count
        };
      })
    );

    res.json({
      stats: {
        totalConversations,
        totalMessages,
        totalUsers,
        activeUsersCount: activeUsers.length,
        messagesByType,
        topUsers: topUsersWithDetails
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats chat:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

// GET /api/chat/admin/conversations - Toutes les conversations (Admin)
router.get('/admin/conversations', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const conversations = await prisma.conversation.findMany({
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        participants: {
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
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Erreur récupération conversations admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations.' });
  }
});

// GET /api/chat/admin/messages - Tous les messages (Admin)
router.get('/admin/messages', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const { conversationId, limit = 100 } = req.query;

    const where = {};
    if (conversationId) {
      where.conversationId = parseInt(conversationId);
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        },
        conversation: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ messages });
  } catch (error) {
    console.error('Erreur récupération messages admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
  }
});

export default router;


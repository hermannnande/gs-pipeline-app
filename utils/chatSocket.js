import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Map pour suivre les utilisateurs en ligne
const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationId -> Set<userId>

export function initializeChatSocket(io) {
  // Middleware d'authentification Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          nom: true,
          prenom: true,
          role: true,
          actif: true
        }
      });

      if (!user || !user.actif) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`💬 Chat: User ${socket.user.prenom} ${socket.user.nom} connected (${socket.id})`);

    // Marquer l'utilisateur comme en ligne
    onlineUsers.set(userId, socket.id);
    
    // Rejoindre les rooms des conversations de l'utilisateur
    joinUserConversations(socket, userId);

    // Notifier les autres utilisateurs que cet utilisateur est en ligne
    socket.broadcast.emit('user:online', { userId });

    // ========================================
    // ÉVÉNEMENTS MESSAGES
    // ========================================

    // Envoyer un message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, replyToId, type = 'TEXT' } = data;

        // Vérifier que l'utilisateur fait partie de la conversation
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: parseInt(conversationId),
            userId
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'Vous ne faites pas partie de cette conversation.' });
          return;
        }

        // Créer le message
        const message = await prisma.message.create({
          data: {
            conversationId: parseInt(conversationId),
            senderId: userId,
            content,
            type,
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

        // Mettre à jour lastMessageAt
        await prisma.conversation.update({
          where: { id: parseInt(conversationId) },
          data: { lastMessageAt: new Date() }
        });

        // Envoyer le message à tous les participants de la conversation
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Arrêter l'indicateur "en train d'écrire" pour cet utilisateur
        stopTyping(socket, conversationId, userId);

      } catch (error) {
        console.error('Erreur envoi message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message.' });
      }
    });

    // Modifier un message
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await prisma.message.findUnique({
          where: { id: parseInt(messageId) }
        });

        if (!message) {
          socket.emit('error', { message: 'Message non trouvé.' });
          return;
        }

        if (message.senderId !== userId) {
          socket.emit('error', { message: 'Vous ne pouvez modifier que vos propres messages.' });
          return;
        }

        const updatedMessage = await prisma.message.update({
          where: { id: parseInt(messageId) },
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

        io.to(`conversation:${message.conversationId}`).emit('message:edited', updatedMessage);

      } catch (error) {
        console.error('Erreur modification message:', error);
        socket.emit('error', { message: 'Erreur lors de la modification du message.' });
      }
    });

    // Supprimer un message
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;

        const message = await prisma.message.findUnique({
          where: { id: parseInt(messageId) }
        });

        if (!message) {
          socket.emit('error', { message: 'Message non trouvé.' });
          return;
        }

        if (message.senderId !== userId && socket.user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Permission refusée.' });
          return;
        }

        await prisma.message.update({
          where: { id: parseInt(messageId) },
          data: {
            deletedAt: new Date(),
            content: '[Message supprimé]'
          }
        });

        io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
          messageId: parseInt(messageId),
          conversationId: message.conversationId
        });

      } catch (error) {
        console.error('Erreur suppression message:', error);
        socket.emit('error', { message: 'Erreur lors de la suppression du message.' });
      }
    });

    // Ajouter une réaction
    socket.on('reaction:add', async (data) => {
      try {
        const { messageId, emoji } = data;

        const reaction = await prisma.messageReaction.upsert({
          where: {
            messageId_userId_emoji: {
              messageId: parseInt(messageId),
              userId,
              emoji
            }
          },
          create: {
            messageId: parseInt(messageId),
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
            },
            message: {
              select: {
                conversationId: true
              }
            }
          }
        });

        io.to(`conversation:${reaction.message.conversationId}`).emit('reaction:added', {
          messageId: parseInt(messageId),
          reaction
        });

      } catch (error) {
        console.error('Erreur ajout réaction:', error);
        socket.emit('error', { message: 'Erreur lors de l\'ajout de la réaction.' });
      }
    });

    // Retirer une réaction
    socket.on('reaction:remove', async (data) => {
      try {
        const { messageId, emoji } = data;

        const reaction = await prisma.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId: parseInt(messageId),
              userId,
              emoji
            }
          },
          include: {
            message: {
              select: {
                conversationId: true
              }
            }
          }
        });

        if (!reaction) {
          return;
        }

        await prisma.messageReaction.delete({
          where: {
            messageId_userId_emoji: {
              messageId: parseInt(messageId),
              userId,
              emoji
            }
          }
        });

        io.to(`conversation:${reaction.message.conversationId}`).emit('reaction:removed', {
          messageId: parseInt(messageId),
          userId,
          emoji
        });

      } catch (error) {
        console.error('Erreur retrait réaction:', error);
        socket.emit('error', { message: 'Erreur lors du retrait de la réaction.' });
      }
    });

    // ========================================
    // INDICATEUR "EN TRAIN D'ÉCRIRE"
    // ========================================

    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      
      typingUsers.get(conversationId).add(userId);
      
      // Notifier les autres participants (sauf l'émetteur)
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        user: socket.user,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      stopTyping(socket, conversationId, userId);
    });

    // ========================================
    // MARQUER COMME LU
    // ========================================

    socket.on('conversation:read', async (data) => {
      try {
        const { conversationId } = data;

        await prisma.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId: parseInt(conversationId),
              userId
            }
          },
          data: {
            lastReadAt: new Date()
          }
        });

        // Notifier les autres participants
        socket.to(`conversation:${conversationId}`).emit('conversation:read', {
          conversationId: parseInt(conversationId),
          userId,
          readAt: new Date()
        });

      } catch (error) {
        console.error('Erreur marquer comme lu:', error);
      }
    });

    // ========================================
    // GESTION DES CONVERSATIONS
    // ========================================

    socket.on('conversation:join', (data) => {
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on('conversation:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // ========================================
    // DÉCONNEXION
    // ========================================

    socket.on('disconnect', () => {
      console.log(`💬 Chat: User ${socket.user.prenom} ${socket.user.nom} disconnected`);
      
      // Retirer l'utilisateur de la liste des utilisateurs en ligne
      onlineUsers.delete(userId);
      
      // Retirer de tous les indicateurs "en train d'écrire"
      typingUsers.forEach((users, conversationId) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`conversation:${conversationId}`).emit('typing:update', {
            conversationId,
            userId,
            isTyping: false
          });
        }
      });
      
      // Notifier les autres utilisateurs que cet utilisateur est hors ligne
      socket.broadcast.emit('user:offline', { userId });
    });
  });
}

// Helper: Rejoindre toutes les conversations de l'utilisateur
async function joinUserConversations(socket, userId) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      select: {
        id: true
      }
    });

    conversations.forEach(conv => {
      socket.join(`conversation:${conv.id}`);
    });

    console.log(`User ${userId} joined ${conversations.length} conversation rooms`);
  } catch (error) {
    console.error('Erreur rejoindre conversations:', error);
  }
}

// Helper: Arrêter l'indicateur "en train d'écrire"
function stopTyping(socket, conversationId, userId) {
  if (typingUsers.has(conversationId)) {
    typingUsers.get(conversationId).delete(userId);
    
    socket.to(`conversation:${conversationId}`).emit('typing:update', {
      conversationId,
      userId,
      isTyping: false
    });
  }
}

// Helper: Obtenir les utilisateurs en ligne
export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

// Helper: Vérifier si un utilisateur est en ligne
export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}


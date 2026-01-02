import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Créer la connexion Socket.io pour le chat
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('💬 Connecté au chat Socket.io');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('💬 Déconnecté du chat Socket.io');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('💬 Erreur Socket.io chat:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (conversationId: number, content: string, replyToId?: number) => {
    if (socketRef.current) {
      socketRef.current.emit('message:send', {
        conversationId,
        content,
        replyToId,
        type: 'TEXT'
      });
    }
  };

  const editMessage = (messageId: number, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:edit', { messageId, content });
    }
  };

  const deleteMessage = (messageId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('message:delete', { messageId });
    }
  };

  const addReaction = (messageId: number, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('reaction:add', { messageId, emoji });
    }
  };

  const removeReaction = (messageId: number, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('reaction:remove', { messageId, emoji });
    }
  };

  const startTyping = (conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  };

  const stopTyping = (conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  };

  const markAsRead = (conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('conversation:read', { conversationId });
    }
  };

  const joinConversation = (conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('conversation:join', { conversationId });
    }
  };

  const leaveConversation = (conversationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('conversation:leave', { conversationId });
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    markAsRead,
    joinConversation,
    leaveConversation,
    on,
    off
  };
}


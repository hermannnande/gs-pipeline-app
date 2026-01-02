import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import { useAuthStore } from '../../stores/authStore';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';

interface MessageAreaProps {
  conversationId: number;
  chatSocket: any;
}

export default function MessageArea({ conversationId, chatSocket }: MessageAreaProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  // Récupérer la conversation
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
    enabled: !!conversationId
  });

  const conversation = conversationData?.conversation;

  // Récupérer les messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !!conversationId
  });

  const messages = messagesData?.messages || [];

  // Rejoindre la conversation Socket.io
  useEffect(() => {
    if (conversationId && chatSocket.socket) {
      chatSocket.joinConversation(conversationId);
      chatSocket.markAsRead(conversationId);

      return () => {
        chatSocket.leaveConversation(conversationId);
      };
    }
  }, [conversationId, chatSocket]);

  // Écouter l'indicateur "en train d'écrire"
  useEffect(() => {
    if (!chatSocket.socket) return;

    const handleTypingUpdate = (data: any) => {
      if (data.conversationId !== conversationId) return;
      
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    };

    chatSocket.on('typing:update', handleTypingUpdate);

    return () => {
      chatSocket.off('typing:update', handleTypingUpdate);
    };
  }, [chatSocket, conversationId]);

  // Scroller vers le bas automatiquement
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marquer comme lu quand on voit les messages
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      chatSocket.markAsRead(conversationId);
    }
  }, [conversationId, messages, chatSocket]);

  const getConversationTitle = () => {
    if (!conversation) return 'Chargement...';

    if (conversation.type === 'PRIVATE') {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.userId !== user?.id
      );
      if (otherParticipant) {
        return `${otherParticipant.user.prenom} ${otherParticipant.user.nom}`;
      }
      return 'Conversation privée';
    }

    return conversation.name || 'Conversation';
  };

  const getParticipantsCount = () => {
    if (!conversation) return 0;
    return conversation.participants?.length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getConversationTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              {getParticipantsCount()} participant{getParticipantsCount() > 1 ? 's' : ''}
            </p>
          </div>
          {conversation?.type === 'GROUP' && (
            <button className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              ⚙️ Gérer
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Soyez le premier à envoyer un message !</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message: any) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                chatSocket={chatSocket}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Indicateur "en train d'écrire" */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-2 bg-gray-100 rounded-lg w-fit">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.map((u) => `${u.user.prenom}`).join(', ')} {typingUsers.length > 1 ? 'écrivent' : 'écrit'}...
            </span>
          </div>
        )}
      </div>

      {/* Input message */}
      <MessageInput
        conversationId={conversationId}
        chatSocket={chatSocket}
      />
    </div>
  );
}


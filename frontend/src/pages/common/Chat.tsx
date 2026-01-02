import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import ConversationList from '../../components/chat/ConversationList';
import MessageArea from '../../components/chat/MessageArea';
import NewConversationModal from '../../components/chat/NewConversationModal';
import { useAuthStore } from '../../stores/authStore';

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const chatSocket = useChatSocket();

  // Récupérer les conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchOnWindowFocus: true
  });

  const conversations = conversationsData?.conversations || [];
  const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!chatSocket.socket) return;

    const handleNewMessage = (message: any) => {
      // Mettre à jour la liste des conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Si la conversation est ouverte, ajouter le message
      if (selectedConversationId === message.conversationId) {
        queryClient.setQueryData(
          ['messages', message.conversationId],
          (old: any) => {
            if (!old) return { messages: [message] };
            const messageExists = old.messages.some((m: any) => m.id === message.id);
            if (messageExists) return old;
            return { messages: [...old.messages, message] };
          }
        );
        
        // Marquer comme lu
        chatSocket.markAsRead(message.conversationId);
      }
    };

    const handleMessageEdited = (message: any) => {
      queryClient.setQueryData(
        ['messages', message.conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            messages: old.messages.map((m: any) => 
              m.id === message.id ? message : m
            )
          };
        }
      );
    };

    const handleMessageDeleted = (data: any) => {
      queryClient.setQueryData(
        ['messages', data.conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            messages: old.messages.filter((m: any) => m.id !== data.messageId)
          };
        }
      );
    };

    const handleReactionAdded = (data: any) => {
      queryClient.setQueryData(
        ['messages', data.reaction.message.conversationId],
        (old: any) => {
          if (!old) return old;
          return {
            messages: old.messages.map((m: any) => {
              if (m.id === data.messageId) {
                const reactions = m.reactions || [];
                return { ...m, reactions: [...reactions, data.reaction] };
              }
              return m;
            })
          };
        }
      );
    };

    const handleReactionRemoved = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    };

    chatSocket.on('message:new', handleNewMessage);
    chatSocket.on('message:edited', handleMessageEdited);
    chatSocket.on('message:deleted', handleMessageDeleted);
    chatSocket.on('reaction:added', handleReactionAdded);
    chatSocket.on('reaction:removed', handleReactionRemoved);

    return () => {
      chatSocket.off('message:new', handleNewMessage);
      chatSocket.off('message:edited', handleMessageEdited);
      chatSocket.off('message:deleted', handleMessageDeleted);
      chatSocket.off('reaction:added', handleReactionAdded);
      chatSocket.off('reaction:removed', handleReactionRemoved);
    };
  }, [chatSocket, queryClient, selectedConversationId]);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* Liste des conversations - Sidebar gauche */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">💬 Chat</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Nouvelle conversation
          </button>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          isLoading={isLoading}
        />
      </div>

      {/* Zone de messages - Partie principale */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <MessageArea
            conversationId={selectedConversationId}
            chatSocket={chatSocket}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Bienvenue sur le Chat Entreprise
              </h2>
              <p className="text-gray-600">
                Sélectionnez une conversation ou créez-en une nouvelle pour commencer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle conversation */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreated={(conversation) => {
            setSelectedConversationId(conversation.id);
            setShowNewConversation(false);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }}
        />
      )}
    </div>
  );
}


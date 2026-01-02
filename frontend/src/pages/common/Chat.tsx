import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import ConversationList from '../../components/chat/ConversationList';
import MessageArea from '../../components/chat/MessageArea';
import NewConversationModal from '../../components/chat/NewConversationModal';

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchConversation, setSearchConversation] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRIVATE' | 'GROUP' | 'BROADCAST'>('ALL');
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [typingByConversation, setTypingByConversation] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const chatSocket = useChatSocket();

  // Récupérer les conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchOnWindowFocus: true
  });

  const conversations = conversationsData?.conversations || [];
  const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);

  const filteredConversations = conversations
    .filter((conv: any) => {
      if (activeTab === 'ALL') return true;
      return conv.type === activeTab;
    })
    .filter((conv: any) => {
    const q = searchConversation.trim().toLowerCase();
    if (!q) return true;
    const name = (conv.type === 'PRIVATE'
      ? (conv.participants?.map((p: any) => `${p.user?.prenom || ''} ${p.user?.nom || ''}`.trim()).join(' ') || '')
      : (conv.name || '')
    ).toLowerCase();
    return name.includes(q);
  });

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!chatSocket.socket || !chatSocket.isConnected) return;

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
  }, [chatSocket.socket, chatSocket.isConnected, queryClient, selectedConversationId]);

  // Statut en ligne/hors ligne + typing preview (style WhatsApp)
  useEffect(() => {
    if (!chatSocket.socket || !chatSocket.isConnected) return;

    const handleOnline = (data: any) => {
      const id = Number(data?.userId);
      if (!id) return;
      setOnlineUserIds((prev) => new Set([...Array.from(prev), id]));
    };

    const handleOffline = (data: any) => {
      const id = Number(data?.userId);
      if (!id) return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    const handleTypingUpdate = (data: any) => {
      const convId = Number(data?.conversationId);
      const isTyping = !!data?.isTyping;
      const prenom = data?.user?.prenom || '';
      if (!convId) return;

      setTypingByConversation((prev) => {
        const next = { ...prev };
        if (isTyping) next[convId] = prenom ? `${prenom} écrit...` : 'Écrit...';
        else delete next[convId];
        return next;
      });
    };

    chatSocket.on('user:online', handleOnline);
    chatSocket.on('user:offline', handleOffline);
    chatSocket.on('typing:update', handleTypingUpdate);

    return () => {
      chatSocket.off('user:online', handleOnline);
      chatSocket.off('user:offline', handleOffline);
      chatSocket.off('typing:update', handleTypingUpdate);
    };
  }, [chatSocket.socket, chatSocket.isConnected]);

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
          {/* Onglets style WhatsApp */}
          <div className="mb-3 flex gap-2">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'PRIVATE', label: 'Privé' },
              { id: 'GROUP', label: 'Groupes' },
              { id: 'BROADCAST', label: 'Annonces' },
            ].map((t: any) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeTab === t.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <input
              value={searchConversation}
              onChange={(e) => setSearchConversation(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Nouvelle conversation
          </button>
          <div className="mt-2 text-xs text-gray-500">
            Statut: {chatSocket.isConnected ? '🟢 Connecté' : '🟠 Connexion...'}
          </div>
        </div>

        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          isLoading={isLoading}
          onlineUserIds={onlineUserIds}
          typingByConversation={typingByConversation}
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


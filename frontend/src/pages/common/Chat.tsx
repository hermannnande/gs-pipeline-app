import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import ConversationList from '../../components/chat/ConversationList';
import MessageArea from '../../components/chat/MessageArea';
import NewConversationModal from '../../components/chat/NewConversationModal';

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchConversation, setSearchConversation] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRIVATE' | 'GROUP' | 'BROADCAST'>('ALL');
  const queryClient = useQueryClient();

  // Récupérer les conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchOnWindowFocus: true,
    enabled: false
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

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* Liste des conversations - Sidebar gauche */}
      <div className={`
        ${selectedConversationId ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 bg-white border-r border-gray-200 flex-col
      `}>
        <div className="p-3 md:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">💬 Chat</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          {/* Onglets style WhatsApp */}
          <div className="mb-3 flex gap-1 md:gap-2 overflow-x-auto">
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
              placeholder="Rechercher..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full bg-indigo-600 text-white px-3 md:px-4 py-2 text-sm md:text-base rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span className="hidden sm:inline">Nouvelle conversation</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
          <div className="mt-2 text-xs text-gray-500">Mode: rafraîchissement auto (sans WebSocket)</div>
        </div>

        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          isLoading={isLoading}
        />
      </div>

      {/* Zone de messages - Partie principale */}
      <div className={`
        ${selectedConversationId ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col
      `}>
        {selectedConversationId ? (
          <MessageArea
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                Bienvenue sur le Chat Entreprise
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
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


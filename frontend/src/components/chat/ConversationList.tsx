import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '../../stores/authStore';

interface ConversationListProps {
  conversations: any[];
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading
}: ConversationListProps) {
  const { user } = useAuthStore();

  const getConversationName = (conversation: any) => {
    if (conversation.type === 'PRIVATE') {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.userId !== user?.id
      );
      if (otherParticipant) {
        return `${otherParticipant.user.prenom} ${otherParticipant.user.nom}`;
      }
      return 'Conversation privée';
    }
    if (conversation.type === 'BROADCAST') {
      return `📢 ${conversation.name || 'Annonce'}`;
    }
    return `👥 ${conversation.name || 'Groupe'}`;
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === 'PRIVATE') {
      return '👤';
    }
    if (conversation.type === 'BROADCAST') {
      return '📢';
    }
    return '👥';
  };

  const getLastMessagePreview = (conversation: any) => {
    const lastMessage = conversation.lastMessage;
    if (!lastMessage) return 'Aucun message';

    if (lastMessage.type === 'IMAGE') return '📷 Image';
    if (lastMessage.type === 'FILE') return '📎 Fichier';
    if (lastMessage.type === 'SYSTEM') return '⚙️ ' + lastMessage.content;

    const content = lastMessage.content || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>Aucune conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
            selectedConversationId === conversation.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="text-3xl flex-shrink-0">
              {getConversationAvatar(conversation)}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {getConversationName(conversation)}
                </h3>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate">
                  {getLastMessagePreview(conversation)}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}


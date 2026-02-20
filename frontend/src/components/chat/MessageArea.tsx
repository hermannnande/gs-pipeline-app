import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { chatApi } from '../../lib/chatApi';
import { useAuthStore } from '@/store/authStore';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';

interface MessageAreaProps {
  conversationId: number;
  onBack?: () => void;
}

export default function MessageArea({ conversationId, onBack }: MessageAreaProps) {
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMsgBanner, setShowNewMsgBanner] = useState(false);

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
    enabled: !!conversationId,
  });

  const messages = messagesData?.messages || [];

  // NOTE: Sans WebSocket, l'indicateur "typing" est désactivé.

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowNewMsgBanner(false);
  };

  // Scroll intelligent (style WhatsApp):
  // - si l'utilisateur est en bas -> auto scroll
  // - sinon -> afficher un bouton "Nouveaux messages"
  useEffect(() => {
    if (messages.length === 0) return;
    if (isAtBottom) {
      scrollToBottom('smooth');
    } else {
      setShowNewMsgBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Gestion du scroll utilisateur
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120; // px
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distanceToBottom < threshold;
      setIsAtBottom(atBottom);
      if (atBottom) setShowNewMsgBanner(false);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Init
    onScroll();

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [conversationId]);

  // NOTE: Le backend marque déjà "lu" au moment du GET /messages.

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
        <div className="flex items-center gap-3">
          {/* Bouton retour sur mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
          
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getConversationTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {getParticipantsCount()} participant{getParticipantsCount() > 1 ? 's' : ''}
              </p>
            </div>
            {conversation?.type === 'GROUP' && (
              <button className="hidden md:block text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                ⚙️ Gérer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative">
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
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Banner nouveaux messages (quand l'utilisateur lit plus haut) */}
        {showNewMsgBanner && (
          <div className="sticky bottom-3 w-full flex justify-center pointer-events-none">
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="pointer-events-auto bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
              ⬇️ Nouveaux messages
            </button>
          </div>
        )}

      </div>

      {/* Input message */}
      <MessageInput
        conversationId={conversationId}
      />
    </div>
  );
}


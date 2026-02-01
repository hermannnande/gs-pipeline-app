import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/chatApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '✅'];

  const handleReaction = async (emoji: string) => {
    const existingReaction = message.reactions?.find(
      (r: any) => r.userId === user?.id && r.emoji === emoji
    );

    try {
      if (existingReaction) {
        await chatApi.removeReaction(message.id, emoji);
      } else {
        await chatApi.addReaction(message.id, emoji);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    } catch (e) {
      // silencieux (l'UI reste utilisable)
      console.error('Erreur reaction:', e);
    }
    setShowReactions(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await chatApi.deleteMessage(message.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    } catch (e) {
      console.error('Erreur suppression message:', e);
    }
    setShowOptions(false);
  };

  const groupReactions = () => {
    const grouped: { [key: string]: any[] } = {};
    (message.reactions || []).forEach((r: any) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r);
    });
    return grouped;
  };

  const reactionGroups = groupReactions();
  const resolveFileUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  if (message.type === 'SYSTEM') {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Nom de l'expéditeur (si pas soi-même) */}
        {!isOwn && (
          <span className="text-xs text-gray-500 px-2">
            {message.sender?.prenom} {message.sender?.nom}
          </span>
        )}

        {/* Bulle du message */}
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
          } shadow-sm`}
          onMouseEnter={() => setShowOptions(true)}
          onMouseLeave={() => setShowOptions(false)}
        >
          {/* Répondre à */}
          {message.replyTo && (
            <div className={`text-xs mb-2 pb-2 border-b ${isOwn ? 'border-indigo-400' : 'border-gray-200'}`}>
              <div className="font-semibold">
                {message.replyTo.sender?.prenom}
              </div>
              <div className={isOwn ? 'text-indigo-100' : 'text-gray-500'}>
                {message.replyTo.content?.substring(0, 50)}...
              </div>
            </div>
          )}

          {/* Contenu */}
          {message.type === 'TEXT' && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {message.type === 'IMAGE' && (
            <div>
              <img
                src={resolveFileUrl(message.fileUrl)}
                alt="Image"
                className="max-w-full rounded-lg mb-2"
              />
              {message.content && (
                <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}

          {message.type === 'FILE' && (
            <div className="flex items-center gap-3">
              <div className="text-3xl">📎</div>
              <div className="flex-1">
                <a
                  href={resolveFileUrl(message.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold underline ${isOwn ? 'text-white' : 'text-indigo-600'}`}
                >
                  {message.fileName}
                </a>
                <div className={`text-xs ${isOwn ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {(message.fileSize / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          )}

          {message.isEdited && (
            <span className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
              {' '}(modifié)
            </span>
          )}

          {/* Options (apparaît au survol) */}
          {showOptions && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-1 px-2`}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-100 text-sm"
                title="Réagir"
              >
                😊
              </button>
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="bg-white border border-gray-300 rounded-full p-1 hover:bg-red-100 text-sm"
                  title="Supprimer"
                >
                  🗑️
                </button>
              )}
            </div>
          )}

          {/* Sélecteur d'emojis */}
          {showReactions && (
            <div className={`absolute ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-8 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1 z-10`}>
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Réactions existantes */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 px-2">
            {Object.entries(reactionGroups).map(([emoji, reactions]: [string, any[]]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                  reactions.some((r) => r.userId === user?.id)
                    ? 'bg-indigo-100 border-indigo-300'
                    : 'bg-gray-100 border-gray-300'
                } hover:bg-indigo-50 transition-colors`}
                title={reactions.map((r) => `${r.user?.prenom}`).join(', ')}
              >
                <span>{emoji}</span>
                <span className="font-semibold">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Heure */}
        <span className={`text-xs text-gray-400 px-2`}>
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
            locale: fr
          })}
        </span>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ChatSupervision() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  // Calculer les dates
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedPeriod) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return {
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();

  // Récupérer les statistiques
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['chatStats', dateRange],
    queryFn: () => chatApi.getAdminStats(dateRange.startDate, dateRange.endDate)
  });

  const stats = statsData?.stats;

  // Récupérer toutes les conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['adminConversations'],
    queryFn: chatApi.getAdminConversations
  });

  const conversations = conversationsData?.conversations || [];

  // Récupérer les messages (optionnel, pour une conversation spécifique)
  const { data: messagesData } = useQuery({
    queryKey: ['adminMessages', selectedConversation],
    queryFn: () => chatApi.getAdminMessages(selectedConversation || undefined, 100),
    enabled: !!selectedConversation
  });

  const messages = messagesData?.messages || [];

  const getConversationTypeBadge = (type: string) => {
    switch (type) {
      case 'PRIVATE':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">👤 Privée</span>;
      case 'GROUP':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">👥 Groupe</span>;
      case 'BROADCAST':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">📢 Annonce</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{type}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Supervision Chat</h1>
          <p className="text-gray-600 mt-1">Surveillance et modération du système de chat</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Conversations</h3>
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalConversations || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Messages</h3>
              <span className="text-3xl">📨</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalMessages || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Utilisateurs actifs</h3>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.activeUsersCount || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Total utilisateurs</h3>
              <span className="text-3xl">👤</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      )}

      {/* Top utilisateurs actifs */}
      {stats?.topUsers && stats.topUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">🏆 Top utilisateurs actifs</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.topUsers.map((item: any, index: number) => (
                <div key={item.user?.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {item.user?.prenom} {item.user?.nom}
                    </div>
                    <div className="text-sm text-gray-600">{item.user?.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{item.messageCount}</div>
                    <div className="text-xs text-gray-500">messages</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">📋 Toutes les conversations</h2>
        </div>
        <div className="p-6">
          {conversationsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv: any) => (
                <div
                  key={conv.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(selectedConversation === conv.id ? null : conv.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getConversationTypeBadge(conv.type)}
                      <h3 className="font-semibold text-gray-900">
                        {conv.name || `Conversation #${conv.id}`}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      {conv._count?.messages || 0} message{conv._count?.messages > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👥 {conv.participants?.length || 0} participant{conv.participants?.length > 1 ? 's' : ''}</span>
                    <span>📅 {format(new Date(conv.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                    <span>👤 Créé par: {conv.creator?.prenom} {conv.creator?.nom}</span>
                  </div>

                  {/* Messages de cette conversation (si sélectionné) */}
                  {selectedConversation === conv.id && messages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold mb-3 text-gray-900">Messages récents:</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {messages.slice(0, 20).map((msg: any) => (
                          <div key={msg.id} className="p-3 bg-white border border-gray-200 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {msg.sender?.prenom} {msg.sender?.nom}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {msg.type === 'IMAGE' && '📷 Image'}
                              {msg.type === 'FILE' && `📎 ${msg.fileName}`}
                              {msg.type === 'TEXT' && msg.content}
                              {msg.type === 'SYSTEM' && `⚙️ ${msg.content}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


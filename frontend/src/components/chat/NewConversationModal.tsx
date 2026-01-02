import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface NewConversationModalProps {
  onClose: () => void;
  onCreated: (conversation: any) => void;
}

export default function NewConversationModal({ onClose, onCreated }: NewConversationModalProps) {
  const { user } = useAuthStore();
  const [conversationType, setConversationType] = useState<'PRIVATE' | 'GROUP' | 'BROADCAST'>('PRIVATE');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Récupérer tous les utilisateurs
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const users = usersData?.users?.filter((u: any) => u.id !== user?.id && u.actif) || [];

  // Mutation pour créer la conversation
  const createMutation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (data) => {
      onCreated(data.conversation);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erreur lors de la création de la conversation');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (conversationType === 'PRIVATE' && selectedUsers.length !== 1) {
      alert('Veuillez sélectionner exactement un utilisateur pour une conversation privée');
      return;
    }

    if (conversationType === 'GROUP' && !groupName.trim()) {
      alert('Veuillez donner un nom au groupe');
      return;
    }

    if (conversationType === 'GROUP' && selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    if (conversationType === 'BROADCAST' && user?.role !== 'ADMIN') {
      alert('Seuls les administrateurs peuvent créer des annonces');
      return;
    }

    createMutation.mutate({
      type: conversationType,
      name: conversationType === 'GROUP' || conversationType === 'BROADCAST' ? groupName : undefined,
      description: conversationType === 'GROUP' ? groupDescription : undefined,
      participantIds: selectedUsers
    });
  };

  const toggleUser = (userId: number) => {
    if (conversationType === 'PRIVATE') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle conversation</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Type de conversation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de conversation
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setConversationType('PRIVATE')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    conversationType === 'PRIVATE'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold">Privée</div>
                  <div className="text-xs text-gray-600">1-1</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConversationType('GROUP')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    conversationType === 'GROUP'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-semibold">Groupe</div>
                  <div className="text-xs text-gray-600">Plusieurs</div>
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setConversationType('BROADCAST')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      conversationType === 'BROADCAST'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">📢</div>
                    <div className="font-semibold">Annonce</div>
                    <div className="text-xs text-gray-600">Admin</div>
                  </button>
                )}
              </div>
            </div>

            {/* Nom du groupe (si GROUP ou BROADCAST) */}
            {(conversationType === 'GROUP' || conversationType === 'BROADCAST') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom {conversationType === 'GROUP' ? 'du groupe' : "de l'annonce"}
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={conversationType === 'GROUP' ? 'Équipe Livraison' : 'Annonce importante'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {/* Description (si GROUP) */}
            {conversationType === 'GROUP' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Description du groupe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            )}

            {/* Sélection des utilisateurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {conversationType === 'PRIVATE'
                  ? 'Sélectionner un utilisateur'
                  : 'Sélectionner les participants'}
              </label>
              {isLoading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {users.map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`w-full p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                        selectedUsers.includes(u.id) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {selectedUsers.includes(u.id) ? (
                          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">
                          {u.prenom} {u.nom}
                        </div>
                        <div className="text-sm text-gray-600">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUsers.length > 0 && conversationType !== 'PRIVATE' && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedUsers.length} participant{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


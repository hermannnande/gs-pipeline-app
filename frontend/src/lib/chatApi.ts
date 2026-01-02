import { api } from './api';

export const chatApi = {
  // Conversations
  getConversations: async () => {
    const { data } = await api.get('/chat/conversations');
    return data;
  },

  getConversation: async (id: number) => {
    const { data } = await api.get(`/chat/conversations/${id}`);
    return data;
  },

  createConversation: async (conversationData: {
    type: 'PRIVATE' | 'GROUP' | 'BROADCAST';
    name?: string;
    description?: string;
    participantIds: number[];
  }) => {
    const { data } = await api.post('/chat/conversations', conversationData);
    return data;
  },

  updateConversation: async (id: number, updateData: {
    name?: string;
    description?: string;
  }) => {
    const { data } = await api.put(`/chat/conversations/${id}`, updateData);
    return data;
  },

  addParticipants: async (id: number, userIds: number[]) => {
    const { data } = await api.post(`/chat/conversations/${id}/participants`, { userIds });
    return data;
  },

  removeParticipant: async (conversationId: number, userId: number) => {
    const { data } = await api.delete(`/chat/conversations/${conversationId}/participants/${userId}`);
    return data;
  },

  // Messages
  getMessages: async (conversationId: number, before?: string, limit?: number) => {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { before, limit }
    });
    return data;
  },

  sendMessage: async (conversationId: number, messageData: {
    content: string;
    replyToId?: number;
  }) => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, messageData);
    return data;
  },

  sendFile: async (conversationId: number, file: File, content?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (content) formData.append('content', content);

    const { data } = await api.post(`/chat/conversations/${conversationId}/messages/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },

  updateMessage: async (messageId: number, content: string) => {
    const { data } = await api.put(`/chat/messages/${messageId}`, { content });
    return data;
  },

  deleteMessage: async (messageId: number) => {
    const { data } = await api.delete(`/chat/messages/${messageId}`);
    return data;
  },

  // Réactions
  addReaction: async (messageId: number, emoji: string) => {
    const { data } = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    return data;
  },

  removeReaction: async (messageId: number, emoji: string) => {
    const { data } = await api.delete(`/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return data;
  },

  pinMessage: async (messageId: number, isPinned: boolean) => {
    const { data } = await api.put(`/chat/messages/${messageId}/pin`, { isPinned });
    return data;
  },

  // Recherche
  searchMessages: async (query: string, conversationId?: number) => {
    const { data } = await api.get('/chat/search', {
      params: { q: query, conversationId }
    });
    return data;
  },

  // Admin
  getAdminStats: async (startDate?: string, endDate?: string) => {
    const { data } = await api.get('/chat/admin/stats', {
      params: { startDate, endDate }
    });
    return data;
  },

  getAdminConversations: async () => {
    const { data } = await api.get('/chat/admin/conversations');
    return data;
  },

  getAdminMessages: async (conversationId?: number, limit?: number) => {
    const { data } = await api.get('/chat/admin/messages', {
      params: { conversationId, limit }
    });
    return data;
  }
};


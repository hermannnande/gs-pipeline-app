import axios from 'axios';
import type { AuthResponse, LoginCredentials, User, Order, DeliveryList } from '@/types';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Configuration axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: { role?: string; actif?: boolean }) => {
    const { data } = await api.get('/users', { params });
    return data;
  },

  create: async (userData: Partial<User> & { password: string }) => {
    const { data } = await api.post('/users', userData);
    return data;
  },

  update: async (id: number, userData: Partial<User>) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  create: async (orderData: Partial<Order>) => {
    const { data } = await api.post('/orders', orderData);
    return data;
  },

  update: async (id: number, orderData: Partial<Order>) => {
    const { data } = await api.put(`/orders/${id}`, orderData);
    return data;
  },

  updateStatus: async (id: number, status: string, note?: string) => {
    const { data } = await api.put(`/orders/${id}/status`, { status, note });
    return data;
  },

  renvoyerAppel: async (id: number, motif?: string) => {
    const { data } = await api.post(`/orders/${id}/renvoyer-appel`, { motif });
    return data;
  },

  marquerAppel: async (id: number) => {
    const { data } = await api.post(`/orders/${id}/marquer-appel`);
    return data;
  },

  togglePriorite: async (id: number) => {
    const { data } = await api.post(`/orders/${id}/toggle-priorite`);
    return data;
  },

  updateQuantite: async (id: number, quantite: number) => {
    const { data } = await api.put(`/orders/${id}/quantite`, { quantite });
    return data;
  },
  updateAdresse: async (id: number, clientVille: string, clientCommune?: string, clientAdresse?: string) => {
    const { data } = await api.put(`/orders/${id}/adresse`, { clientVille, clientCommune, clientAdresse });
    return data;
  },

  marquerAttentePaiement: async (id: number, note?: string) => {
    const { data } = await api.post(`/orders/${id}/attente-paiement`, { note });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/orders/${id}`);
    return data;
  },

  bulkDelete: async (orderIds: number[]) => {
    const { data } = await api.post('/orders/bulk-delete', { orderIds });
    return data;
  },

  // EXPÉDITION & EXPRESS
  createExpedition: async (orderId: number, expeditionData: any) => {
    const { data } = await api.post(`/orders/${orderId}/expedition`, expeditionData);
    return data;
  },

  createExpress: async (orderId: number, expressData: any) => {
    const { data } = await api.post(`/orders/${orderId}/express`, expressData);
    return data;
  },

  deliverExpedition: async (orderId: number, codeExpedition?: string, note?: string, photoRecuExpedition?: string) => {
    const { data } = await api.post(`/orders/${orderId}/expedition/livrer`, { codeExpedition, note, photoRecuExpedition });
    return data;
  },

  markExpressArrived: async (orderId: number) => {
    const { data } = await api.put(`/orders/${orderId}/express/arrive`);
    return data;
  },

  notifyExpressClient: async (orderId: number) => {
    const { data } = await api.post(`/orders/${orderId}/express/notifier`);
    return data;
  },

  finalizeExpress: async (orderId: number, finalData: any) => {
    const { data} = await api.post(`/orders/${orderId}/express/finaliser`, finalData);
    return data;
  },

  assignExpeditionDeliverer: async (orderId: number, delivererId: number) => {
    const { data } = await api.post(`/orders/${orderId}/expedition/assign`, { delivererId });
    return data;
  },
};

// Delivery API
export const deliveryApi = {
  getLists: async (params?: any) => {
    const { data } = await api.get('/delivery/lists', { params });
    return data;
  },

  getValidatedOrders: async (params?: any) => {
    const { data } = await api.get('/delivery/validated-orders', { params });
    return data;
  },

  assignOrders: async (assignData: {
    orderIds: number[];
    delivererId: number;
    deliveryDate: string;
    listName?: string;
    zone?: string;
  }) => {
    const { data } = await api.post('/delivery/assign', assignData);
    return data;
  },

  getMyOrders: async (params?: any) => {
    const { data } = await api.get('/delivery/my-orders', { params });
    return data;
  },
};

// Stats API
export const statsApi = {
  getOverview: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/stats/overview', { params });
    return data;
  },

  getCallers: async (params?: any) => {
    const { data } = await api.get('/stats/callers', { params });
    return data;
  },

  getDeliverers: async (params?: any) => {
    const { data } = await api.get('/stats/deliverers', { params });
    return data;
  },

  getMyStats: async (params?: { period?: string }) => {
    const { data } = await api.get('/stats/my-stats', { params });
    return data;
  },

  export: async (params?: any) => {
    const { data } = await api.get('/stats/export', { params });
    return data;
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  create: async (productData: any) => {
    const { data } = await api.post('/products', productData);
    return data;
  },

  update: async (id: number, productData: any) => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },

  adjustStock: async (id: number, adjustData: any) => {
    const { data } = await api.post(`/products/${id}/stock/adjust`, adjustData);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

// Stock API
export const stockApi = {
  getTournees: async (params?: any) => {
    const { data } = await api.get('/stock/tournees', { params });
    return data;
  },

  getTourneeDetail: async (id: number) => {
    const { data } = await api.get(`/stock/tournees/${id}`);
    return data;
  },

  confirmRemise: async (id: number, colisRemis: number) => {
    const { data } = await api.post(`/stock/tournees/${id}/confirm-remise`, { colisRemis });
    return data;
  },

  confirmRetour: async (id: number, colisRetour: number, ecartMotif?: string) => {
    const { data } = await api.post(`/stock/tournees/${id}/confirm-retour`, { colisRetour, ecartMotif });
    return data;
  },

  getMovements: async (params?: any) => {
    const { data } = await api.get('/stock/movements', { params });
    return data;
  },

  getStats: async (params?: any) => {
    const { data } = await api.get('/stock/stats', { params });
    return data;
  },
};

export const accountingApi = {
  getStats: async (params?: { dateDebut?: string; dateFin?: string }) => {
    const { data } = await api.get('/accounting/stats', { params });
    return data;
  },
};

export const expressApi = {
  getEnAgence: async (params?: { search?: string; agence?: string; statut?: string; nonRetires?: string }) => {
    const { data } = await api.get('/express/en-agence', { params });
    return data;
  },
  notifierClient: async (id: number, note?: string) => {
    const { data } = await api.post(`/express/${id}/notifier`, { note });
    return data;
  },
  confirmerRetrait: async (id: number) => {
    const { data } = await api.post(`/express/${id}/confirmer-retrait`);
    return data;
  },
};

export const rdvApi = {
  getAll: async (params?: { rappele?: boolean; dateDebut?: string; dateFin?: string; search?: string }) => {
    const { data } = await api.get('/rdv', { params });
    return data;
  },
  programmer: async (orderId: number, rdvDate: string, rdvNote?: string) => {
    const { data } = await api.post(`/rdv/${orderId}/programmer`, { rdvDate, rdvNote });
    return data;
  },
  rappeler: async (orderId: number, note?: string) => {
    const { data } = await api.post(`/rdv/${orderId}/rappeler`, { note });
    return data;
  },
  modifier: async (orderId: number, rdvDate?: string, rdvNote?: string) => {
    const { data } = await api.put(`/rdv/${orderId}`, { rdvDate, rdvNote });
    return data;
  },
  annuler: async (orderId: number) => {
    const { data } = await api.delete(`/rdv/${orderId}`);
    return data;
  },
};


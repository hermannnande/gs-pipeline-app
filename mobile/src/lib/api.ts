import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://gs-pipeline-app-2.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const activeCompany = await AsyncStorage.getItem('activeCompany');
  if (activeCompany) config.headers['X-Active-Company'] = activeCompany;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  companies: () => api.get('/auth/companies'),
};

export const ordersApi = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, data: any) => api.put(`/orders/${id}/status`, data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data),
  updateQuantite: (id: number, quantite: number) =>
    api.put(`/orders/${id}/quantite`, { quantite }),
  updateAdresse: (id: number, data: any) => api.put(`/orders/${id}/adresse`, data),
  marquerAppel: (id: number) => api.post(`/orders/${id}/marquer-appel`),
  togglePriorite: (id: number) => api.post(`/orders/${id}/toggle-priorite`),
  renvoyerAppel: (id: number, motif: string) =>
    api.post(`/orders/${id}/renvoyer-appel`, { motif }),
  attentePaiement: (id: number, note?: string) =>
    api.post(`/orders/${id}/attente-paiement`, { note }),
  expedition: (id: number, data: any) => api.post(`/orders/${id}/expedition`, data),
  express: (id: number, data: any) => api.post(`/orders/${id}/express`, data),
  expressArrive: (id: number) => api.put(`/orders/${id}/express/arrive`),
  expressAssign: (id: number, delivererId: number) =>
    api.post(`/orders/${id}/express/assign`, { delivererId }),
  expressExpedier: (id: number, data: any) =>
    api.post(`/orders/${id}/express/expedier`, data),
  expressNotifier: (id: number) => api.post(`/orders/${id}/express/notifier`),
  expressFinaliser: (id: number, data: any) =>
    api.post(`/orders/${id}/express/finaliser`, data),
  expeditionLivrer: (id: number, data: any) =>
    api.post(`/orders/${id}/expedition/livrer`, data),
  expeditionAssign: (id: number, delivererId: number) =>
    api.post(`/orders/${id}/expedition/assign`, { delivererId }),
  delete: (id: number) => api.delete(`/orders/${id}`),
  bulkDelete: (orderIds: number[]) => api.post('/orders/bulk-delete', { orderIds }),
  updateNoteAppelant: (id: number, noteAppelant: string) =>
    api.put(`/orders/${id}/note-appelant`, { noteAppelant }),
};

export const deliveryApi = {
  getLists: (params?: any) => api.get('/delivery/lists', { params }),
  assign: (data: any) => api.post('/delivery/assign', data),
  getMyOrders: (params?: any) => api.get('/delivery/my-orders', { params }),
  getValidatedOrders: (params?: any) =>
    api.get('/delivery/validated-orders', { params }),
};

export const statsApi = {
  overview: (params?: any) => api.get('/stats/overview', { params }),
  callers: (params?: any) => api.get('/stats/callers', { params }),
  deliverers: (params?: any) => api.get('/stats/deliverers', { params }),
  myStats: (period?: string) => api.get('/stats/my-stats', { params: { period } }),
  prepaidExpeditions: (params?: any) =>
    api.get('/stats/prepaid-expeditions', { params }),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  adjustStock: (id: number, data: any) =>
    api.post(`/products/${id}/stock/adjust`, data),
  lowStockAlerts: () => api.get('/products/alerts/low-stock'),
  stockByDeliverer: (id: number) => api.get(`/products/stock-by-deliverer/${id}`),
  stockLocalReserveOverview: () => api.get('/products/stock-local-reserve/overview'),
};

export const stockApi = {
  getTournees: (params?: any) => api.get('/stock/tournees', { params }),
  getTournee: (id: number) => api.get(`/stock/tournees/${id}`),
  confirmRemise: (id: number, data: any) =>
    api.post(`/stock/tournees/${id}/confirm-remise`, data),
  confirmRetour: (id: number, data: any) =>
    api.post(`/stock/tournees/${id}/confirm-retour`, data),
  cloturerExpedition: (id: number, data?: any) =>
    api.post(`/stock/tournees/${id}/cloturer-expedition`, data),
  movements: (params?: any) => api.get('/stock/movements', { params }),
  stats: (params?: any) => api.get('/stock/stats', { params }),
};

export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const expressApi = {
  enAgence: (params?: any) => api.get('/express/en-agence', { params }),
  notifier: (id: number, note?: string) =>
    api.post(`/express/${id}/notifier`, { note }),
  confirmerRetrait: (id: number) => api.post(`/express/${id}/confirmer-retrait`),
};

export const rdvApi = {
  getAll: (params?: any) => api.get('/rdv', { params }),
  programmer: (id: number, data: any) => api.post(`/rdv/${id}/programmer`, data),
  rappeler: (id: number, note?: string) => api.post(`/rdv/${id}/rappeler`, { note }),
  update: (id: number, data: any) => api.put(`/rdv/${id}`, data),
  delete: (id: number) => api.delete(`/rdv/${id}`),
};

export const attendanceApi = {
  markArrival: (lat: number, lng: number) =>
    api.post('/attendance/mark-arrival', { latitude: lat, longitude: lng }),
  markDeparture: (lat: number, lng: number) =>
    api.post('/attendance/mark-departure', { latitude: lat, longitude: lng }),
  myToday: () => api.get('/attendance/my-attendance-today'),
  history: (params?: any) => api.get('/attendance/history', { params }),
  storeConfig: () => api.get('/attendance/store-config'),
};

export const accountingApi = {
  stats: (params?: any) => api.get('/accounting/stats', { params }),
};

export const stockAnalysisApi = {
  localReserve: () => api.get('/stock-analysis/local-reserve'),
  delivererDetails: (id: number) =>
    api.get(`/stock-analysis/deliverer-details/${id}`),
};

export default api;

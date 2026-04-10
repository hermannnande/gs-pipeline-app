import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../lib/api';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'ADMIN' | 'GESTIONNAIRE' | 'GESTIONNAIRE_STOCK' | 'APPELANT' | 'LIVREUR';
  actif: boolean;
  companyId: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    await AsyncStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('activeCompany');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ loading: false });
        return;
      }
      const { data } = await authApi.me();
      set({ user: data, token, loading: false });
    } catch {
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },
}));

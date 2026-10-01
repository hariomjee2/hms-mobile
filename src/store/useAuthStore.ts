import { create } from 'zustand';
import EncryptedStorage from 'react-native-encrypted-storage';

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (user, token) => {
    await EncryptedStorage.setItem('jwt_token', token);
    await EncryptedStorage.setItem('user_data', JSON.stringify(user));
    set({ user, token });
  },
  logout: async () => {
    try {
      await EncryptedStorage.removeItem('jwt_token');
      await EncryptedStorage.removeItem('user_data');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      set({ user: null, token: null });
    }
  },
  checkAuth: async () => {
    try {
      const token = await EncryptedStorage.getItem('jwt_token');
      const userData = await EncryptedStorage.getItem('user_data');
      if (token && userData) {
        set({ token, user: JSON.parse(userData), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));

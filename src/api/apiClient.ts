import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = await EncryptedStorage.getItem('jwt_token');
      if (!token) {
        token = useAuthStore.getState().token;
      }
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage, using memory token', error);
      const memToken = useAuthStore.getState().token;
      if (memToken && config.headers) {
        config.headers.Authorization = `Bearer ${memToken}`;
      }
    }
    console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${config.url} (Base: ${config.baseURL})`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE ${response.status}] ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(
      `❌ [API ERROR ${error?.response?.status || 'NETWORK_ERROR'}] ${error?.config?.url}:`,
      error?.response?.data || error?.message
    );
    if (error.response && error.response.status === 401) {
      console.warn('401 Unauthorized encountered');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // In Web environment (Browser), connect directly to the current host or localhost
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }

  // In Native environment (iOS / Android / Expo Go)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return 'http://192.168.1.141:3000/api';
};

export const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let memoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
  if (token) {
    AsyncStorage.setItem('auth_token', token).catch(console.error);
  } else {
    AsyncStorage.removeItem('auth_token').catch(console.error);
  }
};

// Eagerly load token from AsyncStorage at module init time.
// This runs once when the module is first imported so that memoryToken
// is populated before the first API request fires — eliminates the
// per-request AsyncStorage read on every cold start.
AsyncStorage.getItem('auth_token')
  .then(token => {
    if (token) memoryToken = token;
  })
  .catch(console.error);

// Request Interceptor: Add Authorization token if it exists
api.interceptors.request.use(
  async (config) => {
    // memoryToken is already loaded eagerly above.
    // AsyncStorage fallback only needed if module was somehow imported
    // before the async init resolved (extremely unlikely but safe).
    if (!memoryToken) {
      const stored = await AsyncStorage.getItem('auth_token');
      if (stored) memoryToken = stored;
    }
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors + automatic retry on network failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized — token may be expired');
      memoryToken = null;
      AsyncStorage.removeItem('auth_token').catch(console.error);
      return Promise.reject(error);
    }

    // Don't retry client errors (4xx) — only retry network failures and server errors (5xx)
    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;
    if (!isNetworkError && !isServerError) return Promise.reject(error);

    const config = error.config;
    if (!config || config._retryCount >= 2) return Promise.reject(error);

    config._retryCount = (config._retryCount || 0) + 1;
    const delayMs = config._retryCount * 1000; // 1s, then 2s
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return api(config);
  }
);

// Upload a local image file through the backend to Cloudinary
export const uploadImageToCloudinary = async (localUri: string): Promise<string> => {
  if (!localUri || !localUri.startsWith('file://')) {
    return localUri; // Already a remote URL or empty
  }

  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', { uri: localUri, name: filename, type } as any);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
};

export default api;

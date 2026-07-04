import axios from 'axios';
import { getItemAsync } from '@/utils/storage';

export const apiClient = axios.create({
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const ip = (await getItemAsync('zdt_server_ip').catch(() => null)) || process.env.EXPO_PUBLIC_SERVER_IP;
  const apiKey = (await getItemAsync('zdt_api_key').catch(() => null)) || process.env.EXPO_PUBLIC_API_KEY;

  if (ip) {
    if (ip.includes(':')) {
      config.baseURL = `http://${ip}/api`;
    } else {
      config.baseURL = `http://${ip}:5000/api`;
    }
  }
  
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  return config;
});

// Helper to fetch CSRF token before POST requests
export const getCsrfToken = async () => {
  try {
    const res = await apiClient.get('/csrf-token');
    return res.data.csrf_token;
  } catch (error) {
    console.error('Failed to get CSRF token', error);
    return null;
  }
};

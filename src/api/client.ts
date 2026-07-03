import axios from 'axios';
import { getItemAsync } from '@/utils/storage';

export const apiClient = axios.create({
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const ip = await getItemAsync('zdt_server_ip');
  const user = await getItemAsync('zdt_user');
  const pass = await getItemAsync('zdt_pass');

  if (ip) {
    config.baseURL = `http://${ip}:5000/api`;
  }
  
  if (user && pass) {
    const encoded = btoa(`${user}:${pass}`);
    config.headers['Authorization'] = `Basic ${encoded}`;
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

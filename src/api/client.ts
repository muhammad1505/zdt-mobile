import axios, { AxiosError } from 'axios';
import { getItemAsync } from '@/utils/storage';
import { useServerStore } from '@/store/serverStore';
import type {
  ApiResponse,
  HealthResponse,
  ServerInfoResponse,
  DashboardStats,
  FileItem,
  FileListResponse,
  FileInfoResponse,
  FileSearchResponse,
  DownloadItem,
  DownloadListResponse,
  DownloadDetailResponse,
  ServiceInfo,
  VPNStatusResponse,
  VPNConfigResponse,
  VPNLogEntry,
  SettingsResponse,
  User,
  ApiKey,
  ActivityLogEntry,
  LogEntry,
  ProfileResponse,
  ServiceAction,
} from '@/types/api';

const apiClient = axios.create({
  timeout: 15000,
});

let _baseURL = '';
let _csrfToken = '';

apiClient.interceptors.request.use(async (config) => {
  const ip =
    (await getItemAsync('zdt_server_ip').catch(() => null)) ||
    process.env.EXPO_PUBLIC_SERVER_IP ||
    '';

  if (ip) {
    const port = ip.includes(':') ? '' : ':2000';
    _baseURL = `http://${ip}${port}/api`;
    config.baseURL = _baseURL;
  }

  const apiKey =
    (await getItemAsync('zdt_api_key').catch(() => null)) ||
    process.env.EXPO_PUBLIC_API_KEY ||
    '';

  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }

  if (_csrfToken && config.method !== 'get') {
    config.headers['X-CSRF-Token'] = _csrfToken;
  }

  return config;
});

const handleError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK') {
      useServerStore.getState().setConnected(false);
      return 'Tidak dapat terhubung ke server';
    }
    const msg = error.response?.data?.error || error.response?.data?.message || error.message;
    return msg;
  }
  return 'Terjadi kesalahan';
};

const getCsrfToken = async (): Promise<string> => {
  try {
    const res = await apiClient.get('/csrf-token');
    _csrfToken = res.data.csrf_token || '';
    return _csrfToken;
  } catch {
    return '';
  }
};

// ─── Server ─────────────────────────────────────

export const getHealth = async (): Promise<HealthResponse> => {
  const res = await apiClient.get<ApiResponse<HealthResponse>>('/health');
  return res.data as unknown as HealthResponse;
};

export const getServerInfo = async (): Promise<ServerInfoResponse> => {
  const res = await apiClient.get<ServerInfoResponse>('/status');
  useServerStore.getState().setConnected(true);
  useServerStore.getState().setInfo(res.data);
  return res.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard');
  const data = res.data.data || res.data;
  useServerStore.getState().setStats(data as DashboardStats);
  return data as DashboardStats;
};

// ─── Files ──────────────────────────────────────

export const getFiles = async (
  path = '',
  page = 1,
  perPage = 20
): Promise<FileListResponse> => {
  const res = await apiClient.get<ApiResponse<FileListResponse>>('/files', {
    params: { path, page, per_page: perPage },
  });
  const data = res.data.data || res.data;
  const result = data as unknown as FileListResponse;
  useServerStore.getState().setFiles(result.files || [], result.total || 0, result.page || 1);
  return result;
};

export const searchFiles = async (query: string, page = 1): Promise<FileSearchResponse> => {
  const res = await apiClient.get<ApiResponse<FileSearchResponse>>('/files/search', {
    params: { q: query, page },
  });
  const data = res.data.data || res.data;
  return data as unknown as FileSearchResponse;
};

export const getFileInfo = async (filePath: string): Promise<FileInfoResponse> => {
  const res = await apiClient.get<ApiResponse<FileInfoResponse>>(`/files/info/${encodeURIComponent(filePath)}`);
  return (res.data.data || res.data) as unknown as FileInfoResponse;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  await apiClient.delete(`/files/${encodeURIComponent(filePath)}`);
};

export const renameFile = async (oldPath: string, newName: string): Promise<void> => {
  await apiClient.post('/files/rename', { path: oldPath, new_name: newName });
};

export const createDirectory = async (path: string): Promise<void> => {
  await apiClient.post('/files/mkdir', { path });
};

export const getDownloadUrl = (filePath: string): string => {
  return `${_baseURL}/dl/${encodeURIComponent(filePath)}`;
};

export const getStreamUrl = (filePath: string): string => {
  return `${_baseURL}/stream/${encodeURIComponent(filePath)}`;
};

// ─── Downloads ──────────────────────────────────

export const startDownload = async (url: string, format: 'audio' | 'video' = 'audio'): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/download', { url, format });
};

export const getDownloads = async (page = 1, status?: string): Promise<DownloadListResponse> => {
  const params: Record<string, string | number> = { page, per_page: 20 };
  if (status) params.status = status;
  const res = await apiClient.get<ApiResponse<DownloadListResponse>>('/downloads', { params });
  const data = res.data.data || res.data;
  return data as unknown as DownloadListResponse;
};

export const getDownloadDetail = async (id: string): Promise<DownloadDetailResponse> => {
  const res = await apiClient.get<ApiResponse<DownloadDetailResponse>>(`/downloads/${id}`);
  return (res.data.data || res.data) as unknown as DownloadDetailResponse;
};

export const cancelDownload = async (id: string): Promise<void> => {
  await _ensureCsrf();
  await apiClient.delete(`/downloads/${id}`);
};

export const retryDownload = async (id: string): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post(`/downloads/retry/${id}`);
};

export const clearDownloadHistory = async (): Promise<void> => {
  await _ensureCsrf();
  await apiClient.delete('/downloads/history');
};

// ─── Services ───────────────────────────────────

export const getServices = async (): Promise<ServiceInfo[]> => {
  const res = await apiClient.get<ApiResponse<ServiceInfo[]>>('/admin/services');
  const data = res.data.data || res.data;
  const list = Array.isArray(data) ? data : [];
  useServerStore.getState().setServices(list);
  return list;
};

export const manageService = async (name: string, action: ServiceAction): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post(`/admin/services/${name}/${action}`);
};

// ─── VPN ────────────────────────────────────────

export const getVpnStatus = async (): Promise<VPNStatusResponse> => {
  const res = await apiClient.get<ApiResponse<VPNStatusResponse>>('/vpn/status');
  const data = (res.data.data || res.data) as VPNStatusResponse;
  useServerStore.getState().setVpnStatus(data);
  return data;
};

export const vpnConnect = async (): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/admin/vpn/connect');
};

export const vpnDisconnect = async (): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/admin/vpn/disconnect');
};

export const vpnRestart = async (): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/admin/vpn/restart');
};

export const getVpnConfig = async (): Promise<VPNConfigResponse> => {
  const res = await apiClient.get<ApiResponse<VPNConfigResponse>>('/admin/vpn/config');
  return (res.data.data || res.data) as unknown as VPNConfigResponse;
};

export const updateVpnConfig = async (config: Partial<VPNConfigResponse>): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/admin/vpn/config', config);
};

export const getVpnLogs = async (limit = 50): Promise<VPNLogEntry[]> => {
  const res = await apiClient.get<ApiResponse<VPNLogEntry[]>>('/admin/vpn/log', {
    params: { limit },
  });
  const data = res.data.data || res.data;
  return Array.isArray(data) ? data : [];
};

// ─── Settings ───────────────────────────────────

export const getSettings = async (): Promise<SettingsResponse> => {
  const res = await apiClient.get<ApiResponse<SettingsResponse>>('/settings');
  return (res.data.data || res.data) as unknown as SettingsResponse;
};

export const updateSettings = async (settings: Record<string, string>): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/settings', settings);
};

export const getServerInfoWithTools = async (): Promise<Record<string, string>> => {
  const res = await apiClient.get<ApiResponse<Record<string, string>>>('/server/info');
  return (res.data.data || res.data) as Record<string, string>;
};

// ─── Users ──────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get<ApiResponse<User[]>>('/admin/users');
  const data = res.data.data || res.data;
  return Array.isArray(data) ? data : [];
};

export const createUser = async (username: string, password: string, role = 'user'): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/admin/users', { username, password, role });
};

export const deleteUser = async (id: number): Promise<void> => {
  await _ensureCsrf();
  await apiClient.delete(`/admin/users/${id}`);
};

// ─── API Keys ───────────────────────────────────

export const getApiKeys = async (): Promise<ApiKey[]> => {
  const res = await apiClient.get<ApiResponse<ApiKey[]>>('/admin/keys');
  const data = res.data.data || res.data;
  return Array.isArray(data) ? data : [];
};

export const generateApiKey = async (label?: string, role = 'mobile'): Promise<ApiKey> => {
  await _ensureCsrf();
  const res = await apiClient.post<ApiResponse<ApiKey>>('/admin/keys', { label, role });
  return (res.data.data || res.data) as unknown as ApiKey;
};

export const revokeApiKey = async (id: number): Promise<void> => {
  await _ensureCsrf();
  await apiClient.delete(`/admin/keys/${id}`);
};

// ─── Activity ───────────────────────────────────

export const getActivityLogs = async (limit = 20): Promise<ActivityLogEntry[]> => {
  const res = await apiClient.get<ApiResponse<ActivityLogEntry[]>>('/admin/activity', {
    params: { limit },
  });
  const data = res.data.data || res.data;
  return Array.isArray(data) ? data : [];
};

// ─── Console ────────────────────────────────────

export const getLogs = async (limit = 50): Promise<LogEntry[]> => {
  const res = await apiClient.get<ApiResponse<LogEntry[]>>('/logs', { params: { limit } });
  const raw = res.data;
  const data = (raw.data || raw) as unknown;
  if (Array.isArray(data)) return data.filter((l): l is LogEntry => l && typeof l === 'object');
  return [];
};

export const clearLogs = async (): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/logs/clear');
};

// ─── Tools ──────────────────────────────────────

export const runTool = async (
  action: string,
  filename?: string
): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/tools', { action, filename });
};

export const controlDaemon = async (
  daemon: string,
  action: 'start' | 'stop' | 'restart'
): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/daemon', { daemon, action });
};

// ─── Profile ────────────────────────────────────

export const getProfile = async (): Promise<ProfileResponse> => {
  const res = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
  return (res.data.data || res.data) as unknown as ProfileResponse;
};

export const updateProfile = async (data: Partial<ProfileResponse>): Promise<void> => {
  await _ensureCsrf();
  await apiClient.put('/profile', data);
};

export const changePassword = async (current: string, newPass: string): Promise<void> => {
  await _ensureCsrf();
  await apiClient.post('/profile/password', { current_password: current, new_password: newPass });
};

// ─── Helpers ────────────────────────────────────

const _ensureCsrf = async (): Promise<void> => {
  if (!_csrfToken) {
    await getCsrfToken();
  }
};

export { apiClient, handleError, getCsrfToken };

// ─── Generic API response ──────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Health ─────────────────────────────────────
export interface HealthResponse {
  status: string;
  version: string;
}

// ─── Server Info ────────────────────────────────
export interface ServerInfoResponse {
  version: string;
  target_dir: string;
  watcher: boolean;
  telegram: boolean;
  storage_free: string;
  file_count: number;
  tools?: Record<string, string>;
}

// ─── Dashboard Stats ────────────────────────────
export interface DashboardStats {
  total_downloads?: number;
  total_files: number;
  storage_free: string;
  storage_total?: string;
  storage_used?: string;
  cpu?: string;
  ram?: string;
  uptime?: string;
  os?: string;
}

// ─── File Management ────────────────────────────
export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  size_str: string;
  modified: string;
  duration?: number;
  format?: string;
  bitrate?: string;
}

export interface FileInfoResponse {
  name: string;
  path: string;
  size: number;
  size_str: string;
  modified: string;
  is_dir: boolean;
  duration?: number;
  format?: string;
  bitrate?: string;
  codec?: string;
  resolution?: string;
}

export interface FileListResponse {
  files: FileItem[];
  total: number;
  page: number;
  per_page: number;
  path: string;
}

export interface FileSearchResponse {
  files: FileItem[];
  total: number;
  page: number;
  per_page: number;
  query: string;
}

// ─── Download Queue ─────────────────────────────
export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export interface DownloadItem {
  id: string;
  url: string;
  title?: string;
  filename?: string;
  format: string;
  status: DownloadStatus;
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  type: 'audio' | 'video';
}

export interface DownloadListResponse {
  downloads: DownloadItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface DownloadDetailResponse extends DownloadItem {
  log?: string[];
}

// ─── Services ───────────────────────────────────
export type ServiceName = 'zdt-api' | 'zdt-telegram' | 'zdt-watch' | 'zdt-scheduler';
export type ServiceAction = 'start' | 'stop' | 'restart' | 'enable' | 'disable';

export interface ServiceInfo {
  name: ServiceName;
  status: 'running' | 'stopped' | 'enabled' | 'disabled' | 'error';
  enabled?: boolean;
  pid?: number;
  cpu?: string;
  memory?: string;
}

// ─── VPN ────────────────────────────────────────
export interface VPNStatusResponse {
  connected: boolean;
  ip?: string;
  uptime?: string;
  server?: string;
}

export interface VPNConfigResponse {
  server: string;
  username: string;
  password: string;
  enabled: boolean;
}

export interface VPNLogEntry {
  id: number;
  event_type: string;
  status: string;
  message: string;
  timestamp: string;
}

// ─── Settings ───────────────────────────────────
export interface SettingsGroup {
  category: string;
  settings: Record<string, string>;
}

export interface SettingsResponse {
  storage?: {
    target_dir?: string;
    storage_free_gb?: number;
    total_files?: number;
  };
  download?: {
    default_format?: string;
    audio_quality?: string;
    video_max_resolution?: string;
    output_naming_pattern?: string;
  };
  telegram?: {
    bot_enabled?: boolean;
    enabled?: boolean;
    bot_token?: string;
    chat_id?: string;
  };
  notifications?: {
    notify_on_download_complete?: boolean;
    notify_on_error?: boolean;
  };
  server?: {
    version?: string;
    uptime?: number;
    hostname?: string;
    port?: number;
  };
  vpn?: {
    connected?: boolean;
    ip?: string;
    server?: string;
    auto_start?: boolean;
  };
  [key: string]: unknown;
}

// ─── Users ──────────────────────────────────────
export interface User {
  id: number;
  username: string;
  role: string;
  is_active?: boolean;
  created_at: string;
}

// ─── API Keys ───────────────────────────────────
export interface ApiKey {
  id: number;
  key?: string;
  label?: string;
  key_label?: string;
  masked_key?: string;
  role: string;
  is_active?: boolean;
  created_at: string;
  expires_at?: string;
  is_expired?: boolean;
  last_used_at?: string;
}

// ─── Activity Logs ──────────────────────────────
export interface ActivityLogEntry {
  id: number;
  user: string;
  action: string;
  resource: string;
  detail?: string;
  ip?: string;
  timestamp: string;
}

// ─── Console/Process Logs ──────────────────────
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
}

// ─── Profile ────────────────────────────────────
export interface ProfileResponse {
  username: string;
  display_name?: string;
  role: string;
  joined_at: string;
}

// ─── Auth ───────────────────────────────────────
export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
}

export interface VerifyKeyResponse {
  valid: boolean;
  role?: string;
  label?: string;
}

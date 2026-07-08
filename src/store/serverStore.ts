import { create } from 'zustand';
import type {
  ServerInfoResponse,
  DashboardStats,
  FileItem,
  DownloadItem,
  ServiceInfo,
  VPNStatusResponse,
  LogEntry,
} from '@/types/api';

interface ServerStore {
  // Connection
  connected: boolean;
  connecting: boolean;
  error: string | null;

  // Server info
  info: ServerInfoResponse | null;
  stats: DashboardStats | null;

  // Files
  files: FileItem[];
  filesTotal: number;
  filesPage: number;
  filesLoading: boolean;

  // Downloads
  downloads: DownloadItem[];
  downloadsTotal: number;
  downloadsLoading: boolean;

  // Services
  services: ServiceInfo[];
  servicesLoading: boolean;

  // VPN
  vpnStatus: VPNStatusResponse | null;

  // Console logs
  logs: LogEntry[];
  logsAutoRefresh: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setInfo: (info: ServerInfoResponse) => void;
  setStats: (stats: DashboardStats) => void;
  setFiles: (files: FileItem[], total: number, page: number) => void;
  setFilesLoading: (loading: boolean) => void;
  setDownloads: (downloads: DownloadItem[], total: number) => void;
  setDownloadsLoading: (loading: boolean) => void;
  setServices: (services: ServiceInfo[]) => void;
  setServicesLoading: (loading: boolean) => void;
  setVpnStatus: (status: VPNStatusResponse) => void;
  setLogs: (logs: LogEntry[]) => void;
  setLogsAutoRefresh: (on: boolean) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  connecting: false,
  error: null,
  info: null,
  stats: null,
  files: [],
  filesTotal: 0,
  filesPage: 1,
  filesLoading: false,
  downloads: [],
  downloadsTotal: 0,
  downloadsLoading: false,
  services: [],
  servicesLoading: false,
  vpnStatus: null,
  logs: [],
  logsAutoRefresh: true,
};

export const useServerStore = create<ServerStore>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
  setInfo: (info) => set({ info, connected: true, error: null }),
  setStats: (stats) => set({ stats }),
  setFiles: (files, total, page) => set({ files, filesTotal: total, filesPage: page }),
  setFilesLoading: (filesLoading) => set({ filesLoading }),
  setDownloads: (downloads, total) => set({ downloads, downloadsTotal: total }),
  setDownloadsLoading: (downloadsLoading) => set({ downloadsLoading }),
  setServices: (services) => set({ services }),
  setServicesLoading: (servicesLoading) => set({ servicesLoading }),
  setVpnStatus: (vpnStatus) => set({ vpnStatus }),
  setLogs: (logs) => set({ logs }),
  setLogsAutoRefresh: (logsAutoRefresh) => set({ logsAutoRefresh }),
  reset: () => set(initialState),
}));

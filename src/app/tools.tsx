import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, RefreshControl
} from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  getServerInfo, runTool, controlDaemon,
  getServices, manageService, getVpnStatus,
  vpnConnect, vpnDisconnect, vpnRestart,
} from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import {
  Terminal, Wand2, ListMusic, Mic2, Trash2, Power, Bot,
  Server, Wifi, WifiOff, RefreshCcw, Play, StopCircle
} from 'lucide-react-native';
import type { ServiceInfo } from '@/types/api';

export default function ToolsScreen() {
  const { info, setInfo } = useServerStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [vpnConnected, setVpnConnected] = useState(false);
  const [vpnIp, setVpnIp] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [svc, vpn] = await Promise.all([
        getServices().catch(() => []),
        getVpnStatus().catch(() => null),
      ]);
      setServices(svc);
      if (vpn) {
        setVpnConnected(vpn.connected);
        setVpnIp(vpn.ip || '');
      }
      getServerInfo().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const daemonRunning = (name: string) => {
    const svc = services.find((s) => s.name === name);
    return svc ? svc.status === 'running' : false;
  };

  const handleToggleDaemon = async (name: string) => {
    const running = daemonRunning(name);
    try {
      await manageService(name, running ? 'stop' : 'start');
      setStatus(`[OK] ${name.toUpperCase()} ${running ? 'STOPPED' : 'STARTED'}`);
      fetchAll();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTool = async (action: string, filename?: string) => {
    setLoading(true);
    setStatus(`EXECUTING ${action}...`);
    try {
      await runTool(action, filename);
      setStatus(`[OK] ${action} selesai`);
    } catch (e: any) {
      setStatus(`[!] ${e.message || 'FAILED'}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('DANGER: WIPE STORAGE', 'All media files will be lost.', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'FORMAT', style: 'destructive', onPress: () => handleTool('delete_all') },
    ]);
  };

  const confirmVpnRestart = () => {
    Alert.alert('VPN Restart', 'Restart VPN connection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', onPress: async () => { try { await vpnRestart(); setStatus('[OK] VPN restart initiated'); fetchAll(); } catch (e: any) { Alert.alert('Error', e.message); } } },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
        <Terminal color={Colors.primary} size={24} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {/* VPN Section */}
      <Text style={styles.sectionTitle}>// VPN</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {vpnConnected ? <Wifi color={Colors.primary} size={22} /> : <WifiOff color={Colors.textMuted} size={22} />}
            <View>
              <Text style={styles.toolName}>{vpnConnected ? 'Connected' : 'Disconnected'}</Text>
              {vpnIp ? <Text style={styles.toolDesc}>{vpnIp}</Text> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {vpnConnected ? (
              <TouchableOpacity style={styles.smallBtn} onPress={() => vpnDisconnect().then(fetchAll).catch(() => {})}>
                <StopCircle color={Colors.error} size={18} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.smallBtn} onPress={() => vpnConnect().then(fetchAll).catch(() => {})}>
                <Play color={Colors.accent} size={18} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.smallBtn} onPress={confirmVpnRestart}>
              <RefreshCcw color={Colors.secondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daemon Services */}
      <Text style={styles.sectionTitle}>// DAEMONS</Text>
      {['zdt-watch', 'zdt-telegram', 'zdt-api'].map((name) => (
        <View key={name} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Bot color={daemonRunning(name) ? Colors.primary : Colors.textMuted} size={22} />
              <View>
                <Text style={styles.toolName}>{name.toUpperCase()}</Text>
                <Text style={styles.toolDesc}>{daemonRunning(name) ? 'Running' : 'Stopped'}</Text>
              </View>
            </View>
            <Switch
              value={daemonRunning(name)}
              onValueChange={() => handleToggleDaemon(name)}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={daemonRunning(name) ? Colors.primary : Colors.textMuted}
            />
          </View>
        </View>
      ))}

      {/* Tools */}
      <Text style={styles.sectionTitle}>// MEDIA TOOLS</Text>
      <TouchableOpacity style={styles.card} onPress={() => handleTool('clean')} disabled={loading}>
        <View style={styles.cardRow}>
          <Wand2 color={Colors.primary} size={22} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.toolName}>Clean Filenames</Text>
            <Text style={styles.toolDesc}>Remove metadata text from filenames</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleTool('sync_lyrics')} disabled={loading}>
        <View style={styles.cardRow}>
          <Mic2 color={Colors.secondary} size={22} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.toolName}>Sync Lyrics</Text>
            <Text style={styles.toolDesc}>Download .lrc lyrics automatically</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleTool('playlist')} disabled={loading}>
        <View style={styles.cardRow}>
          <ListMusic color={Colors.accent} size={22} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.toolName}>Create Playlist</Text>
            <Text style={styles.toolDesc}>Generate M3U from storage</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Danger Zone */}
      <Text style={styles.sectionTitle}>// DANGER ZONE</Text>
      <TouchableOpacity style={[styles.card, styles.dangerCard]} onPress={confirmDelete} disabled={loading}>
        <View style={styles.cardRow}>
          <Trash2 color={Colors.error} size={22} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.toolName, { color: Colors.error }]}>Format Storage</Text>
            <Text style={[styles.toolDesc, { color: Colors.error }]}>Delete all media files on server</Text>
          </View>
        </View>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 10,
  },
  title: { color: Colors.text, fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  statusBox: {
    backgroundColor: '#05050A', borderLeftWidth: 3, borderLeftColor: Colors.primary,
    padding: 12, marginBottom: 15,
  },
  statusText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11,
    marginBottom: 8, marginTop: 16, letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    padding: 14, borderRadius: 8, marginBottom: 8,
  },
  dangerCard: { borderColor: Colors.error, backgroundColor: 'rgba(255, 42, 42, 0.05)' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  toolName: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },
  toolDesc: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  smallBtn: {
    padding: 8, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 6, backgroundColor: Colors.background,
  },
});

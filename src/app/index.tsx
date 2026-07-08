import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert
} from 'react-native';
import { getItemAsync, setItemAsync } from '@/utils/storage';
import { getServerInfo, getDashboardStats } from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import {
  Wifi, HardDrive, Bot, FileAudio, Download, BarChart3, Music, Wrench,
  Settings as Gear, X, Key, Folder
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { connected, info, stats, setConnected, setInfo, setStats } = useServerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [dlDir, setDlDir] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [si] = await Promise.all([
        getServerInfo(),
        getDashboardStats().catch(() => null),
      ]);
      if (si) setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [setConnected]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    getItemAsync('zdt_api_key').then((v) => setApiKey(v || '')).catch(() => {});
    getItemAsync('zdt_dl_dir').then((v) => setDlDir(v || '')).catch(() => {});
  }, [settingsOpen]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const saveSettings = async () => {
    await setItemAsync('zdt_api_key', apiKey);
    await setItemAsync('zdt_dl_dir', dlDir);
    setSettingsOpen(false);
    Alert.alert('Saved', 'Settings saved. Restart to apply API key.');
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>ZDT</Text>
          <Text style={styles.subtitle}>Console</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#16a34a' : '#dc2626' }]} />
          <TouchableOpacity onPress={() => setSettingsOpen(true)}>
            <Gear color="#a8a29e" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<HardDrive color="#d97706" size={18} />}
            label="Storage"
            value={info?.storage_free || '...'}
            color="#d97706"
          />
          <StatCard
            icon={<Bot color="#06b6d4" size={18} />}
            label="Watcher"
            value={info?.watcher ? 'Active' : 'Off'}
            color="#06b6d4"
          />
          <StatCard
            icon={<FileAudio color="#16a34a" size={18} />}
            label="Files"
            value={info?.file_count ?? '...'}
            color="#16a34a"
          />
          <StatCard
            icon={<Wifi color="#f59e0b" size={18} />}
            label="Telegram"
            value={info?.telegram ? 'Active' : 'Off'}
            color="#f59e0b"
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>// QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Download color="#d97706" size={22} />
            <Text style={styles.actionLabel}>Downloads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <BarChart3 color="#06b6d4" size={22} />
            <Text style={styles.actionLabel}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Music color="#16a34a" size={22} />
            <Text style={styles.actionLabel}>Spotify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Wrench color="#f59e0b" size={22} />
            <Text style={styles.actionLabel}>Tools</Text>
          </TouchableOpacity>
        </View>

        {/* Server Info */}
        <Text style={styles.sectionTitle}>// SERVER</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Version" value={info?.version || 'N/A'} />
          <InfoRow label="Target" value={info?.target_dir || 'N/A'} />
          <InfoRow label="Storage" value={info?.storage_free || 'N/A'} />
          <InfoRow label="Files" value={`${info?.file_count || 0}`} />
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsOpen(false)}>
                <X color="#a8a29e" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Key color="#d97706" size={16} />
              <TextInput
                style={styles.input}
                placeholder="API Key"
                placeholderTextColor="#78716c"
                secureTextEntry
                value={apiKey}
                onChangeText={setApiKey}
              />
            </View>
            <View style={styles.inputGroup}>
              <Folder color="#16a34a" size={16} />
              <TextInput
                style={styles.input}
                placeholder="Download dir (default: app storage)"
                placeholderTextColor="#78716c"
                value={dlDir}
                onChangeText={setDlDir}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,162,158,0.08)',
  },
  logo: { color: '#d97706', fontSize: 28, fontFamily: 'monospace', fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: '#78716c', fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: {
    width: '46%', backgroundColor: '#141211', borderRadius: 10,
    padding: 16, borderWidth: 1, borderColor: 'rgba(168,162,158,0.06)',
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { color: '#78716c', fontFamily: 'monospace', fontSize: 11, marginLeft: 8, letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontFamily: 'monospace', fontWeight: '700' },
  sectionTitle: {
    color: '#78716c', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5,
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  actionsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: '#141211', borderRadius: 10,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,162,158,0.06)',
  },
  actionLabel: { color: '#a8a29e', fontFamily: 'monospace', fontSize: 10, marginTop: 8 },
  infoCard: {
    marginHorizontal: 16, backgroundColor: '#141211', borderRadius: 10,
    padding: 16, borderWidth: 1, borderColor: 'rgba(168,162,158,0.06)',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(168,162,158,0.04)' },
  infoLabel: { color: '#78716c', fontFamily: 'monospace', fontSize: 12 },
  infoValue: { color: '#fef3c7', fontFamily: 'monospace', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#141211', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: 'rgba(168,162,158,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fef3c7', fontSize: 18, fontFamily: 'monospace', fontWeight: '700' },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1917',
    borderRadius: 8, paddingHorizontal: 14, height: 48, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(168,162,158,0.08)',
  },
  input: { flex: 1, color: '#fef3c7', fontFamily: 'monospace', fontSize: 14, marginLeft: 10, height: '100%' },
  saveBtn: {
    backgroundColor: '#d97706', height: 48, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#0c0a09', fontWeight: '700', fontSize: 15, fontFamily: 'monospace' },
});

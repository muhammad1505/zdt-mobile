import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient, getCsrfToken } from '@/api/client';
import { Terminal, Wand2, ListMusic, Mic2, Trash2, Power, Bot } from 'lucide-react-native';

export default function ToolsScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [daemons, setDaemons] = useState({ watcher: false, telegram: false });

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get('/status');
      setDaemons({ watcher: res.data.watcher, telegram: res.data.telegram });
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleDaemon = async (daemon: 'watcher' | 'telegram') => {
    try {
      const csrf = await getCsrfToken();
      const action = daemons[daemon] ? 'stop' : 'start';
      await apiClient.post('/daemon', { daemon, action }, { headers: { 'X-CSRF-Token': csrf } });
      setDaemons(prev => ({ ...prev, [daemon]: !prev[daemon] }));
      setStatus(`[OK] ${daemon.toUpperCase()} ${action.toUpperCase()}`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle daemon');
    }
  };

  const runTool = async (action: string) => {
    setLoading(true);
    setStatus(`EXECUTING /bin/${action}.sh ...`);
    try {
      const csrf = await getCsrfToken();
      const res = await apiClient.post('/tools', { action }, { headers: { 'X-CSRF-Token': csrf } });
      setStatus(res.data.message);
      if (action === 'delete_all') {
        Alert.alert('Storage Wiped', res.data.message);
      }
    } catch (err: any) {
      setStatus('[!] ' + (err.message || 'COMMAND FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'DANGER: WIPE STORAGE',
      'Are you sure you want to format the storage directory? All media files will be lost.',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'FORMAT', style: 'destructive', onPress: () => runTool('delete_all') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Alat</Text>
        <Terminal color={Colors.primary} size={24} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>// KONTROL DAEMON</Text>
      
      <View style={styles.daemonCard}>
        <View style={styles.daemonInfo}>
          <Power color={daemons.watcher ? Colors.primary : Colors.textMuted} size={24} />
          <View style={styles.daemonTextContainer}>
            <Text style={styles.toolName}>Auto-Sync Watcher</Text>
            <Text style={styles.toolDesc}>Memonitor file di latar belakang</Text>
          </View>
        </View>
        <Switch 
          value={daemons.watcher} 
          onValueChange={() => toggleDaemon('watcher')}
          trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
          thumbColor={daemons.watcher ? Colors.primary : Colors.textMuted}
        />
      </View>

      <View style={styles.daemonCard}>
        <View style={styles.daemonInfo}>
          <Bot color={daemons.telegram ? Colors.primary : Colors.textMuted} size={24} />
          <View style={styles.daemonTextContainer}>
            <Text style={styles.toolName}>Telegram Bot</Text>
            <Text style={styles.toolDesc}>Kontrol server via Telegram</Text>
          </View>
        </View>
        <Switch 
          value={daemons.telegram} 
          onValueChange={() => toggleDaemon('telegram')}
          trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
          thumbColor={daemons.telegram ? Colors.primary : Colors.textMuted}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>// PEMROSES MEDIA</Text>
      
      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('clean')} disabled={loading}>
        <View style={styles.toolIcon}>
          <Wand2 color={Colors.primary} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>Bersihkan Nama File</Text>
          <Text style={styles.toolDesc}>Hapus teks metadata yang tidak perlu</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('sync_lyrics')} disabled={loading}>
        <View style={styles.toolIcon}>
          <Mic2 color={Colors.secondary} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>Sinkronisasi Lirik</Text>
          <Text style={styles.toolDesc}>Unduh lirik lagu secara otomatis (.lrc)</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('playlist')} disabled={loading}>
        <View style={styles.toolIcon}>
          <ListMusic color={Colors.accent} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>Buat Playlist</Text>
          <Text style={styles.toolDesc}>Buat file M3U dari penyimpanan</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>// ZONA BERBAHAYA</Text>

      <TouchableOpacity style={[styles.toolCard, styles.dangerCard]} onPress={confirmDelete} disabled={loading}>
        <View style={styles.toolIcon}>
          <Trash2 color={Colors.error} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={[styles.toolName, { color: Colors.error }]}>Format Penyimpanan</Text>
          <Text style={[styles.toolDesc, { color: Colors.error }]}>Hapus semua file media di server</Text>
        </View>
      </TouchableOpacity>
      
      {loading && <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusBox: {
    backgroundColor: '#05050A',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 15,
    marginBottom: 20,
  },
  statusText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 10,
    marginTop: 10,
  },
  daemonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  daemonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  daemonTextContainer: {
    marginLeft: 15,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  dangerCard: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 42, 42, 0.05)',
  },
  toolIcon: {
    marginRight: 15,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolDesc: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 4,
  }
});

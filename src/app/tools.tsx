import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { runTool, getDownloadUrl } from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import { Terminal, Wand2, ListMusic, Mic2, Trash2, Wifi, HardDrive, Activity } from 'lucide-react-native';

export default function ToolsScreen() {
  const { info, connected } = useServerStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleTool = async (action: string) => {
    setLoading(true);
    setStatus(`Executing ${action}...`);
    try {
      await runTool(action);
      setStatus(`[OK] ${action} done`);
    } catch (e: any) {
      setStatus(`[!] ${e.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Format Storage', 'All media files on server will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Format', style: 'destructive', onPress: () => handleTool('delete_all') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
        <Terminal color={Colors.primary} size={24} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {/* Server Status */}
      <Text style={styles.sectionTitle}>// SERVER</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Wifi color={connected ? Colors.primary : Colors.textMuted} size={18} />
          <Text style={styles.rowText}>{connected ? 'Connected' : 'Offline'}</Text>
        </View>
        <View style={styles.row}>
          <HardDrive color={Colors.accent} size={18} />
          <Text style={styles.rowText}>Storage: {info?.storage_free || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Activity color={Colors.secondary} size={18} />
          <Text style={styles.rowText}>Files: {info?.file_count || 0} · Version: {info?.version || 'N/A'}</Text>
        </View>
      </View>

      {/* Media Tools */}
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

      {/* Danger */}
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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowText: { color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 10 },
});

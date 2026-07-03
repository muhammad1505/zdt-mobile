import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient, getCsrfToken } from '@/api/client';
import { Terminal, Wand2, ListMusic, Mic2, Trash2 } from 'lucide-react-native';

export default function ToolsScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>COMMAND_CENTER</Text>
        <Terminal color={Colors.primary} size={24} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>// AUDIO_PROCESSORS</Text>
      
      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('clean')} disabled={loading}>
        <View style={styles.toolIcon}>
          <Wand2 color={Colors.primary} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>CLEAN_FILENAMES</Text>
          <Text style={styles.toolDesc}>Remove clutter & metadata tags from files</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('sync_lyrics')} disabled={loading}>
        <View style={styles.toolIcon}>
          <Mic2 color={Colors.secondary} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>SYNC_LYRICS</Text>
          <Text style={styles.toolDesc}>Download and embed synchronized lyrics (.lrc)</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toolCard} onPress={() => runTool('playlist')} disabled={loading}>
        <View style={styles.toolIcon}>
          <ListMusic color={Colors.accent} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>GENERATE_PLAYLIST</Text>
          <Text style={styles.toolDesc}>Compile M3U playlist from storage</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>// SYSTEM_DANGER_ZONE</Text>

      <TouchableOpacity style={[styles.toolCard, styles.dangerCard]} onPress={confirmDelete} disabled={loading}>
        <View style={styles.toolIcon}>
          <Trash2 color={Colors.error} size={24} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={[styles.toolName, { color: Colors.error }]}>FORMAT_STORAGE</Text>
          <Text style={[styles.toolDesc, { color: Colors.error }]}>Delete all media files in the server</Text>
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
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
    fontSize: 11,
    marginTop: 4,
  }
});

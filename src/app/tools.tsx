import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { runTool } from '@/api/client';
import { Wrench, Wand2, Mic2, ListMusic, Music4, Trash2 } from 'lucide-react-native';

export default function ToolsScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handle = async (action: string, msg?: string) => {
    setLoading(true);
    setStatus(`Running ${action}...`);
    try {
      await runTool(action);
      setStatus(`[OK] ${msg || action}`);
      setTimeout(() => setStatus(''), 2000);
    } catch (e: any) {
      setStatus(`[!] ${e.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Format Storage', 'All media files on server will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Format', style: 'destructive', onPress: () => handle('delete_all', 'Storage formatted') },
    ]);
  };

  const ToolBtn = ({ icon, label, desc, onPress, danger }: any) => (
    <TouchableOpacity style={[s.btn, danger && s.danger]} onPress={onPress} disabled={loading}>
      {icon}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[s.btnLabel, danger && { color: Colors.danger }]}>{label}</Text>
        <Text style={[s.btnDesc, danger && { color: Colors.danger }]}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Tools</Text>
        <Wrench color={Colors.primary} size={22} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {status ? (
          <View style={s.statusBox}>
            <Text style={s.statusText}>{status}</Text>
          </View>
        ) : null}

        <Text style={s.sectionTitle}>// MEDIA</Text>
        <ToolBtn icon={<Wand2 color={Colors.primary} size={20} />} label="Clean Filenames" desc="Remove metadata text from filenames" onPress={() => handle('clean', 'Filenames cleaned')} />
        <ToolBtn icon={<Mic2 color={Colors.secondary} size={20} />} label="Sync Lyrics" desc="Download .lrc lyrics for all files" onPress={() => handle('sync_lyrics', 'Lyrics synced')} />
        <ToolBtn icon={<ListMusic color={Colors.accent} size={20} />} label="Create Playlist" desc="Generate M3U playlist from storage" onPress={() => handle('playlist', 'Playlist created')} />

        <Text style={s.sectionTitle}>// ADVANCED</Text>
        <ToolBtn icon={<Music4 color="#f59e0b" size={20} />} label="Demucs" desc="AI vocal separation" onPress={() => handle('demucs', 'Demucs processing started')} />
        <ToolBtn icon={<Trash2 color={Colors.danger} size={20} />} label="Format Storage" desc="Delete all media files on server" danger onPress={confirmDelete} />

        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 20, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
  statusBox: {
    backgroundColor: Colors.card, borderRadius: 8, padding: 14, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  statusText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5,
    marginBottom: 10, marginTop: 20,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  danger: { borderColor: Colors.danger, backgroundColor: 'rgba(220,38,38,0.05)' },
  btnLabel: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
  btnDesc: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
});

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { runTool } from '@/api/client';
import { Music, RefreshCw, ListMusic } from 'lucide-react-native';

export default function SpotifyScreen() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSync = async () => {
    if (!playlistUrl) return;
    setLoading(true);
    setStatus('Syncing Spotify playlist...');
    try {
      await runTool('spotify_sync', playlistUrl);
      setStatus('[OK] Sync initiated');
      setTimeout(() => { setStatus(''); setPlaylistUrl(''); }, 2000);
    } catch (e: any) {
      setStatus(`[!] ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setStatus('Refreshing playlists...');
    try {
      await runTool('spotify_refresh');
      setStatus('[OK] Playlists refreshed');
      setTimeout(() => setStatus(''), 2000);
    } catch (e: any) {
      setStatus(`[!] ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Spotify</Text>
        <Music color={Colors.primary} size={22} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Sync Playlist</Text>
          <Text style={s.cardDesc}>Sync a Spotify playlist to server storage</Text>
          <TextInput
            style={s.input}
            placeholder="https://open.spotify.com/playlist/..."
            placeholderTextColor={Colors.textMuted}
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.btn} onPress={handleSync} disabled={loading || !playlistUrl}>
            {loading ? <ActivityIndicator color={Colors.background} /> : <Text style={s.btnText}>Sync</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.cardAction} onPress={handleRefresh} disabled={loading}>
          <RefreshCw color={Colors.primary} size={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.actionTitle}>Refresh Playlists</Text>
            <Text style={s.actionDesc}>Update all synced Spotify playlists</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.cardAction} onPress={() => runTool('playlist').then(() => Alert.alert('Done', 'M3U playlist created')).catch(() => {})} disabled={loading}>
          <ListMusic color={Colors.accent} size={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.actionTitle}>Generate M3U</Text>
            <Text style={s.actionDesc}>Create playlist file from storage</Text>
          </View>
        </TouchableOpacity>

        {status ? (
          <View style={s.statusBox}>
            <Text style={s.statusText}>{status}</Text>
          </View>
        ) : null}
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
  card: { backgroundColor: Colors.surface, borderRadius: 10, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  cardTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  cardDesc: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 4, marginBottom: 16 },
  input: {
    backgroundColor: Colors.background, color: Colors.text, fontFamily: 'monospace', fontSize: 13,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, marginBottom: 14,
  },
  btn: { backgroundColor: Colors.primary, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: Colors.background, fontFamily: 'monospace', fontWeight: '700', fontSize: 14 },
  cardAction: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  actionTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
  actionDesc: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  statusBox: {
    backgroundColor: Colors.card, borderRadius: 8, padding: 14, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  statusText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
});

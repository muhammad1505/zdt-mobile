import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Colors } from '@/constants/Colors';
import { startDownload, getDownloads } from '@/api/client';
import { Music, ListMusic } from 'lucide-react-native';

export default function SpotifyScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    getDownloads(1, '').then((r) => setRecent((r.downloads || []).filter((d: any) => d.url?.includes('spotify')).slice(0, 10))).catch(() => {});
  }, []);

  const handleDownload = async () => {
    if (!url) return;
    setLoading(true);
    setStatus('Downloading from Spotify...');
    try {
      await startDownload(url, 'audio');
      setStatus('[OK] Download started. Check Downloads tab.');
      setUrl('');
      const r = await getDownloads(1, '');
      setRecent((r.downloads || []).filter((d: any) => d.url?.includes('spotify')).slice(0, 10));
    } catch (e: any) {
      setStatus(`[!] ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
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
          <Text style={s.cardTitle}>Download from Spotify</Text>
          <Text style={s.cardDesc}>Enter a track, album, or playlist URL</Text>
          <TextInput
            style={s.input}
            placeholder="https://open.spotify.com/track/..."
            placeholderTextColor={Colors.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.btn} onPress={handleDownload} disabled={loading || !url}>
            {loading ? <ActivityIndicator color={Colors.background} /> : <Text style={s.btnText}>Download</Text>}
          </TouchableOpacity>
        </View>

        {status ? (
          <View style={s.statusBox}><Text style={s.statusText}>{status}</Text></View>
        ) : null}

        <Text style={s.sectionTitle}>// HOW IT WORKS</Text>
        <View style={s.infoCard}>
          <Text style={s.infoText}>
            • Enter any Spotify track, album, or playlist URL{'\n'}
            • Server downloads using spotdl{'\n'}
            • File auto-downloads to device{'\n'}
            • Auto-deleted from server afterward
          </Text>
        </View>

        {recent.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>// RECENT SPOTIFY</Text>
            {recent.map((d: any) => (
              <View key={d.id} style={s.dlRow}>
                <ListMusic color={Colors.textMuted} size={14} />
                <Text style={s.dlName} numberOfLines={1}>{d.title || d.url?.slice(0, 40)}</Text>
                <Text style={s.dlStatus}>{d.status}</Text>
              </View>
            ))}
          </>
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
  input: { backgroundColor: Colors.background, color: Colors.text, fontFamily: 'monospace', fontSize: 13, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, marginBottom: 14 },
  btn: { backgroundColor: Colors.primary, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: Colors.background, fontFamily: 'monospace', fontWeight: '700', fontSize: 14 },
  statusBox: { backgroundColor: Colors.card, borderRadius: 8, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  statusText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  sectionTitle: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: Colors.border },
  infoText: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  dlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  dlName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 11 },
  dlStatus: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' },
});

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Alert
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, DownloadTask } from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { getFiles, getDownloadUrl, startDownload, deleteFile } from '@/api/client';
import { Download, FileAudio, CheckCircle, XCircle, Loader, Search, Link } from 'lucide-react-native';

interface DlItem {
  id: string;
  name: string;
  source: 'server' | 'url';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
}

export default function DownloadScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlStatus, setUrlStatus] = useState('');
  const [downloads, setDownloads] = useState<DlItem[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await getFiles('', 1, 100);
      setFiles(res.files || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { return () => { if (pollingRef.current) clearInterval(pollingRef.current); }; }, []);

  // Download server file ke device + hapus dari server
  const downloadToDevice = async (file: any) => {
    const name = file.name || file.path?.split('/').pop() || 'file';
    const id = `${Date.now()}-${name}`;
    setDownloads((prev) => [...prev, { id, name, source: 'server', status: 'pending', progress: 0 }]);

    try {
      setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'downloading' } : d));
      const url = await getDownloadUrl(file.path || name);
      const task = new DownloadTask(url, Paths.document, {
        onProgress: (p) => {
          const prog = p.totalBytes > 0 ? Math.round((p.bytesWritten / p.totalBytes) * 100) : 0;
          setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, progress: prog } : d));
        },
      });
      const result = await task.downloadAsync();
      // Hapus dari server biar ga numpuk
      try { await deleteFile(file.path || name); } catch {}
      if (result) {
        setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'completed', progress: 100 } : d));
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      }
    } catch (e: any) {
      setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'failed' } : d));
      Alert.alert('Failed', e?.message || 'Download failed');
    }
  };

  // URL download: server download -> auto download ke HP -> hapus dari server
  const handleUrlDownload = async () => {
    if (!url) return;
    const id = `url-${Date.now()}`;
    const name = url.split('/').pop()?.slice(0, 40) || 'download';
    setDownloads((prev) => [...prev, { id, name, source: 'url', status: 'pending', progress: 0 }]);
    setUrlLoading(true);
    setUrlStatus('Server downloading...');

    try {
      await startDownload(url, 'audio');
      setUrlStatus('Waiting for file...');

      // Poll file baru di server
      let found = false;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const res = await getFiles('', 1, 200);
        const all = (res.files || []).map((f: any) => f.name || '');
        // Cari file terbaru (yang ketambahan)
        const prev = files.map((f: any) => f.name || '');
        const newFiles = all.filter((n: string) => !prev.includes(n) && n.match(/\.(mp3|m4a|flac|wav|ogg|opus|mp4|mkv|webm)$/i));
        if (newFiles.length > 0) {
          const target = newFiles[0];
          setUrlStatus(`Downloading ${target} to device...`);
          const dlUrl = await getDownloadUrl(target);
          const task = new DownloadTask(dlUrl, Paths.document, {
            onProgress: (p) => {
              const prog = p.totalBytes > 0 ? Math.round((p.bytesWritten / p.totalBytes) * 100) : 0;
              setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'downloading', progress: prog } : d));
            },
          });
          const result = await task.downloadAsync();
          // Hapus dari server
          try { await deleteFile(target); } catch {}
          if (result) {
            setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'completed', progress: 100, name: target } : d));
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
          }
          found = true;
          break;
        }
        setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'downloading', progress: Math.min(i, 90) } : d));
      }
      if (!found) throw new Error('File not found on server');
      setUrlStatus('[OK] Downloaded');
      setUrl('');
    } catch (e: any) {
      setDownloads((prev) => prev.map((d) => d.id === id ? { ...d, status: 'failed' } : d));
      setUrlStatus(`[!] ${e.message}`);
    } finally {
      setUrlLoading(false);
      setTimeout(() => setUrlStatus(''), 3000);
    }
  };

  const filtered = searchQuery
    ? files.filter((f: any) => (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Downloads</Text>
        <Download color={Colors.primary} size={22} />
      </View>

      {/* URL Download */}
      <View style={s.urlSection}>
        <Link color={Colors.textMuted} size={16} />
        <TextInput
          style={s.urlInput}
          placeholder="YouTube / Spotify URL..."
          placeholderTextColor={Colors.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.urlBtn} onPress={handleUrlDownload} disabled={urlLoading || !url}>
          {urlLoading ? <ActivityIndicator color={Colors.background} size={18} /> : <Text style={s.urlBtnText}>DL</Text>}
        </TouchableOpacity>
      </View>
      {urlStatus ? (
        <View style={s.urlStatus}><Text style={s.urlStatusText}>{urlStatus}</Text></View>
      ) : null}

      {/* Active downloads */}
      {downloads.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>// DOWNLOADS</Text>
          {downloads.map((d) => (
            <View key={d.id} style={s.dlItem}>
              {d.status === 'downloading' || d.status === 'pending' ? <Loader color={Colors.primary} size={14} /> :
               d.status === 'completed' ? <CheckCircle color={Colors.accent} size={14} /> :
               <XCircle color={Colors.danger} size={14} />}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.dlName} numberOfLines={1}>{d.name}</Text>
                <Text style={s.dlStatus}>
                  {d.status === 'downloading' ? `${d.progress}%` : d.status === 'pending' ? 'Waiting...' : d.status.toUpperCase()}
                  {d.source === 'url' ? ' · via URL' : ''}
                </Text>
                {d.status === 'downloading' || d.status === 'pending' ? (
                  <View style={s.barOuter}><View style={[s.barInner, { width: `${d.progress}%` }]} /></View>
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : null}

      {/* Server files */}
      <Text style={s.sectionTitle}>// SERVER FILES</Text>
      <Text style={s.hint}>Tap to download to device (auto-deleted from server)</Text>

      <View style={s.searchBox}>
        <Search color={Colors.textMuted} size={16} />
        <TextInput
          style={s.searchInput}
          placeholder="Search files..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.path || item.name || Math.random().toString()}
          renderItem={({ item }: any) => (
            <TouchableOpacity style={s.fileCard} onPress={() => downloadToDevice(item)}>
              <FileAudio color={Colors.textMuted} size={18} />
              <Text style={s.fileName} numberOfLines={1}>{item.name || item.path?.split('/').pop()}</Text>
              <Download color={Colors.primary} size={16} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.empty}>No files</Text>}
        />
      )}
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
  urlSection: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, gap: 8 },
  urlInput: {
    flex: 1, backgroundColor: Colors.surface, color: Colors.text, fontFamily: 'monospace', fontSize: 13,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  urlBtn: { width: 48, height: 44, borderRadius: 8, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  urlBtnText: { color: Colors.background, fontWeight: '700', fontFamily: 'monospace', fontSize: 14 },
  urlStatus: { marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.card, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  urlStatusText: { color: Colors.secondary, fontFamily: 'monospace', fontSize: 11 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  hint: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginBottom: 10 },
  sectionTitle: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  dlItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  dlName: { color: Colors.text, fontFamily: 'monospace', fontSize: 12 },
  dlStatus: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  barOuter: { height: 3, backgroundColor: Colors.card, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  barInner: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  fileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, padding: 14, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  fileName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 },
});

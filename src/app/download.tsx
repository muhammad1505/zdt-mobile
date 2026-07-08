import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Alert
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, DownloadTask } from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { getFiles, getDownloadUrl } from '@/api/client';
import { Download, FileAudio, CheckCircle, XCircle, Loader, Search } from 'lucide-react-native';

interface DeviceDownload {
  id: string;
  name: string;
  status: 'downloading' | 'completed' | 'failed';
  progress: number;
}

export default function DownloadScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloads, setDownloads] = useState<DeviceDownload[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await getFiles('', 1, 100);
      setFiles(res.files || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const downloadToDevice = async (file: any) => {
    const name = file.name || file.path?.split('/').pop() || 'file';
    const id = `${Date.now()}-${name}`;
    setDownloads((prev) => [...prev, { id, name, status: 'downloading', progress: 0 }]);

    try {
      const url = await getDownloadUrl(file.path || name);
      const task = new DownloadTask(url, Paths.document, {
        onProgress: (p) => {
          const progress = p.totalBytes > 0 ? Math.round((p.bytesWritten / p.totalBytes) * 100) : 0;
          setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, progress } : d)));
        },
      });
      const result = await task.downloadAsync();
      if (result) {
        setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'completed', progress: 100 } : d)));
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      }
    } catch (e: any) {
      setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'failed' } : d)));
      Alert.alert('Failed', e?.message || 'Download failed');
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

      {downloads.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>// DOWNLOADS</Text>
          {downloads.map((d) => (
            <View key={d.id} style={s.dlItem}>
              {d.status === 'downloading' ? <Loader color={Colors.primary} size={14} /> :
               d.status === 'completed' ? <CheckCircle color={Colors.accent} size={14} /> :
               <XCircle color={Colors.danger} size={14} />}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.dlName} numberOfLines={1}>{d.name}</Text>
                <Text style={s.dlStatus}>{d.status === 'downloading' ? `${d.progress}%` : d.status.toUpperCase()}</Text>
                {d.status === 'downloading' ? (
                  <View style={s.barOuter}><View style={[s.barInner, { width: `${d.progress}%` }]} /></View>
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : null}

      <Text style={s.sectionTitle}>// SERVER FILES</Text>
      <Text style={s.hint}>Tap a file to download to device</Text>

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
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    marginHorizontal: 16, marginTop: 16, borderRadius: 8, paddingHorizontal: 12,
    height: 44, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  hint: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginHorizontal: 16, marginBottom: 10 },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5,
    marginHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  dlItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  dlName: { color: Colors.text, fontFamily: 'monospace', fontSize: 12 },
  dlStatus: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  barOuter: { height: 3, backgroundColor: Colors.card, borderRadius: 2, marginTop: 4 },
  barInner: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  fileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, padding: 14, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  fileName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 },
});

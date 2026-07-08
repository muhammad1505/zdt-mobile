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
import type { FileItem } from '@/types/api';

interface DeviceDownload {
  id: string;
  name: string;
  status: 'downloading' | 'completed' | 'failed';
  progress: number;
}

export default function DownloadScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceDownloads, setDeviceDownloads] = useState<DeviceDownload[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await getFiles('', 1, 100);
      setFiles(res.files || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const downloadToDevice = async (file: FileItem) => {
    const name = file.name || file.path?.split('/').pop() || 'file';
    const id = `${Date.now()}-${name}`;
    setDeviceDownloads((prev) => [...prev, { id, name, status: 'downloading', progress: 0 }]);

    try {
      const url = await getDownloadUrl(file.path || name);
      const dest = Paths.document;
      const task = new DownloadTask(url, dest, {
        onProgress: (p) => {
          const progress = p.totalBytes > 0
            ? Math.round((p.bytesWritten / p.totalBytes) * 100)
            : 0;
          setDeviceDownloads((prev) =>
            prev.map((d) => (d.id === id ? { ...d, progress } : d))
          );
        },
      });

      const result = await task.downloadAsync();
      if (result) {
        setDeviceDownloads((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'completed', progress: 100 } : d))
        );
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        }
      }
    } catch (e: any) {
      setDeviceDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'failed' } : d))
      );
      Alert.alert('Download Failed', e?.message || 'Could not download file to device');
    }
  };

  const filtered = searchQuery
    ? files.filter((f) => (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const statusIcon = (s: string) => {
    switch (s) {
      case 'downloading': return <Loader color={Colors.primary} size={16} />;
      case 'completed': return <CheckCircle color={Colors.accent} size={16} />;
      case 'failed': return <XCircle color={Colors.error} size={16} />;
      default: return <Download color={Colors.textMuted} size={16} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Download color={Colors.primary} size={24} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search color={Colors.textMuted} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search files on server..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Active device downloads */}
      {deviceDownloads.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>// DOWNLOADS TO DEVICE</Text>
          {deviceDownloads.map((d) => (
            <View key={d.id} style={styles.dlItem}>
              {statusIcon(d.status)}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.dlName} numberOfLines={1}>{d.name}</Text>
                <Text style={styles.dlStatus}>
                  {d.status === 'downloading' ? `${d.progress}%` : d.status.toUpperCase()}
                </Text>
                {d.status === 'downloading' ? (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${d.progress}%` }]} />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : null}

      {/* Server files */}
      <Text style={styles.sectionTitle}>// SERVER FILES</Text>
      <Text style={styles.hint}>Tap a file to download to your device</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.path || item.name || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fileCard} onPress={() => downloadToDevice(item)}>
              <FileAudio color={Colors.textMuted} size={20} />
              <Text style={styles.fileName} numberOfLines={1}>{item.name || item.path?.split('/').pop()}</Text>
              <Download color={Colors.primary} size={18} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>No files on server</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 10,
  },
  title: { color: Colors.text, fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12,
    height: 44, marginBottom: 15,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  hint: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginBottom: 10 },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11,
    marginBottom: 6, marginTop: 10, letterSpacing: 1,
  },
  dlItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: Colors.border,
  },
  dlName: { color: Colors.text, fontFamily: 'monospace', fontSize: 12 },
  dlStatus: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  progressBar: { height: 3, backgroundColor: Colors.border, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: 14, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  fileName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 },
});

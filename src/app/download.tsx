import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Alert, Platform
} from 'react-native';
import { Paths, DownloadTask, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/Colors';
import { getFiles, getDownloadUrl, startDownload } from '@/api/client';
import { Download, FileAudio, CheckCircle, XCircle, Clock, Loader, Search, Link } from 'lucide-react-native';
import type { FileItem } from '@/types/api';

interface DeviceDownload {
  id: string;
  name: string;
  status: 'downloading' | 'completed' | 'failed';
  progress: number;
  fileUri?: string;
}

export default function DownloadScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlStatus, setUrlStatus] = useState('');

  // Device downloads
  const [deviceDownloads, setDeviceDownloads] = useState<DeviceDownload[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await getFiles('', 1, 50);
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
      const url = getDownloadUrl(file.path || name);
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
          prev.map((d) => (d.id === id ? { ...d, status: 'completed', progress: 100, fileUri: result.uri } : d))
        );

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        } else {
          Alert.alert('Downloaded', `Saved to device`);
        }
      }
    } catch {
      setDeviceDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'failed' } : d))
      );
    }
  };

  const handleUrlDownload = async () => {
    if (!url) return;
    setUrlLoading(true);
    setUrlStatus('Starting server download...');
    try {
      await startDownload(url, 'audio');
      setUrlStatus('[OK] Server download started');
      setUrl('');
      setTimeout(() => { setUrlStatus(''); setShowUrlInput(false); }, 2000);
    } catch (e: any) {
      setUrlStatus(`[!] ${e.message}`);
    } finally {
      setUrlLoading(false);
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
      default: return <Clock color={Colors.textMuted} size={16} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Download color={Colors.primary} size={24} />
      </View>

      {/* Search + URL toggle */}
      <View style={styles.toolRow}>
        <View style={styles.searchBox}>
          <Search color={Colors.textMuted} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search server files..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.toolBtn, showUrlInput && styles.toolBtnActive]}
          onPress={() => setShowUrlInput(!showUrlInput)}
        >
          <Link color={showUrlInput ? Colors.background : Colors.primary} size={18} />
        </TouchableOpacity>
      </View>

      {/* URL download input (server-side) */}
      {showUrlInput ? (
        <View style={styles.urlSection}>
          <TextInput
            style={styles.urlInput}
            placeholder="YouTube / Spotify URL..."
            placeholderTextColor={Colors.textMuted}
            value={url}
            onChangeText={setUrl}
          />
          <TouchableOpacity style={styles.urlBtn} onPress={handleUrlDownload} disabled={urlLoading || !url}>
            {urlLoading ? <ActivityIndicator color={Colors.background} size={18} /> : <Text style={styles.urlBtnText}>DL</Text>}
          </TouchableOpacity>
        </View>
      ) : null}
      {urlStatus ? (
        <View style={styles.urlStatus}>
          <Text style={styles.urlStatusText}>{urlStatus}</Text>
        </View>
      ) : null}

      {/* Download to device section */}
      {deviceDownloads.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>// TO DEVICE</Text>
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

      {/* Server files to pick */}
      <Text style={styles.sectionTitle}>// SERVER FILES</Text>
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
          ListEmptyComponent={
            <Text style={styles.empty}>No files found on server</Text>
          }
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
  toolRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  toolBtn: {
    width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface,
  },
  toolBtnActive: { backgroundColor: Colors.primary },
  urlSection: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  urlInput: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.accent,
    borderRadius: 8, paddingHorizontal: 14, color: Colors.text, fontFamily: 'monospace', fontSize: 13, height: 44,
  },
  urlBtn: {
    width: 50, height: 44, borderRadius: 8, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  urlBtnText: { color: Colors.background, fontWeight: 'bold', fontFamily: 'monospace' },
  urlStatus: {
    backgroundColor: '#05050A', padding: 10, borderRadius: 6, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.secondary,
  },
  urlStatusText: { color: Colors.secondary, fontFamily: 'monospace', fontSize: 11 },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11,
    marginBottom: 8, marginTop: 12, letterSpacing: 1,
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
    padding: 14, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border,
    gap: 12,
  },
  fileName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 },
});

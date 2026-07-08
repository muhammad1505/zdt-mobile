import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, Alert
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { startDownload, getDownloads, cancelDownload, retryDownload } from '@/api/client';
import { Download, Music, Video, Link, XCircle, RotateCw, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import type { DownloadItem } from '@/types/api';

export default function DownloadScreen() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'audio' | 'video'>('audio');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await getDownloads(1);
      setQueue(res.downloads || []);
    } catch {
      // ignore
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleDownload = async () => {
    if (!url) return;
    setLoading(true);
    setStatus('Menghubungkan ke Server...');
    try {
      await startDownload(url, format);
      setStatus('[OK] Unduhan dimulai');
      setUrl('');
      setTimeout(() => setStatus(''), 3000);
      fetchQueue();
    } catch (err: any) {
      setStatus(`[ERROR] ${err?.message || 'Koneksi ke Server Gagal'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelDownload(id);
      fetchQueue();
    } catch {}
  };

  const handleRetry = async (id: string) => {
    try {
      await retryDownload(id);
      fetchQueue();
    } catch {}
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'downloading': return <Clock color={Colors.primary} size={16} />;
      case 'completed': return <CheckCircle color={Colors.accent} size={16} />;
      case 'failed': return <AlertCircle color={Colors.error} size={16} />;
      case 'cancelled': return <XCircle color={Colors.textMuted} size={16} />;
      default: return <Clock color={Colors.textMuted} size={16} />;
    }
  };

  const renderItem = ({ item }: { item: DownloadItem }) => (
    <View style={styles.queueItem}>
      <View style={styles.queueItemLeft}>
        {statusIcon(item.status)}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.queueItemTitle} numberOfLines={1}>
            {item.title || item.url.slice(0, 50)}
          </Text>
          <Text style={styles.queueItemStatus}>
            {item.status.toUpperCase()}
            {item.progress > 0 ? ` (${item.progress}%)` : ''}
          </Text>
          {item.error ? (
            <Text style={styles.queueItemError} numberOfLines={2}>{item.error}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.queueItemActions}>
        {item.status === 'failed' ? (
          <TouchableOpacity onPress={() => handleRetry(item.id)} style={styles.actionBtn}>
            <RotateCw color={Colors.accent} size={18} />
          </TouchableOpacity>
        ) : null}
        {item.status === 'queued' || item.status === 'downloading' ? (
          <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.actionBtn}>
            <XCircle color={Colors.secondary} size={18} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Downloader</Text>
        <Text style={styles.subtitle}>Enter media URL to extract</Text>
      </View>

      <View style={styles.inputContainer}>
        <Link color={Colors.primary} size={20} style={{ marginLeft: 15 }} />
        <TextInput
          style={styles.input}
          placeholder="https://youtube.com/... or spotify.com/..."
          placeholderTextColor={Colors.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formatSelector}>
        <TouchableOpacity
          style={[styles.formatBtn, format === 'audio' && styles.formatBtnActive]}
          onPress={() => setFormat('audio')}
        >
          <Music color={format === 'audio' ? Colors.background : Colors.primary} size={20} />
          <Text style={[styles.formatText, format === 'audio' && styles.formatTextActive]}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formatBtn, format === 'video' && styles.formatBtnActive]}
          onPress={() => setFormat('video')}
        >
          <Video color={format === 'video' ? Colors.background : Colors.primary} size={20} />
          <Text style={[styles.formatText, format === 'video' && styles.formatTextActive]}>Video</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.downloadBtn, (!url || loading) && styles.downloadBtnDisabled]}
        onPress={handleDownload}
        disabled={loading || !url}
      >
        {loading ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <>
            <Download color={url ? Colors.background : Colors.textMuted} size={24} />
            <Text style={[styles.downloadText, !url && styles.downloadTextDisabled]}>Download</Text>
          </>
        )}
      </TouchableOpacity>

      {status ? (
        <View style={styles.statusTerminal}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.queueSection}>
        <Text style={styles.queueSectionTitle}>Queue ({queue.length})</Text>
        <FlatList
          data={queue.filter((d) => d.status !== 'completed')}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active downloads</Text>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: { marginBottom: 20 },
  title: {
    color: Colors.primary, fontSize: 26, fontFamily: 'monospace',
    fontWeight: '900', letterSpacing: 2,
  },
  subtitle: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 14, marginTop: 5 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, height: 56, marginBottom: 15,
  },
  input: {
    flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13,
    marginLeft: 12, height: '100%',
  },
  formatSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  formatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    padding: 14, borderRadius: 8, marginHorizontal: 4,
  },
  formatBtnActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  formatText: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold', marginLeft: 8 },
  formatTextActive: { color: Colors.background },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, height: 56, borderRadius: 8,
  },
  downloadBtnDisabled: { backgroundColor: Colors.surfaceHighlight },
  downloadText: {
    color: Colors.background, fontFamily: 'monospace', fontWeight: '900',
    fontSize: 18, letterSpacing: 4, marginLeft: 10,
  },
  downloadTextDisabled: { color: Colors.textMuted },
  statusTerminal: {
    marginTop: 15, backgroundColor: '#05050A', padding: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.secondary,
  },
  statusText: { color: Colors.secondary, fontFamily: 'monospace', fontSize: 12 },

  queueSection: { flex: 1, marginTop: 20 },
  queueSectionTitle: {
    color: Colors.primary, fontFamily: 'monospace', fontSize: 14,
    fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1,
    borderBottomColor: Colors.border, paddingBottom: 8,
  },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, padding: 12, borderRadius: 6,
    marginBottom: 6, borderWidth: 1, borderColor: Colors.border,
  },
  queueItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  queueItemTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 12 },
  queueItemStatus: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  queueItemError: { color: Colors.error, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  queueItemActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  emptyText: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 12, textAlign: 'center', marginTop: 20 },
});

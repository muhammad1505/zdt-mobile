import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient, getCsrfToken } from '@/api/client';
import { getItemAsync } from '@/utils/storage';
import { FileAudio, Database, Play, Pause, Square } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

export default function FilesScreen() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await apiClient.get('/files');
      setFiles(res.data.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  };

  const playFile = async (filename: string) => {
    try {
      const ip = await getItemAsync('zdt_server_ip');
      if (!ip) {
        Alert.alert('Error', 'Server IP not configured. Go to Settings first.');
        return;
      }

      const [host, port] = ip.includes(':') ? ip.split(':') : [ip, '5000'];

      if (filename === playingFile) {
        // Toggle play/pause for the same file
        if (status.playing) {
          player.pause();
        } else {
          player.play();
        }
        return;
      }

      // Switch to a different file
      const streamUrl = `http://${host}:${port}/stream/${filename}`;
      setPlayingFile(filename);
      player.replace(streamUrl);
      player.play();
    } catch (err) {
      console.error('Play error:', err);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleFileAction = async (action: string, filename: string) => {
    try {
      const csrf = await getCsrfToken();
      const res = await apiClient.post('/tools', { action, filename }, { headers: { 'X-CSRF-Token': csrf } });
      Alert.alert('Success', res.data.message);
    } catch (err: any) {
      Alert.alert('Error', '[!] Action failed: ' + (err.message || 'Unknown error'));
    }
  };

  const renderItem = ({ item }: { item: string }) => {
    const isPlaying = playingFile === item && status.playing;
    const isPaused = playingFile === item && !status.playing && status.isLoaded;

    return (
      <View style={[styles.fileCard, isPlaying && styles.fileCardActive]}>
        <View style={styles.fileIcon}>
          <FileAudio color={isPlaying ? Colors.primary : Colors.textMuted} size={24} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, isPlaying && { color: Colors.primary }]} numberOfLines={1}>
            {item}
          </Text>
          <Text style={styles.fileMeta}>
            {isPlaying ? 'Now Playing...' : 'Cloud Streaming Server'}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleFileAction('demucs', item)}
            >
              <Text style={styles.actionText}>Demucs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: Colors.secondary }]}
              onPress={() => handleFileAction('compress', item)}
            >
              <Text style={[styles.actionText, { color: Colors.secondary }]}>Compress</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.playBtn, (isPlaying || isPaused) && styles.playBtnActive]}
          onPress={() => playFile(item)}
          onLongPress={() => { player.pause(); setPlayingFile(null); }}
        >
          {isPlaying ? (
            <Pause color={Colors.background} size={20} />
          ) : (
            <Play color={isPaused ? Colors.primary : Colors.textMuted} size={20} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cloud Library</Text>
        <Database color={Colors.primary} size={24} />
      </View>

      {playingFile && status.isLoaded && (
        <View style={styles.playingBar}>
          <Text style={styles.playingText} numberOfLines={1}>
            {status.playing ? '▶ Playing:' : '⏸ Paused:'} {playingFile}
          </Text>
          <TouchableOpacity onPress={() => { player.pause(); setPlayingFile(null); }}>
            <Square color={Colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No files found in server storage</Text>
            </View>
          }
        />
      )}
    </View>
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
  list: {
    paddingBottom: 100,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  fileCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  fileIcon: {
    marginRight: 15,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileMeta: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 20,
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  actionText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  playBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  playingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  playingText: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
});

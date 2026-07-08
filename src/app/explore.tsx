import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { getFiles, searchFiles, deleteFile, renameFile, getStreamUrl, runTool } from '@/api/client';
import { FileAudio, Database, Play, Pause, Square, Trash2, Edit3, Search, FolderUp, X, Music4 } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import type { FileItem } from '@/types/api';

interface FlattenedFile extends FileItem {
  _displayName: string;
  _isDir: boolean;
}

export default function FilesScreen() {
  const [items, setItems] = useState<FlattenedFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  const [renameModal, setRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState('');
  const [renameNew, setRenameNew] = useState('');

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await getFiles(currentPath);
      setItems((res.files || []).map((f) => ({
        ...f,
        _displayName: f.name || f.path?.split('/').pop() || '',
        _isDir: f.is_dir || false,
      })));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  };

  const doSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchMode(false); return; }
    setLoading(true);
    try {
      const res = await searchFiles(searchQuery);
      setItems((res.files || []).map((f) => ({
        ...f,
        _displayName: f.name || '',
        _isDir: false,
      })));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleDelete = (filePath: string) => {
    Alert.alert('Delete', `Delete "${filePath.split('/').pop()}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteFile(filePath); fetchFiles(); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleRename = async () => {
    if (!renameNew.trim()) return;
    try {
      await renameFile(renameTarget, renameNew.trim());
      setRenameModal(false);
      fetchFiles();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openRename = (filePath: string) => {
    setRenameTarget(filePath);
    setRenameNew(filePath.split('/').pop() || '');
    setRenameModal(true);
  };

  const playFile = async (filePath: string) => {
    try {
      if (filePath === playingFile) {
        if (status.playing) { player.pause(); } else { player.play(); }
        return;
      }
      const streamUrl = await getStreamUrl(filePath);
      setPlayingFile(filePath);
      player.replace(streamUrl);
      player.play();
    } catch {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const renderItem = ({ item }: { item: FlattenedFile }) => {
    const isPlaying = playingFile === item.path && status.playing;
    const isPaused = playingFile === item.path && !status.playing && status.isLoaded;
    const fp = item.path || item._displayName;

    return (
      <TouchableOpacity
        style={[styles.fileCard, isPlaying && styles.fileCardActive]}
        onPress={() => item._isDir ? setCurrentPath(fp) : playFile(fp)}
        onLongPress={() => {
          Alert.alert(item._displayName, '', [
            { text: 'Rename', onPress: () => openRename(fp) },
            { text: 'Demucs', onPress: () => runTool('demucs', fp).then(fetchFiles).catch(() => {}) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(fp) },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
      >
        <View style={{ marginRight: 12 }}>
          {item._isDir ? (
            <FolderUp color={Colors.accent} size={24} />
          ) : (
            <FileAudio color={isPlaying ? Colors.primary : Colors.textMuted} size={24} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fileName, isPlaying && { color: Colors.primary }]} numberOfLines={1}>
            {item._displayName}
          </Text>
          <Text style={styles.fileMeta}>
            {item._isDir ? 'Directory' : isPlaying ? 'Now Playing...' : item.size || ''}
          </Text>
        </View>
        {!item._isDir ? (
          <TouchableOpacity
            style={[styles.playBtn, (isPlaying || isPaused) && styles.playBtnActive]}
            onPress={() => playFile(fp)}
            onLongPress={() => { player.pause(); setPlayingFile(null); }}
          >
            {isPlaying ? <Pause color={Colors.background} size={18} /> : <Play color={isPaused ? Colors.primary : Colors.textMuted} size={18} />}
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Files</Text>
        <Database color={Colors.primary} size={22} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color={Colors.textMuted} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={doSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchMode(false); fetchFiles(); }}>
              <X color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {currentPath && !searchMode ? (
        <TouchableOpacity style={styles.pathBar} onPress={() => setCurrentPath('')}>
          <Text style={styles.pathText}>📁 {currentPath}</Text>
          <X color={Colors.textMuted} size={14} />
        </TouchableOpacity>
      ) : null}

      {playingFile && status.isLoaded ? (
        <View style={styles.playingBar}>
          <Text style={styles.playingText} numberOfLines={1}>
            {status.playing ? '▶ Playing:' : '⏸ Paused:'} {playingFile.split('/').pop()}
          </Text>
          <TouchableOpacity onPress={() => { player.pause(); setPlayingFile(null); }}>
            <Square color={Colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.path || item.name || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No files found</Text>
            </View>
          }
        />
      )}

      <Modal visible={renameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rename File</Text>
            <TextInput
              style={styles.modalInput}
              value={renameNew}
              onChangeText={setRenameNew}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRename}>
                <Text style={styles.modalConfirmText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  pathBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: Colors.accent,
  },
  pathText: { color: Colors.accent, fontFamily: 'monospace', fontSize: 12, flex: 1 },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, padding: 14, borderRadius: 8, marginBottom: 8,
  },
  fileCardActive: { borderColor: Colors.primary, borderWidth: 2 },
  fileName: { color: Colors.text, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  fileMeta: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 3 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  playBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  playingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary,
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
  },
  playingText: { color: Colors.text, fontFamily: 'monospace', fontSize: 12, flex: 1, marginRight: 8 },
  emptyBox: { padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 8, marginTop: 20 },
  emptyText: { color: Colors.textMuted, fontFamily: 'monospace' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 24, width: '85%' },
  modalTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  modalInput: {
    backgroundColor: Colors.background, color: Colors.text, fontFamily: 'monospace', fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 6, padding: 12, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textMuted, fontFamily: 'monospace', fontWeight: 'bold' },
  modalConfirm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: Colors.primary },
  modalConfirmText: { color: Colors.background, fontFamily: 'monospace', fontWeight: 'bold' },
});

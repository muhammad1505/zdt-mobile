import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient, getCsrfToken } from '@/api/client';
import { FileAudio, Play, Database } from 'lucide-react-native';

export default function FilesScreen() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileAction = async (action: string, filename: string) => {
    try {
      const csrf = await getCsrfToken();
      const res = await apiClient.post('/tools', { action, filename }, { headers: { 'X-CSRF-Token': csrf } });
      Alert.alert('Success', res.data.message);
    } catch (err: any) {
      Alert.alert('Error', '[!] Action failed: ' + (err.message || 'Unknown error'));
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.fileCard}>
      <View style={styles.fileIcon}>
        <FileAudio color={Colors.primary} size={24} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item}</Text>
        <Text style={styles.fileMeta}>Local Storage</Text>
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
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Archive</Text>
        <Database color={Colors.primary} size={24} />
      </View>

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
  playBtn: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
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
  }
});

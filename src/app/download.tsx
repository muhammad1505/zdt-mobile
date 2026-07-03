import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient, getCsrfToken } from '@/api/client';
import { Download, Music, Video, Link } from 'lucide-react-native';

export default function DownloadScreen() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('audio');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleDownload = async () => {
    if (!url) return;
    setLoading(true);
    setStatus('Menghubungkan ke Server...');
    
    try {
      const csrf = await getCsrfToken();
      
      setStatus('Memulai proses unduhan...');
      const res = await apiClient.post('/download', 
        { url, format },
        { headers: { 'X-CSRF-Token': csrf } }
      );
      
      if (res.data.success) {
        setStatus('[OK] Unduhan dimulai, cek Console');
        setTimeout(() => {
          setUrl('');
          setStatus('');
        }, 3000);
      } else {
        setStatus('[ERROR] ' + res.data.message);
      }
    } catch (err: any) {
      setStatus('[ERROR] Koneksi ke Server Gagal');
    } finally {
      setLoading(false);
    }
  };

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
        <Link color={Colors.primary} size={20} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="https://spotify.com/... or youtube.com/..."
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
        style={[styles.downloadBtn, !url && styles.downloadBtnDisabled]} 
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    color: Colors.primary,
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 14,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 60,
    marginBottom: 20,
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 14,
    marginLeft: 15,
    height: '100%',
  },
  formatSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  formatBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  formatText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formatTextActive: {
    color: Colors.background,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 65,
    borderRadius: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  downloadBtnDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    shadowOpacity: 0,
    elevation: 0,
  },
  downloadText: {
    color: Colors.background,
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 4,
    marginLeft: 10,
  },
  downloadTextDisabled: {
    color: Colors.textMuted,
  },
  statusTerminal: {
    marginTop: 30,
    backgroundColor: '#05050A',
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  statusText: {
    color: Colors.secondary,
    fontFamily: 'monospace',
    fontSize: 12,
  }
});

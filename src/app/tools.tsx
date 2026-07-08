import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput, FlatList
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, DownloadTask } from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { getFiles, getDownloadUrl, runTool } from '@/api/client';
import {
  Wrench, Wand2, Mic2, ListMusic, Music4, Trash2,
  ChevronLeft, Download, FileAudio, Loader, CheckCircle,
  XCircle, Search, ArrowRight
} from 'lucide-react-native';

type ViewMode = 'tools' | 'files' | 'progress';

interface ProcessJob {
  id: string;
  file: string;
  action: string;
  outputFiles: string[];
  status: 'running' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export default function ToolsScreen() {
  const [mode, setMode] = useState<ViewMode>('tools');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [jobs, setJobs] = useState<ProcessJob[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch server files
  const fetchFiles = useCallback(async () => {
    try {
      const res = await getFiles('', 1, 200);
      setFiles(res.files || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (mode === 'files') fetchFiles();
  }, [mode, fetchFiles]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const startJob = async (action: string, file: any) => {
    const fileName = file.name || file.path?.split('/').pop() || '';
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const jobId = `${Date.now()}-${action}-${fileName}`;

    const expectedOutputs: string[] = [];
    if (action === 'demucs') {
      expectedOutputs.push(`${baseName}_vokal${ext}`, `${baseName}_novokal${ext}`);
    } else if (action === 'compress') {
      expectedOutputs.push(`compressed_${fileName}`);
    } else if (action === 'sync_lyrics') {
      expectedOutputs.push(`${baseName}.lrc`);
    } else if (action === 'playlist') {
      expectedOutputs.push('ZDT_Playlist.m3u');
    }

    const job: ProcessJob = {
      id: jobId, file: fileName, action,
      outputFiles: expectedOutputs,
      status: 'running', progress: 0,
    };
    setJobs((prev) => [job, ...prev]);
    setMode('progress');

    try {
      setStatus(`Processing ${fileName}...`);
      await runTool(action, file.path || fileName);
      setStatus('Waiting for result...');

      if (expectedOutputs.length === 0) {
        // No output to download (e.g., clean action)
        setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'completed', progress: 100 } : j));
        setStatus('[OK] Done');
        return;
      }

      // Poll for output files
      await pollForOutputs(jobId, expectedOutputs);
    } catch (e: any) {
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'failed', error: e.message } : j));
      setStatus(`[!] ${e.message}`);
    }
  };

  const pollForOutputs = (jobId: string, expected: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await getFiles('', 1, 500);
          const serverFiles = res.files?.map((f: any) => f.name || f.path?.split('/').pop() || '') || [];

          const found = expected.filter((name) => serverFiles.includes(name));
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? { ...j, progress: Math.min(90, Math.round((found.length / expected.length) * 90)) }
                : j
            )
          );

          if (found.length === expected.length) {
            clearInterval(interval);
            setStatus('Downloading result...');
            // Download each output file
            setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'downloading', progress: 90 } : j));
            await downloadOutputs(found, jobId);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            // Download whatever was found
            if (found.length > 0) {
              await downloadOutputs(found, jobId);
            }
            reject(new Error('Timeout waiting for output'));
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('Polling failed'));
          }
        }
      }, 2000);

      pollingRef.current = interval;
    });
  };

  const downloadOutputs = async (names: string[], jobId: string) => {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      setStatus(`Downloading ${name}...`);
      try {
        const url = await getDownloadUrl(name);
        const task = new DownloadTask(url, Paths.document, {
          onProgress: (p) => {
            const prog = p.totalBytes > 0 ? Math.round((p.bytesWritten / p.totalBytes) * 100) : 0;
            const overall = Math.round(90 + (prog / names.length));
            setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, progress: Math.min(99, overall) } : j));
          },
        });
        const result = await task.downloadAsync();
        if (result && i === names.length - 1) {
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
        }
      } catch {}
    }
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'completed', progress: 100 } : j));
    setStatus('[OK] Downloaded to device');
  };

  const filtered = searchQuery
    ? files.filter((f: any) => (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <View style={s.container}>
      <View style={s.header}>
        {mode !== 'tools' ? (
          <TouchableOpacity onPress={() => { setMode('tools'); if (pollingRef.current) clearInterval(pollingRef.current); }}>
            <ChevronLeft color={Colors.primary} size={24} />
          </TouchableOpacity>
        ) : <View />}
        <Text style={s.title}>
          {mode === 'tools' ? 'Tools' : mode === 'files' ? 'Select File' : 'Processing'}
        </Text>
        <Wrench color={Colors.primary} size={22} />
      </View>

      {status ? (
        <View style={s.statusBox}>
          <Text style={s.statusText}>{status}</Text>
        </View>
      ) : null}

      {/* Main tools menu */}
      {mode === 'tools' && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {/* Active jobs */}
          {jobs.length > 0 ? (
            <>
              <Text style={s.sectionTitle}>// ACTIVE JOBS</Text>
              {jobs.filter((j) => j.status !== 'completed').slice(0, 3).map((j) => (
                <View key={j.id} style={s.jobCard}>
                  <View style={s.jobHeader}>
                    <Loader color={Colors.primary} size={14} />
                    <Text style={s.jobName} numberOfLines={1}>{j.file}</Text>
                    <Text style={s.jobAction}>{j.action}</Text>
                  </View>
                  <View style={s.barOuter}>
                    <View style={[s.barInner, { width: `${j.progress}%` }]} />
                  </View>
                  <Text style={s.jobProgress}>{j.progress}%</Text>
                </View>
              ))}
              {jobs.filter((j) => j.status === 'completed').length > 0 ? (
                <Text style={s.sectionTitle}>// COMPLETED</Text>
              ) : null}
              {jobs.filter((j) => j.status === 'completed').map((j) => (
                <View key={j.id} style={[s.jobCard, { borderColor: 'rgba(22,163,74,0.3)' }]}>
                  <View style={s.jobHeader}>
                    <CheckCircle color={Colors.accent} size={14} />
                    <Text style={[s.jobName, { color: Colors.accent }]} numberOfLines={1}>{j.file}</Text>
                    <Text style={s.jobAction}>{j.action}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          <Text style={s.sectionTitle}>// TOOLS</Text>
          <ToolBtn icon={<Wand2 color={Colors.primary} size={20} />} label="Clean Filenames" desc="Remove metadata from filenames" onPress={() => { setSelectedFile({ name: '', path: '' }); startJob('clean', { name: '', path: '' }); }} />
          <ToolBtn icon={<Mic2 color={Colors.secondary} size={20} />} label="Sync Lyrics" desc="Download .lrc lyrics" onPress={() => setMode('files')} fileRequired />
          <ToolBtn icon={<ListMusic color={Colors.accent} size={20} />} label="Create Playlist" desc="Generate M3U playlist" onPress={() => startJob('playlist', { name: '', path: '' })} />
          <ToolBtn icon={<Music4 color="#f59e0b" size={20} />} label="Demucs AI" desc="Vocal separation" onPress={() => setMode('files')} fileRequired />
          <ToolBtn icon={<Trash2 color={Colors.danger} size={20} />} label="Format Storage" desc="Delete all media on server" danger onPress={() => Alert.alert('Format Storage', 'All files will be deleted.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Format', style: 'destructive', onPress: () => startJob('delete_all', { name: '', path: '' }) }])} />
        </ScrollView>
      )}

      {/* File picker */}
      {mode === 'files' && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={s.searchBox}>
            <Search color={Colors.textMuted} size={16} />
            <TextInput style={s.searchInput} placeholder="Search files..." placeholderTextColor={Colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => item.path || item.name || Math.random().toString()}
            renderItem={({ item }: any) => (
              <TouchableOpacity style={s.fileCard} onPress={() => {
                setSelectedFile(item);
                const action = 'demucs'; // default
                Alert.alert('Choose Tool', item.name, [
                  { text: 'Demucs', onPress: () => startJob('demucs', item) },
                  { text: 'Sync Lyrics', onPress: () => startJob('sync_lyrics', item) },
                  { text: 'Compress', onPress: () => startJob('compress', item) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}>
                <FileAudio color={Colors.textMuted} size={18} />
                <Text style={s.fileName} numberOfLines={1}>{item.name || item.path?.split('/').pop()}</Text>
                <ArrowRight color={Colors.primary} size={16} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={s.empty}>No files</Text>}
          />
        </View>
      )}

      {/* Progress view */}
      {mode === 'progress' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Loader color={Colors.primary} size={40} />
          <Text style={s.progressTitle}>Processing on server...</Text>
          <Text style={s.progressSub}>Result will auto-download to device</Text>
          {jobs.length > 0 && (
            <View style={{ width: '100%', marginTop: 20 }}>
              <View style={s.barOuter}>
                <View style={[s.barInner, { width: `${jobs[0].progress}%` }]} />
              </View>
              <Text style={s.progressPct}>{jobs[0].progress}%</Text>
            </View>
          )}
          <TouchableOpacity style={s.backBtn} onPress={() => setMode('tools')}>
            <Text style={s.backBtnText}>Back to Tools</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const ToolBtn = ({ icon, label, desc, onPress, danger, fileRequired }: any) => (
  <TouchableOpacity style={[s.btn, danger && s.danger]} onPress={onPress}>
    {icon}
    <View style={{ flex: 1, marginLeft: 14 }}>
      <Text style={[s.btnLabel, danger && { color: Colors.danger }]}>{label}</Text>
      <Text style={[s.btnDesc, danger && { color: Colors.danger }]}>{desc}</Text>
    </View>
    {fileRequired ? <ArrowRight color={Colors.textMuted} size={16} /> : null}
  </TouchableOpacity>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 20, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1, flex: 1, textAlign: 'center' },
  statusBox: { backgroundColor: Colors.card, borderRadius: 8, padding: 12, margin: 16, marginBottom: 0, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  statusText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  sectionTitle: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  danger: { borderColor: Colors.danger, backgroundColor: 'rgba(220,38,38,0.05)' },
  btnLabel: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
  btnDesc: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: Colors.border, marginVertical: 16 },
  searchInput: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 8, height: '100%' },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  fileName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 },
  jobCard: { backgroundColor: Colors.surface, padding: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobName: { flex: 1, color: Colors.text, fontFamily: 'monospace', fontSize: 12 },
  jobAction: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' },
  barOuter: { height: 4, backgroundColor: Colors.card, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  barInner: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  jobProgress: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 4, textAlign: 'right' },
  progressTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 18, fontWeight: '700', marginTop: 20 },
  progressSub: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 12, marginTop: 8, textAlign: 'center' },
  progressPct: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, textAlign: 'center', marginTop: 8, fontWeight: '700' },
  backBtn: { marginTop: 30, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary },
  backBtnText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
});

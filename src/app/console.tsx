import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getLogs, clearLogs, getActivityLogs } from '@/api/client';
import { TerminalSquare, RefreshCcw, Trash2, History } from 'lucide-react-native';
import type { LogEntry, ActivityLogEntry } from '@/types/api';

type Tab = 'logs' | 'activity';

export default function ConsoleScreen() {
  const [tab, setTab] = useState<Tab>('logs');
  const [logs, setLogs] = useState<(LogEntry | ActivityLogEntry)[]>([]);
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    try {
      if (tab === 'logs') {
        const data = await getLogs(100);
        setLogs(data);
        setRaw(data.map((l) => {
          const entry = l as LogEntry;
          return `[${entry.level}] ${entry.message} ${entry.module ? `(${entry.module})` : ''}`;
        }).filter(Boolean).join('\n') || 'No entries yet.');
      } else {
        const data = await getActivityLogs(50);
        setLogs(data);
        setRaw(data.map((a) => {
          const entry = a as ActivityLogEntry;
          return `[${entry.action}] ${entry.detail || ''} ${entry.resource ? `→ ${entry.resource}` : ''} — ${entry.timestamp}`;
        }).filter(Boolean).join('\n') || 'No entries yet.');
      }
    } catch {
      setRaw('[!] Connection error. Server might be offline.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const handleClear = async () => {
    try {
      await clearLogs();
      setRaw('');
      setLogs([]);
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [tab, fetchData]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchData, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh, fetchData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TerminalSquare color={Colors.primary} size={22} />
          <Text style={styles.title}>Console</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, autoRefresh && styles.activeBtn]}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCcw color={autoRefresh ? Colors.background : Colors.primary} size={18} />
          </TouchableOpacity>
          {tab === 'logs' ? (
            <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleClear}>
              <Trash2 color={Colors.error} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'logs' && styles.tabActive]}
          onPress={() => setTab('logs')}
        >
          <TerminalSquare color={tab === 'logs' ? Colors.background : Colors.primary} size={16} />
          <Text style={[styles.tabText, tab === 'logs' && styles.tabTextActive]}>Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'activity' && styles.tabActive]}
          onPress={() => setTab('activity')}
        >
          <History color={tab === 'activity' ? Colors.background : Colors.accent} size={16} />
          <Text style={[styles.tabText, tab === 'activity' && styles.tabTextActive]}>Activity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.terminalBox}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={styles.scrollView}
          >
            <Text style={styles.logText}>{raw || 'No output.'}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 10,
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: Colors.text, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, borderWidth: 1, borderColor: Colors.primary, borderRadius: 5, backgroundColor: Colors.surface },
  activeBtn: { backgroundColor: Colors.primary },
  dangerBtn: { borderColor: Colors.error },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: Colors.background },

  terminalBox: { flex: 1, backgroundColor: '#05050A', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 80 },
  scrollView: { padding: 15 },
  logText: { color: Colors.secondary, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
});

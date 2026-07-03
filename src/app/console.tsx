import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/api/client';
import { TerminalSquare, RefreshCcw, Trash2 } from 'lucide-react-native';
import { getCsrfToken } from '@/api/client';

export default function ConsoleScreen() {
  const [logs, setLogs] = useState<string>('Connecting to Server...');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/logs');
      if (res.data && res.data.log) {
        setLogs(res.data.log);
      } else {
        setLogs('No active tasks.');
      }
    } catch (err: any) {
      setLogs('[!] Connection error. Server might be offline.');
    }
  };

  const clearLogs = async () => {
    try {
      const csrf = await getCsrfToken();
      await apiClient.post('/logs/clear', {}, { headers: { 'X-CSRF-Token': csrf } });
      setLogs('');
    } catch (err: any) {}
  };

  useEffect(() => {
    fetchLogs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TerminalSquare color={Colors.primary} size={24} style={{marginRight: 10}} />
          <Text style={styles.title}>LIVE PROCESS</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, autoRefresh && styles.activeBtn]} 
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCcw color={autoRefresh ? Colors.background : Colors.primary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={clearLogs}>
            <Trash2 color={Colors.error} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.terminalBox}>
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          style={styles.scrollView}
        >
          <Text style={styles.logText}>
            {logs || 'No output.'}
          </Text>
        </ScrollView>
      </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 5,
    backgroundColor: Colors.surface,
  },
  activeBtn: {
    backgroundColor: Colors.primary,
  },
  dangerBtn: {
    borderColor: Colors.error,
  },
  terminalBox: {
    flex: 1,
    backgroundColor: '#05050A',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 80,
  },
  scrollView: {
    padding: 15,
  },
  logText: {
    color: Colors.secondary,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  }
});

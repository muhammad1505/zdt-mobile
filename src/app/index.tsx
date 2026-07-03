import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/api/client';
import { Cpu, HardDrive, Activity, Wifi } from 'lucide-react-native';

export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setError('');
      const res = await apiClient.get('/stats');
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || 'Connection lost');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SYSTEM_DIAGNOSTICS</Text>
        <Wifi color={error ? Colors.error : Colors.primary} size={24} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>[!] SERVER OFFLINE: {error}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Cpu color={Colors.primary} size={20} />
            <Text style={styles.cardTitle}>CPU_LOAD</Text>
          </View>
          <Text style={styles.cardValue}>{stats?.cpu || '0%'}%</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity color={Colors.secondary} size={20} />
            <Text style={styles.cardTitle}>RAM_USAGE</Text>
          </View>
          <Text style={styles.cardValue}>{stats?.ram || '0%'}%</Text>
        </View>

        <View style={[styles.card, { width: '100%' }]}>
          <View style={styles.cardHeader}>
            <HardDrive color={Colors.accent} size={20} />
            <Text style={styles.cardTitle}>STORAGE</Text>
          </View>
          <Text style={styles.cardValue}>{stats?.storage || '0%'}</Text>
        </View>
      </View>

      <View style={styles.logBox}>
        <Text style={styles.logTitle}>// SYSTEM_UPTIME</Text>
        <Text style={styles.logText}>{stats?.uptime || 'N/A'}</Text>
        <Text style={styles.logTitle}>// CORE_TEMP</Text>
        <Text style={styles.logText}>{stats?.temp || 'N/A'}</Text>
        <Text style={styles.logTitle}>// OS_VERSION</Text>
        <Text style={styles.logText}>{stats?.os_name || 'N/A'}</Text>
      </View>
    </ScrollView>
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
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 42, 42, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 15,
    width: '47%',
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    marginLeft: 8,
  },
  cardValue: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  logBox: {
    marginTop: 25,
    backgroundColor: '#05050A',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    borderRadius: 5,
  },
  logTitle: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 10,
  },
  logText: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 5,
  }
});

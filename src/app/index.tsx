import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getServerInfo, getDashboardStats, getVpnStatus } from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import { HardDrive, Activity, Wifi, CheckCircle2, Server } from 'lucide-react-native';
import type { ServerInfoResponse, DashboardStats } from '@/types/api';

export default function DashboardScreen() {
  const { connected, info, stats, vpnStatus, setInfo, setStats, setVpnStatus, setConnected } = useServerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [serverInfo] = await Promise.all([
        getServerInfo(),
        getDashboardStats().catch(() => null),
        getVpnStatus().catch(() => null),
      ]);
      if (serverInfo) setConnected(true);
    } catch (err: any) {
      setError(err?.message || 'Connection lost');
      setConnected(false);
    }
  }, [setConnected]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const svcStatus = (active: boolean | undefined | null) =>
    active ? 'ACTIVE' : 'OFFLINE';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Wifi color={connected ? Colors.primary : Colors.error} size={24} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>[!] {error}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity color={Colors.primary} size={20} />
            <Text style={styles.cardTitle}>Downloads</Text>
          </View>
          <Text style={styles.cardValue}>{stats?.total_downloads ?? info?.file_count ?? '0'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CheckCircle2 color={Colors.secondary} size={20} />
            <Text style={styles.cardTitle}>Total Files</Text>
          </View>
          <Text style={styles.cardValue}>{info?.file_count || '0'}</Text>
        </View>

        <View style={[styles.card, { width: '100%' }]}>
          <View style={styles.cardHeader}>
            <HardDrive color={Colors.accent} size={20} />
            <Text style={styles.cardTitle}>Storage Free</Text>
          </View>
          <Text style={styles.cardValue}>{info?.storage_free || '0 GB'}</Text>
        </View>

        {vpnStatus ? (
          <View style={[styles.card, { width: '100%' }]}>
            <View style={styles.cardHeader}>
              <Server color={vpnStatus.connected ? Colors.primary : Colors.textMuted} size={20} />
              <Text style={styles.cardTitle}>VPN</Text>
            </View>
            <Text style={[styles.cardValue, { fontSize: 18 }]}>
              {vpnStatus.connected ? `Connected ${vpnStatus.ip || ''}` : 'Disconnected'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.logBox}>
        <Text style={styles.logTitle}>// ZDT Version</Text>
        <Text style={styles.logText}>{info?.version || 'N/A'}</Text>
        <Text style={styles.logTitle}>// Target Directory</Text>
        <Text style={styles.logText}>{info?.target_dir || 'N/A'}</Text>
        <Text style={styles.logTitle}>// Watcher Daemon</Text>
        <Text style={styles.logText}>{svcStatus(info?.watcher)}</Text>
        <Text style={styles.logTitle}>// Telegram Bot</Text>
        <Text style={styles.logText}>{svcStatus(info?.telegram)}</Text>
        {info?.tools ? (
          <>
            <Text style={styles.logTitle}>// Tools</Text>
            {Object.entries(info.tools).map(([name, ver]) => (
              <Text key={name} style={styles.logText}>
                {name}: {ver}
              </Text>
            ))}
          </>
        ) : null}
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
  },
});

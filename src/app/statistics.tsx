import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { getDashboardStats, getDownloads } from '@/api/client';
import { BarChart3, HardDrive, Download, Clock, ArrowUpRight } from 'lucide-react-native';
import type { DashboardStats } from '@/types/api';

export default function StatisticsScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        getDashboardStats().catch(() => null),
        getDownloads(1).catch(() => ({ downloads: [] })),
      ]);
      setStats(s);
      setRecent((d.downloads || []).slice(0, 10));
    } catch {}
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  const StatBlock = ({ label, value, color }: any) => (
    <View style={s.block}>
      <Text style={[s.blockValue, { color }]}>{value ?? '...'}</Text>
      <Text style={s.blockLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Statistics</Text>
        <BarChart3 color="#d97706" size={22} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" />}
      >
        <View style={s.statRow}>
          <StatBlock label="Total Downloads" value={stats?.total_downloads || 0} color="#d97706" />
          <StatBlock label="Total Files" value={stats?.total_files || 0} color="#06b6d4" />
          <StatBlock label="Storage Free" value={stats?.storage_free || 'N/A'} color="#16a34a" />
          <StatBlock label="Uptime" value={stats?.uptime || 'N/A'} color="#f59e0b" />
        </View>

        {stats?.storage_total ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>// STORAGE</Text>
            <View style={s.barOuter}>
              <View style={[s.barInner, { width: `${Math.min(100, ((parseFloat(String(stats.storage_used || '0')) / parseFloat(String(stats.storage_total || '1'))) * 100))}%` }]} />
            </View>
            <Text style={s.barLabel}>
              {stats.storage_used || '0'} GB / {stats.storage_total} GB used
            </Text>
          </View>
        ) : null}

        {stats?.cpu || stats?.ram ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>// SYSTEM</Text>
            <View style={s.row}>
              <Text style={s.rowLabel}>CPU</Text>
              <Text style={s.rowValue}>{stats.cpu}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>RAM</Text>
              <Text style={s.rowValue}>{stats.ram}</Text>
            </View>
            {stats.os ? (
              <View style={s.row}>
                <Text style={s.rowLabel}>OS</Text>
                <Text style={s.rowValue}>{stats.os}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {recent.length > 0 ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>// RECENT DOWNLOADS</Text>
            {recent.map((d: any) => (
              <View key={d.id} style={s.dlRow}>
                <Download color="#78716c" size={14} />
                <Text style={s.dlName} numberOfLines={1}>{d.title || d.url?.slice(0, 40) || d.id}</Text>
                <Text style={s.dlStatus}>{d.status}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,162,158,0.08)',
  },
  title: { color: '#fef3c7', fontSize: 20, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  block: { width: '46%', backgroundColor: '#141211', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(168,162,158,0.06)' },
  blockValue: { fontSize: 22, fontFamily: 'monospace', fontWeight: '700' },
  blockLabel: { color: '#78716c', fontFamily: 'monospace', fontSize: 10, marginTop: 4, letterSpacing: 0.5 },
  card: { marginHorizontal: 16, backgroundColor: '#141211', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(168,162,158,0.06)', marginBottom: 12 },
  sectionTitle: { color: '#78716c', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  barOuter: { height: 8, backgroundColor: '#1c1917', borderRadius: 4, overflow: 'hidden' },
  barInner: { height: 8, backgroundColor: '#d97706', borderRadius: 4 },
  barLabel: { color: '#a8a29e', fontFamily: 'monospace', fontSize: 11, marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(168,162,158,0.04)' },
  rowLabel: { color: '#78716c', fontFamily: 'monospace', fontSize: 12 },
  rowValue: { color: '#fef3c7', fontFamily: 'monospace', fontSize: 12, fontWeight: '600' },
  dlRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(168,162,158,0.04)' },
  dlName: { flex: 1, color: '#fef3c7', fontFamily: 'monospace', fontSize: 11 },
  dlStatus: { color: '#78716c', fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' },
});

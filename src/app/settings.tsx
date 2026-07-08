import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { getItemAsync, setItemAsync } from '@/utils/storage';
import { getSettings, updateSettings, getUsers, createUser, deleteUser, getApiKeys, generateApiKey, revokeApiKey } from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import { Server, Key, User, X } from 'lucide-react-native';
import type { User as UserType, ApiKey } from '@/types/api';

export default function SettingsScreen() {
  const { info } = useServerStore();
  const [activeTab, setActiveTab] = useState<'connection' | 'server' | 'users' | 'keys'>('connection');

  // Connection
  const [ip, setIp] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [serverSettings, setServerSettings] = useState<Record<string, any>>({});

  // Users
  const [users, setUsers] = useState<UserType[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const savedIp = await getItemAsync('zdt_server_ip');
      const savedApiKey = await getItemAsync('zdt_api_key');
      if (savedIp) setIp(savedIp);
      else if (process.env.EXPO_PUBLIC_SERVER_IP) setIp(process.env.EXPO_PUBLIC_SERVER_IP);
      if (savedApiKey) setApiKey(savedApiKey);
      else if (process.env.EXPO_PUBLIC_API_KEY) setApiKey(process.env.EXPO_PUBLIC_API_KEY);

      try {
        const [s, u, k] = await Promise.all([
          getSettings().catch(() => ({})),
          getUsers().catch(() => []),
          getApiKeys().catch(() => []),
        ]);
        setServerSettings(s as Record<string, any>);
        setUsers(u);
        setApiKeys(k);
      } catch {}
    })();
  }, []);

  const handleSaveConnection = async () => {
    setSaving(true);
    await setItemAsync('zdt_server_ip', ip);
    await setItemAsync('zdt_api_key', apiKey);
    setSaving(false);
    Alert.alert('Saved', 'Connection settings saved. Restart app to apply.');
  };

  const handleSaveSettings = async (key: string, value: string) => {
    try {
      await updateSettings({ [key]: value });
      setServerSettings((prev) => ({ ...prev, [key]: value }));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) return;
    try {
      await createUser(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      const u = await getUsers();
      setUsers(u);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteUser = (id: number, username: string) => {
    Alert.alert('Delete User', `Delete "${username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteUser(id); setUsers((prev) => prev.filter((u) => u.id !== id)); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleGenerateKey = async () => {
    try {
      const key = await generateApiKey(newKeyLabel || undefined);
      setApiKeys((prev) => [...prev, key]);
      setNewKeyLabel('');
      Alert.alert('Key Generated', `Key: ${key.key}\n\nSave this — it won't be shown again.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRevokeKey = (id: number) => {
    Alert.alert('Revoke Key', 'Revoke this API key?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive',
        onPress: async () => {
          try { await revokeApiKey(id); setApiKeys((prev) => prev.filter((k) => k.id !== id)); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const Tabs = () => (
    <View style={styles.tabRow}>
      {(['connection', 'server', 'users', 'keys'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.title}>Settings</Text>
      <Tabs />

      {/* Connection Tab */}
      {activeTab === 'connection' && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>// Connection</Text>
          <View style={styles.inputGroup}>
            <Server color={Colors.primary} size={18} />
            <TextInput
              style={styles.input}
              placeholder="Server IP (e.g. 192.168.1.5:2000)"
              placeholderTextColor={Colors.textMuted}
              value={ip}
              onChangeText={setIp}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Key color={Colors.primary} size={18} />
            <TextInput
              style={styles.input}
              placeholder="API Key"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={apiKey}
              onChangeText={setApiKey}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSaveConnection} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.buttonText}>Save Connection</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Server Settings Tab */}
      {activeTab === 'server' && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>// Server Info</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Target: {serverSettings.storage?.target_dir as string || 'N/A'}</Text>
            <Text style={styles.infoText}>Format: {serverSettings.download?.default_format as string || 'audio'}</Text>
            <Text style={styles.infoText}>Audio Quality: {serverSettings.download?.audio_quality as string || 'best'}</Text>
            <Text style={styles.infoText}>Video Max: {serverSettings.download?.video_max_resolution as string || '1080p'}</Text>
            <Text style={styles.infoText}>Bot: {serverSettings.telegram?.enabled ? 'Enabled' : 'Disabled'}</Text>
            <Text style={styles.infoText}>VPN: {serverSettings.vpn?.connected ? 'Connected' : 'Disconnected'}</Text>
          </View>
          {info && (
            <View style={[styles.infoBox, { marginTop: 10 }]}>
              <Text style={styles.infoText}>Version: {info.version}</Text>
              <Text style={styles.infoText}>Storage: {info.storage_free}</Text>
              <Text style={styles.infoText}>Files: {info.file_count}</Text>
              <Text style={styles.infoText}>Host: {serverSettings.server?.hostname as string || 'N/A'}</Text>
              <Text style={styles.infoText}>Uptime: {serverSettings.server?.uptime != null ? `${Math.floor((serverSettings.server?.uptime as number) / 3600)}h` : 'N/A'}</Text>
            </View>
          )}
        </View>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>// Users</Text>
          {users.map((u) => (
            <View key={u.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <User color={Colors.primary} size={18} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.listItemTitle}>{u.username}</Text>
                  <Text style={styles.listItemSub}>{u.role} {u.is_active ? '(active)' : ''}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteUser(u.id, u.username)}>
                <X color={Colors.error} size={18} />
              </TouchableOpacity>
            </View>
          ))}
          <Text style={[styles.sectionLabel, { marginTop: 15 }]}>// Add User</Text>
          <View style={styles.inputGroup}>
            <User color={Colors.primary} size={18} />
            <TextInput style={styles.input} placeholder="Username" placeholderTextColor={Colors.textMuted} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
          </View>
          <View style={styles.inputGroup}>
            <Key color={Colors.primary} size={18} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textMuted} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.accent }]} onPress={handleCreateUser}>
            <Text style={styles.buttonText}>Create User</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>// API Keys</Text>
          {apiKeys.map((k) => (
            <View key={k.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Key color={Colors.secondary} size={18} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.listItemTitle}>{k.label || 'Unnamed'}</Text>
                  <Text style={styles.listItemSub}>{k.role} · {k.is_active ? 'active' : 'revoked'}</Text>
                </View>
              </View>
              {k.is_active ? (
                <TouchableOpacity onPress={() => handleRevokeKey(k.id)}>
                  <X color={Colors.error} size={18} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <Text style={[styles.sectionLabel, { marginTop: 15 }]}>// Generate Key</Text>
          <View style={styles.inputGroup}>
            <Key color={Colors.secondary} size={18} />
            <TextInput style={styles.input} placeholder="Label (optional)" placeholderTextColor={Colors.textMuted} value={newKeyLabel} onChangeText={setNewKeyLabel} />
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.accent }]} onPress={handleGenerateKey}>
            <Text style={styles.buttonText}>Generate Key</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  title: {
    color: Colors.primary, fontSize: 22, fontFamily: 'monospace', fontWeight: 'bold',
    textAlign: 'center', marginBottom: 20,
  },
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 6 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: Colors.background },
  card: {
    backgroundColor: Colors.surface, padding: 20, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11,
    marginBottom: 12, letterSpacing: 1,
  },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 14, marginBottom: 15, height: 50,
  },
  input: { flex: 1, color: Colors.text, marginLeft: 12, fontFamily: 'monospace', fontSize: 14, height: '100%' },
  inputLabel: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 12 },
  button: {
    backgroundColor: Colors.primary, height: 50, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 5,
  },
  buttonText: { color: Colors.background, fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 },
  infoBox: {
    backgroundColor: '#05050A', padding: 12, borderRadius: 6, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  infoText: { color: Colors.text, fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, padding: 12, borderRadius: 6,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemTitle: { color: Colors.text, fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },
  listItemSub: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
});

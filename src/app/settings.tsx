import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { getItemAsync, setItemAsync } from '@/utils/storage';
import { getSettings, getServerInfo } from '@/api/client';
import { useServerStore } from '@/store/serverStore';
import { Server, Key, Wifi, HardDrive, Activity, Bot } from 'lucide-react-native';

export default function SettingsScreen() {
  const { info, connected } = useServerStore();
  const [ip, setIp] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [serverSettings, setServerSettings] = useState<Record<string, any>>({});
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
        const s = await getSettings();
        setServerSettings(s as Record<string, any>);
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await setItemAsync('zdt_server_ip', ip);
    await setItemAsync('zdt_api_key', apiKey);
    setSaving(false);
    Alert.alert('Saved', 'Connection saved. Restart app to apply.');
  };

  const svc = serverSettings;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>Settings</Text>

      {/* Connection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>// Connection</Text>
        <View style={styles.inputGroup}>
          <Server color={Colors.primary} size={18} />
          <TextInput
            style={styles.input}
            placeholder="Server IP (optional)"
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
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.buttonText}>Save & Restart</Text>}
        </TouchableOpacity>
      </View>

      {/* Server Status */}
      {connected ? (
        <View style={[styles.card, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>// Server</Text>
          <View style={styles.row}>
            <Wifi color={Colors.primary} size={18} />
            <Text style={styles.rowText}>Connected</Text>
          </View>
          <View style={styles.row}>
            <Activity color={Colors.accent} size={18} />
            <Text style={styles.rowText}>Version: {info?.version || svc.server?.version || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <HardDrive color={Colors.secondary} size={18} />
            <Text style={styles.rowText}>Storage: {info?.storage_free || 'N/A'} · {info?.file_count || 0} files</Text>
          </View>
          <View style={styles.row}>
            <Bot color={Colors.textMuted} size={18} />
            <Text style={styles.rowText}>
              Watcher: {svc.storage?.target_dir || info?.target_dir || 'N/A'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.card, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>// Status</Text>
          <Text style={styles.muted}>Enter API Key to connect to server.</Text>
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
  card: {
    backgroundColor: Colors.surface, padding: 20, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.textMuted, fontFamily: 'monospace', fontSize: 11,
    marginBottom: 15, letterSpacing: 1,
  },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 14, marginBottom: 15, height: 50,
  },
  input: { flex: 1, color: Colors.text, marginLeft: 12, fontFamily: 'monospace', fontSize: 14, height: '100%' },
  button: {
    backgroundColor: Colors.primary, height: 50, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 5,
  },
  buttonText: { color: Colors.background, fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowText: { color: Colors.text, fontFamily: 'monospace', fontSize: 13, marginLeft: 10 },
  muted: { color: Colors.textMuted, fontFamily: 'monospace', fontSize: 13 },
});

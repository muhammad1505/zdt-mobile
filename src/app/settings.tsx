import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getItemAsync, setItemAsync } from '@/utils/storage';
import { apiClient, getCsrfToken } from '@/api/client';
import { Server, Key, User, Folder } from 'lucide-react-native';

export default function SettingsScreen() {
  const [ip, setIp] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const savedIp = await getItemAsync('zdt_server_ip');
      const savedUser = await getItemAsync('zdt_user');
      const savedPass = await getItemAsync('zdt_pass');
      if (savedIp) setIp(savedIp);
      if (savedUser) setUser(savedUser);
      if (savedPass) setPass(savedPass);
      
      try {
        const res = await apiClient.get('/status');
        if (res.data.target_dir) setTargetDir(res.data.target_dir);
      } catch (err) {}
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await setItemAsync('zdt_server_ip', ip);
    await setItemAsync('zdt_user', user);
    await setItemAsync('zdt_pass', pass);
    
    try {
      if (targetDir) {
        const csrf = await getCsrfToken();
        await apiClient.post('/settings/storage', { target_dir: targetDir }, { headers: { 'X-CSRF-Token': csrf } });
      }
      setTimeout(() => {
        setSaving(false);
        Alert.alert('Success', 'Koneksi & Pengaturan Disimpan!');
      }, 500);
    } catch (err) {
      setSaving(false);
      Alert.alert('Warning', 'Saved connection, but failed to update target directory. Server might be unreachable.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Server color={Colors.primary} size={20} />
          <TextInput
            style={styles.input}
            placeholder="SERVER IP (e.g. 192.168.1.5)"
            placeholderTextColor={Colors.textMuted}
            value={ip}
            onChangeText={setIp}
          />
        </View>

        <View style={styles.inputGroup}>
          <User color={Colors.primary} size={20} />
          <TextInput
            style={styles.input}
            placeholder="USERNAME"
            placeholderTextColor={Colors.textMuted}
            value={user}
            onChangeText={setUser}
          />
        </View>

        <View style={styles.inputGroup}>
          <Key color={Colors.primary} size={20} />
          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={pass}
            onChangeText={setPass}
          />
        </View>

        <View style={styles.inputGroup}>
          <Folder color={Colors.accent} size={20} />
          <TextInput
            style={styles.input}
            placeholder="SERVER DIRECTORY (/music)"
            placeholderTextColor={Colors.textMuted}
            value={targetDir}
            onChangeText={setTargetDir}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.buttonText}>Save Connection</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
  },
  input: {
    flex: 1,
    color: Colors.text,
    marginLeft: 15,
    fontFamily: 'monospace',
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
});

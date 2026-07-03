import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import * as SecureStore from 'expo-secure-store';
import { Server, Key, User } from 'lucide-react-native';

export default function SettingsScreen() {
  const [ip, setIp] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const savedIp = await SecureStore.getItemAsync('zdt_server_ip');
      const savedUser = await SecureStore.getItemAsync('zdt_user');
      const savedPass = await SecureStore.getItemAsync('zdt_pass');
      if (savedIp) setIp(savedIp);
      if (savedUser) setUser(savedUser);
      if (savedPass) setPass(savedPass);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await SecureStore.setItemAsync('zdt_server_ip', ip);
    await SecureStore.setItemAsync('zdt_user', user);
    await SecureStore.setItemAsync('zdt_pass', pass);
    setTimeout(() => {
      setSaving(false);
      alert('Koneksi Server Disimpan!');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NETRUNNER_CONFIG</Text>
      
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

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.buttonText}>ESTABLISH LINK</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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

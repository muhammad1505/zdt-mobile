import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Fallback in-memory storage for devices where SecureStore is unavailable
// (e.g. Android emulators/devices without hardware keystore)
let secureStoreAvailable: boolean | null = null;
const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

export const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
    return;
  }

  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (e) {
      console.warn('SecureStore setItemAsync failed, falling back to memory:', e);
    }
  }

  // Fallback: store in memory
  memoryStore.set(key, value);
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  }

  if (await isSecureStoreAvailable()) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore getItemAsync failed, falling back to memory:', e);
    }
  }

  // Fallback: read from memory
  return memoryStore.get(key) ?? null;
};

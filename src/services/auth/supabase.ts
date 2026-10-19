import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !anonKey) {
  throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

// The native session is stored in chunks to respect SecureStore value limits.
const PART_SIZE = 1200;
const MAX_PARTS = 32;
const nativeStore = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(`${key}.count`);
    if (!countRaw) return null;
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1 || count > MAX_PARTS) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${PART_SIZE}}`, 'g')) ?? [];
    if (chunks.length < 1 || chunks.length > MAX_PARTS) throw new Error('Supabase session exceeds secure storage limit');
    // Invalidate existing manifest before changing chunks.
    await SecureStore.deleteItemAsync(`${key}.count`);
    for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
    await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
    for (let i = chunks.length; i < MAX_PARTS; i++) {
      // Clean orphaned parts from a previous, longer session.
      if (i > chunks.length + 8) break;
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  },
  async removeItem(key: string): Promise<void> {
    const raw = await SecureStore.getItemAsync(`${key}.count`);
    await SecureStore.deleteItemAsync(`${key}.count`);
    const n = Math.min(MAX_PARTS, Math.max(0, Number(raw) || 0));
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  },
};
const webStore = {
  getItem: async (key: string) => typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
  setItem: async (key: string, val: string) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); },
  removeItem: async (key: string) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStore : nativeStore,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

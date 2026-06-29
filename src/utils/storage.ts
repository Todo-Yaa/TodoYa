import { Platform } from 'react-native';

// Importación condicional para evitar fallos al empaquetar para la web
let AsyncStorage: any = null;
let SecureStore: any = null;

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.warn('[Storage] AsyncStorage no pudo ser cargado:', e);
  }
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('[Storage] SecureStore no pudo ser cargado:', e);
  }
}

// Almacenamiento temporal en memoria como fallback si todo lo demás falla
const memoryStorage: Record<string, string> = {};

/**
 * Clase Storage: Adaptador de almacenamiento multiplataforma seguro.
 * - En la Web: Utiliza la API nativa de `localStorage` para persistencia duradera.
 * - En Móvil Nativo:
 *   - Variables sensibles (sesión, usuario, rol, monedas, plan): Cifradas con `expo-secure-store`.
 *   - Datos no sensibles grandes (pedidos, notificaciones, usuarios locales): Guardados con `AsyncStorage`.
 */
class Storage {
  /**
   * Determina si una clave contiene información confidencial y debe cifrarse
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'todo_ya_active_user',
      'todo_ya_auth',
      'todo_ya_role',
      'todo_ya_coins',
      'todo_ya_plan_id',
      'todo_ya_username'
    ];
    return sensitiveKeys.includes(key);
  }

  /**
   * Obtiene un elemento persistido a partir de su clave.
   */
  static async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error al leer de localStorage:', e);
        return null;
      }
    }

    // Móvil nativo: Cifrado para sensibles
    if (this.isSensitiveKey(key) && SecureStore) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (e) {
        console.warn('Error al leer de SecureStore:', e);
      }
    }

    // Móvil nativo: AsyncStorage para datos generales no sensibles
    if (AsyncStorage) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e) {
        console.warn('Error al leer de AsyncStorage:', e);
      }
    }

    return memoryStorage[key] || null;
  }

  /**
   * Guarda un par clave-valor en el almacenamiento.
   */
  static async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.error('Error al guardar en localStorage:', e);
      }
    }

    // Móvil nativo: Cifrado para sensibles (límite de 2KB)
    if (this.isSensitiveKey(key) && SecureStore) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch (e) {
        console.warn('Error al guardar en SecureStore:', e);
      }
    }

    // Móvil nativo: AsyncStorage
    if (AsyncStorage) {
      try {
        await AsyncStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('Error al guardar en AsyncStorage:', e);
      }
    }

    memoryStorage[key] = value;
  }

  /**
   * Elimina un elemento del almacenamiento a partir de su clave.
   */
  static async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        console.error('Error al eliminar de localStorage:', e);
      }
    }

    // Móvil nativo: Borrado de SecureStore
    if (this.isSensitiveKey(key) && SecureStore) {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch (e) {
        console.warn('Error al eliminar de SecureStore:', e);
      }
    }

    // Móvil nativo: Borrado de AsyncStorage
    if (AsyncStorage) {
      try {
        await AsyncStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('Error al eliminar de AsyncStorage:', e);
      }
    }

    delete memoryStorage[key];
  }
}

export default Storage;

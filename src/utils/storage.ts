import { Platform } from 'react-native';

// Almacenamiento temporal en memoria como fallback si la plataforma no es Web (ej. iOS/Android nativo)
// o en caso de que localStorage esté deshabilitado por el navegador.
const memoryStorage: Record<string, string> = {};

/**
 * Clase Storage: Adaptador de almacenamiento multiplataforma.
 * Permite persistir información de manera asíncrona.
 * - En la Web: Utiliza la API nativa de `localStorage` para persistencia duradera.
 * - En Móvil Nativo (iOS/Android): Utiliza un diccionario en memoria para evitar caídas
 *   (en producción real aquí se utilizaría `AsyncStorage` de react-native).
 */
class Storage {
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
    // Retorna del diccionario en memoria si es nativo
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
    // Guarda en el diccionario en memoria si es nativo
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
    // Elimina del diccionario en memoria si es nativo
    delete memoryStorage[key];
  }
}

export default Storage;

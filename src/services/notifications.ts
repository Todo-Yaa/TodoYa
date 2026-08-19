// Servicio de Notificaciones Push Nativas (expo-notifications)
// Gestiona el registro de tokens de dispositivo y banners nativos para Android e iOS

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar comportamiento nativo cuando la notificación llega con la app en primer o segundo plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificación al dispositivo y devuelve el Push Token para Neon DB
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permiso de notificaciones denegado por el usuario.');
      return null;
    }

    // En dispositivos Android se requiere configurar el canal nativo por defecto
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Todo Ya Alertas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB400',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    token = tokenData?.data || null;

  } catch (error) {
    console.warn('[Push] Notificaciones locales activadas en modo simulado web/desarrollo.');
  }

  return token;
}

/**
 * Dispara una notificación Push nativa local instantánea
 */
export async function sendLocalPushNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data || {},
      },
      trigger: null, // null significa disparo inmediato (< 1 segundo)
    });
  } catch (error) {
    console.log(`[Push Local] Alerta simulada: ${title} - ${body}`);
  }
}

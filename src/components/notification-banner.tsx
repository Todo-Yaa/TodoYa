import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'chat' | 'application' | 'system' | 'wallet';
}

interface NotificationBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export default function NotificationBanner({ toast, onDismiss }: NotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-150));

  useEffect(() => {
    if (toast) {
      // Deslizar hacia abajo
      Animated.spring(slideAnim.current, {
        toValue: 20,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Desaparecer automáticamente después de 4 segundos
      const timer = setTimeout(() => {
        dismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dismiss = () => {
    Animated.timing(slideAnim.current, {
      toValue: -150,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'chat':
        return { name: 'chatbubble-ellipses-outline', color: '#6366f1' };
      case 'application':
        return { name: 'briefcase-outline', color: '#10b981' };
      case 'wallet':
        return { name: 'card-outline', color: '#fbbf24' };
      default:
        return { name: 'notifications-outline', color: '#FFB400' };
    }
  };

  const iconInfo = getIcon();

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim.current }] }]}>
      <TouchableOpacity style={styles.toastContent} onPress={dismiss} activeOpacity={0.9}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
          <Ionicons name="close" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 30, // Se adapta sobre el área segura de la mayoría de teléfonos
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  toastContent: {
    backgroundColor: '#1e293b', // Slate oscuro para contraste premium
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});

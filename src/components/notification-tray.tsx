import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'chat' | 'application' | 'system' | 'wallet';
  read: boolean;
  timestamp: string;
}

interface NotificationTrayProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onItemPress?: (item: NotificationItem) => void;
  isDarkTheme?: boolean;
}

export default function NotificationTray({
  visible,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onItemPress,
  isDarkTheme = false
}: NotificationTrayProps) {

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'chat':
        return { name: 'chatbubble-ellipses-outline', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'application':
        return { name: 'briefcase-outline', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'wallet':
        return { name: 'card-outline', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
      default:
        return { name: 'notifications-outline', color: '#FFB400', bg: 'rgba(255, 180, 0, 0.1)' };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[
            styles.container, 
            isDarkTheme ? styles.darkContainer : styles.lightContainer
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons 
                name="notifications" 
                size={22} 
                color={isDarkTheme ? '#818cf8' : '#2F2F2F'} 
              />
              <Text style={[styles.headerTitle, isDarkTheme && styles.darkText]}>
                Notificaciones
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Acciones */}
          {notifications.length > 0 && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={onMarkAllAsRead} style={styles.actionBtn}>
                <Ionicons name="checkmark-done" size={14} color="#6366f1" />
                <Text style={styles.actionText}>Leídas</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClearAll} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Listado */}
          <ScrollView 
            style={styles.list} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={notifications.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
                </View>
                <Text style={[styles.emptyTitle, isDarkTheme && styles.darkText]}>Sin notificaciones</Text>
                <Text style={styles.emptyDesc}>Te avisaremos cuando suceda algo importante.</Text>
              </View>
            ) : (
              notifications.map((item) => {
                const iconInfo = getIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      !item.read && styles.unreadCard,
                      isDarkTheme ? styles.darkCard : styles.lightCard
                    ]}
                    onPress={() => onItemPress && onItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBg, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name as any} size={20} color={iconInfo.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <Text 
                          style={[
                            styles.itemTitle, 
                            !item.read && styles.boldText,
                            isDarkTheme && styles.darkText
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.itemTime}>{item.timestamp}</Text>
                      </View>
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80, // Alineado debajo de la cabecera
    paddingRight: 16,
  },
  container: {
    width: Math.min(width - 32, 340),
    maxHeight: 450,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  lightContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e2e8f0',
  },
  darkContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)', // Slate 800
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  closeBtn: {
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
  },
  lightCard: {
    backgroundColor: '#fff',
    borderColor: '#f1f5f9',
  },
  darkCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  unreadCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 13,
    color: '#334155',
    maxWidth: 150,
  },
  darkText: {
    color: '#f8fafc',
  },
  boldText: {
    fontWeight: '700',
  },
  itemTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  itemMessage: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptyDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

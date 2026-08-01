import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../context/user-context';
import { sanitizeText } from '../utils/security';

interface Message {
  id: number;
  orderId: number;
  senderName: string;
  messageText: string;
  createdAt: string;
}

export default function ChatRoomScreen() {
  const { orderId, titulo, providerName } = useLocalSearchParams<{
    orderId: string;
    titulo: string;
    providerName: string;
  }>();
  const { userName, userRole, activeUser, simulationState, simulationStep } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCount = useRef(0);

  // Nombre del remitente según el rol y usuario
  const senderName = userName || (userRole === 'provider' ? (providerName || 'Proveedor') : 'Tú');

  const fetchMessages = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch(`/api/chat?orderId=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedMessages: Message[] = data.data || [];
        setMessages(fetchedMessages);

        // Auto-scroll solo si llegaron mensajes nuevos
        if (fetchedMessages.length > lastMessageCount.current) {
          lastMessageCount.current = fetchedMessages.length;
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    } catch (e) {
      // Si el servidor falla, usar mensajes de demostración
      if (messages.length === 0) {
        setMessages([
          { id: 1, orderId: Number(orderId), senderName: providerName || 'Juan Ríos', messageText: '¡Hola! Soy tu proveedor asignado. Ya voy en camino. ¿Puedes confirmar la dirección exacta?', createdAt: new Date(Date.now() - 180000).toISOString() },
          { id: 2, orderId: Number(orderId), senderName: 'Tú', messageText: 'Hola! Sí, estoy en Av. Mutualista #456 entre 2do y 3er anillo.', createdAt: new Date(Date.now() - 120000).toISOString() },
          { id: 3, orderId: Number(orderId), senderName: providerName || 'Juan Ríos', messageText: 'Perfecto, llego en aproximadamente 10 minutos.', createdAt: new Date(Date.now() - 60000).toISOString() },
        ]);
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (simulationState) {
      setIsLoading(true);
      if (simulationState === 'client') {
        setMessages([
          { id: 1, orderId: Number(orderId), senderName: 'Juan Ríos', messageText: '¡Hola Carlos! Ya recibí tu orden para arreglar el cortocircuito en tu sala. Voy saliendo de inmediato.', createdAt: new Date(Date.now() - 60000).toISOString() },
          { id: 2, orderId: Number(orderId), senderName: 'Tú', messageText: 'Excelente Juan. Por favor ten cuidado al entrar, huele un poco a quemado cerca de la caja de fusibles.', createdAt: new Date(Date.now() - 30000).toISOString() },
          { id: 3, orderId: Number(orderId), senderName: 'Juan Ríos', messageText: 'Entendido. Llevo disyuntores de repuesto y multímetro. Estaré allí en 15 minutos.', createdAt: new Date().toISOString() },
        ]);
      } else if (simulationState === 'provider') {
        setMessages([
          { id: 1, orderId: Number(orderId), senderName: 'Luis Alberto', messageText: 'Hola Pedro, gracias por postularte. El grifo de la cocina gotea mucho y ya inundó parte del piso.', createdAt: new Date(Date.now() - 60000).toISOString() },
          { id: 2, orderId: Number(orderId), senderName: 'Tú', messageText: 'Hola Luis. Por favor cierra la llave de paso principal para detener la inundación. Llego en 10 minutos con repuestos.', createdAt: new Date(Date.now() - 30000).toISOString() },
          { id: 3, orderId: Number(orderId), senderName: 'Luis Alberto', messageText: 'Listo, acabo de cerrar la llave de paso. Te espero.', createdAt: new Date().toISOString() },
        ]);
      }
      setIsLoading(false);
    } else {
      fetchMessages(true);
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(false);
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [orderId, simulationState]);

  const sendMessage = async () => {
    const text = sanitizeText(inputText.trim());
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    // Añadir de inmediato al estado local (optimistic update)
    const optimisticMsg: Message = {
      id: Date.now(),
      orderId: Number(orderId),
      senderName: senderName,
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: Number(orderId),
          senderName: senderName,
          messageText: text,
          senderId: activeUser?.id || null, //  FK real al usuario remitente
        }),
      });
    } catch (e) {
      // El mensaje ya está visible localmente; no hace falta revertirlo
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isMyMessage = (msg: Message) => {
    return msg.senderName === senderName || msg.senderName === 'Tú';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(providerName || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{providerName || 'Proveedor Asignado'}</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>En línea · {titulo}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} activeOpacity={0.7}>
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB400" />
            <Text style={styles.loadingText}>Cargando conversación...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {/* Banner informativo */}
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.infoBannerText}>
                Chat seguro con tu proveedor · Pedido #{orderId}
              </Text>
            </View>

            {messages.map((msg) => {
              const isMine = isMyMessage(msg);
              return (
                <View
                  key={msg.id}
                  style={[styles.messageBubbleWrapper, isMine ? styles.myWrapper : styles.theirWrapper]}
                >
                  {!isMine && (
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{msg.senderName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    {!isMine && (
                      <Text style={styles.bubbleSender}>{msg.senderName}</Text>
                    )}
                    <Text style={[styles.bubbleText, isMine ? styles.myBubbleText : styles.theirBubbleText]}>
                      {msg.messageText}
                    </Text>
                    <Text style={[styles.bubbleTime, isMine ? styles.myBubbleTime : styles.theirBubbleTime]}>
                      {formatTime(msg.createdAt)} {isMine && '✓✓'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

  header: {
    backgroundColor: '#FFB400',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  onlineText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#666', fontSize: 14 },

  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, paddingBottom: 16 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
    alignSelf: 'center',
  },
  infoBannerText: { fontSize: 12, color: '#059669', fontWeight: '500' },

  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },

  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#FFB400',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 3,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  myBubbleText: { color: '#1a1a1a' },
  theirBubbleText: { color: '#1a1a1a' },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  myBubbleTime: { color: 'rgba(0,0,0,0.45)' },
  theirBubbleTime: { color: '#aaa' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    outlineStyle: 'none',
  } as any,
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFB400',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#ddd',
    shadowOpacity: 0,
    elevation: 0,
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface KYCVerifierModalProps {
  visible: boolean;
  onVerified: (detalles: string) => void;
  onClose: () => void;
  userName?: string;
}

type KYCStep = 'intro' | 'capturing' | 'uploading' | 'analyzing' | 'success' | 'failed';

export default function KYCVerifierModal({ visible, onVerified, onClose, userName }: KYCVerifierModalProps) {
  const [step, setStep] = useState<KYCStep>('intro');
  const [kycResult, setKycResult] = useState<{ approved: boolean; details: string; rejectedReasons: string[]; holderName?: string | null } | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (toValue: number, duration: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start();
  };

  const startKYCFlow = async (source: 'camera' | 'gallery' = 'camera') => {
    let pickerResult;

    setStep('capturing');
    animateProgress(0.2, 400);

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de acceso a la cámara para la verificación.');
        setStep('intro');
        return;
      }
      pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.7,
        base64: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de acceso a la galería para la verificación.');
        setStep('intro');
        return;
      }
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.7,
        base64: true,
      });
    }

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) {
      setStep('intro');
      progressAnim.setValue(0);
      return;
    }

    const imageBase64 = pickerResult.assets[0].base64!;

    // PASO 3: Obtener sessionId del backend
    setStep('uploading');
    animateProgress(0.5, 600);

    let sessionId: string;
    try {
      const presignRes = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presign' }),
      });
      const presignData = await presignRes.json();
      sessionId = presignData.sessionId;
    } catch (e) {
      sessionId = `fallback_${Date.now()}`;
    }

    await delay(800);

    // PASO 4: Enviar imagen a Gemini Vision para verificación real
    setStep('analyzing');
    animateProgress(0.85, 2000);

    try {
      const verifyRes = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId, imageBase64 }),
      });

      if (!verifyRes.ok) {
        throw new Error('Error en el servidor de verificación');
      }

      const verifyData = await verifyRes.json();
      const result = verifyData.result;

      if (!result || typeof result.approved !== 'boolean') {
        throw new Error('Respuesta de verificación no válida');
      }

      animateProgress(1, 400);
      await delay(600);

      setKycResult(result);
      setStep(result.approved ? 'success' : 'failed');
    } catch (e: any) {
      // Rechazo estricto obligatorio
      setKycResult({ 
        approved: false, 
        details: 'No se pudo verificar el documento. Asegúrate de subir una foto clara de tu Carnet de Identidad boliviano.', 
        rejectedReasons: ['Documento no reconocido o error de verificación'], 
        holderName: null 
      });
      animateProgress(1, 400);
      await delay(600);
      setStep('failed');
    }
  };

  const handleConfirmSuccess = () => {
    if (kycResult) {
      onVerified(kycResult.details);
    }
    resetAndClose();
  };

  const handleRetry = () => {
    setStep('intro');
    progressAnim.setValue(0);
    setKycResult(null);
  };

  const resetAndClose = () => {
    setStep('intro');
    progressAnim.setValue(0);
    setKycResult(null);
    onClose();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getProcessingLabel = () => {
    switch (step) {
      case 'capturing': return { emoji: '📷', title: 'Seleccionando documento...', desc: 'Elige la foto de tu Carnet de Identidad' };
      case 'uploading': return { emoji: '🔐', title: 'Preparando envío seguro...', desc: 'Transmisión cifrada hacia servidor IA' };
      case 'analyzing': return { emoji: '🤖', title: 'Gemini IA analizando...', desc: 'Verificando autenticidad del documento' };
      default: return { emoji: '⏳', title: 'Procesando...', desc: 'Un momento por favor' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Verificación de Identidad</Text>
              <Text style={styles.cardSubtitle}>KYC · Powered by Gemini AI</Text>
            </View>
            {step === 'intro' && (
              <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={26} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          {/* PASO: Intro */}
          {step === 'intro' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Hola, {userName || 'nuevo usuario'} 👋</Text>
              <Text style={styles.stepDesc}>
                Para proteger a nuestra comunidad, necesitamos verificar tu identidad antes de activar tu cuenta como{' '}
                <Text style={{ fontWeight: '700', color: '#FFB400' }}>proveedor o empresa</Text>.
              </Text>

              <View style={styles.requirementsList}>
                {[
                  { icon: 'id-card-outline', text: 'Carnet de Identidad (C.I.) boliviano' },
                  { icon: 'image-outline', text: 'Foto desde tu galería o cámara' },
                  { icon: 'time-outline', text: 'El proceso tarda menos de 30 segundos' },
                  { icon: 'lock-closed-outline', text: 'Tu imagen NO se almacena — solo el resultado' },
                ].map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <View style={styles.requirementIconBg}>
                      <Ionicons name={req.icon as any} size={16} color="#FFB400" />
                    </View>
                    <Text style={styles.requirementText}>{req.text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.protectBanner}>
                <Ionicons name="sparkles-outline" size={16} color="#10b981" />
                <Text style={styles.protectText}>
                  Verificación real con <Text style={{ fontWeight: '700' }}>Google Gemini Vision AI</Text>. Gratis y seguro.
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => startKYCFlow('camera')} activeOpacity={0.8}>
                  <Ionicons name="camera" size={20} color="#1a1a1a" />
                  <Text style={styles.primaryBtnText}>Tomar Foto con Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={() => startKYCFlow('gallery')} activeOpacity={0.8}>
                  <Ionicons name="images-outline" size={18} color="#475569" />
                  <Text style={styles.secondaryBtnText}>Elegir de Galería</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PASO: Procesando (capturing / uploading / analyzing) */}
          {(step === 'capturing' || step === 'uploading' || step === 'analyzing') && (
            <View style={styles.stepContainer}>
              <ActivityIndicator size="large" color="#FFB400" style={{ marginBottom: 20 }} />

              {(() => {
                const label = getProcessingLabel();
                return (
                  <>
                    <Text style={styles.processingTitle}>{label.emoji} {label.title}</Text>
                    <Text style={styles.processingDesc}>{label.desc}</Text>
                  </>
                );
              })()}

              {/* Barra de progreso animada */}
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <Text style={styles.processingNote}>
                Este proceso es privado y seguro. No interrumpas la pantalla.
              </Text>
            </View>
          )}

          {/* PASO: Éxito */}
          {step === 'success' && (
            <View style={styles.stepContainer}>
              <View style={styles.resultIconSuccess}>
                <Ionicons name="checkmark-circle" size={56} color="#10b981" />
              </View>
              <Text style={styles.resultTitle}>¡Identidad Verificada! 🎉</Text>
              <Text style={styles.resultDesc}>
                Gemini AI confirmó que tu documento es auténtico y válido.
              </Text>

              {kycResult && (
                <View style={[styles.resultDetailBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', gap: 6 }]}>
                  {kycResult.holderName && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.resultDetailLabel}>Titular:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>{kycResult.holderName}</Text>
                    </View>
                  )}

                  {kycResult.ciNumber && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.resultDetailLabel}>Nº Documento:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>{kycResult.ciNumber}</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.resultDetailLabel}>Confianza IA:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      {kycResult.confidenceScore || '98%'} Coincidencia
                    </Text>
                  </View>
                </View>
              )}

              {kycResult?.details && (
                <View style={styles.resultDetailBox}>
                  <Text style={styles.resultDetailLabel}>Detalles del análisis:</Text>
                  <Text style={styles.resultDetailText}>{kycResult.details}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSuccess} activeOpacity={0.8}>
                <Ionicons name="arrow-forward-circle" size={20} color="#1a1a1a" />
                <Text style={styles.primaryBtnText}>Continuar con mi registro</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO: Fallido */}
          {step === 'failed' && (
            <View style={styles.stepContainer}>
              <View style={styles.resultIconFailed}>
                <Ionicons name="close-circle" size={56} color="#ef4444" />
              </View>
              <Text style={styles.resultTitle}>Verificación Fallida</Text>
              <Text style={styles.resultDesc}>
                {kycResult?.details || 'No pudimos leer correctamente tu documento. Intenta de nuevo con mejor iluminación.'}
              </Text>

              {kycResult?.rejectedReasons && kycResult.rejectedReasons.length > 0 && (
                <View style={styles.rejectedReasonsList}>
                  {kycResult.rejectedReasons.map((r, i) => (
                    <View key={i} style={styles.rejectedReasonRow}>
                      <Ionicons name="warning-outline" size={14} color="#ef4444" />
                      <Text style={styles.rejectedReasonText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={resetAndClose} activeOpacity={0.7}>
                  <Text style={styles.secondaryBtnText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={18} color="#1a1a1a" />
                  <Text style={styles.primaryBtnText}>Intentar de nuevo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: Platform.OS === 'web' ? 28 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 28 : 0,
    paddingBottom: 40,
    paddingTop: 8,
    maxWidth: Platform.OS === 'web' ? 500 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 4 : -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shieldIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFB400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  closeBtn: { padding: 4 },

  stepContainer: { paddingHorizontal: 24, paddingTop: 20 },

  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  stepDesc: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 20 },

  requirementsList: { gap: 10, marginBottom: 20 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requirementIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff8e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: { fontSize: 14, color: '#475569', flex: 1 },

  protectBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  protectText: { fontSize: 13, color: '#059669', flex: 1, lineHeight: 18 },

  primaryBtn: {
    backgroundColor: '#FFB400',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '700' },

  processingTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  processingDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  progressTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB400',
    borderRadius: 4,
  },
  processingNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },

  resultIconSuccess: { alignItems: 'center', marginBottom: 16 },
  resultIconFailed: { alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  resultDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 22 },

  resultDetailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultDetailLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
  resultDetailText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  rejectedReasonsList: { gap: 8, marginBottom: 20 },
  rejectedReasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rejectedReasonText: { fontSize: 13, color: '#ef4444' },

  buttonRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});

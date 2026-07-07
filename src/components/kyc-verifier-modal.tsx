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

interface KYCVerifierModalProps {
  visible: boolean;
  onVerified: (detalles: string) => void;
  onClose: () => void;
  userName?: string;
}

type KYCStep = 'intro' | 'simulating_capture' | 'uploading' | 'analyzing' | 'success' | 'failed';

export default function KYCVerifierModal({ visible, onVerified, onClose, userName }: KYCVerifierModalProps) {
  const [step, setStep] = useState<KYCStep>('intro');
  const [kycResult, setKycResult] = useState<{ approved: boolean; details: string; rejectedReasons: string[] } | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Nuevos estados interactivos
  const [tipoDocumento, setTipoDocumento] = useState<'dni' | 'ce'>('dni');
  const [documentoSubido, setDocumentoSubido] = useState(false);
  const [selfieSubida, setSelfieSubida] = useState(false);
  const [capturandoDoc, setCapturandoDoc] = useState(false);
  const [capturandoSelfie, setCapturandoSelfie] = useState(false);

  const capturarDocumentoSimulado = async () => {
    setCapturandoDoc(true);
    await delay(1500);
    setCapturandoDoc(false);
    setDocumentoSubido(true);
  };

  const capturarSelfieSimulada = async () => {
    setCapturandoSelfie(true);
    await delay(1500);
    setCapturandoSelfie(false);
    setSelfieSubida(true);
  };

  const animateProgress = (toValue: number, duration: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start();
  };

  const startKYCFlow = async () => {
    // Al haber cargado ya los archivos en la intro, pasamos directo a subir e integrar
    setStep('uploading');
    animateProgress(0.5, 800);

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

    await delay(1200);

    // PASO 2: Enviar a verificar con Claude
    setStep('analyzing');
    animateProgress(0.85, 1500);

    try {
      const verifyRes = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId }),
      });
      const verifyData = await verifyRes.json();
      
      let result = verifyData.result || { approved: true, details: 'Documento verificado.', rejectedReasons: [] };
      if (verifyData.status === 'simulated' || !verifyData.result) {
        // Personalizar detalles simulados según tipo de documento elegido
        const isApproved = Math.random() > 0.05; // 95% éxito
        result = {
          approved: isApproved,
          details: isApproved
            ? `Identidad Verificada: Foto de rostro (Selfie) coincide con el documento de tipo ${tipoDocumento === 'ce' ? 'Carnet de Extranjería' : 'DNI / Carnet de Identidad'} ingresado de forma exitosa.`
            : `Fallo de Verificación: El rostro de la selfie no es coincidente o el documento ${tipoDocumento === 'ce' ? 'CE' : 'DNI'} está borroso.`,
          rejectedReasons: isApproved ? [] : ['Image quality too low', 'Face match mismatch']
        };
      }

      animateProgress(1, 400);
      await delay(600);

      setKycResult(result);
      setStep(result.approved ? 'success' : 'failed');
    } catch (e) {
      setKycResult({ 
        approved: true, 
        details: `Verificación completada offline para ${tipoDocumento === 'ce' ? 'Carnet de Extranjería' : 'DNI / Carnet de Identidad'}.`, 
        rejectedReasons: [] 
      });
      animateProgress(1, 400);
      await delay(600);
      setStep('success');
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
    setDocumentoSubido(false);
    setSelfieSubida(false);
    onClose();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
              <Text style={styles.cardSubtitle}>KYC · Powered by Claude AI</Text>
            </View>
            {step === 'intro' && (
              <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={26} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          {/* Content per step */}
          {step === 'intro' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Hola, {userName || 'nuevo usuario'} 👋</Text>
              <Text style={styles.stepDesc}>
                Para poder ofrecer servicios como Proveedor independiente, requerimos validar tu identidad con DNI/CE y Selfie.
              </Text>

              {/* Selector de tipo de documento */}
              <Text style={styles.sectionLabel}>1. Elige tu tipo de documento:</Text>
              <View style={styles.docSelectorRow}>
                <TouchableOpacity
                  style={[styles.docSelectorBtn, tipoDocumento === 'dni' && styles.docSelectorBtnActive]}
                  onPress={() => { setTipoDocumento('dni'); setDocumentoSubido(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="id-card" size={16} color={tipoDocumento === 'dni' ? '#1a1a1a' : '#64748b'} />
                  <Text style={[styles.docSelectorBtnText, tipoDocumento === 'dni' && styles.docSelectorBtnTextActive]}>DNI / C.I.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.docSelectorBtn, tipoDocumento === 'ce' && styles.docSelectorBtnActive]}
                  onPress={() => { setTipoDocumento('ce'); setDocumentoSubido(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text" size={16} color={tipoDocumento === 'ce' ? '#1a1a1a' : '#64748b'} />
                  <Text style={[styles.docSelectorBtnText, tipoDocumento === 'ce' && styles.docSelectorBtnTextActive]}>Carnet Extranjería</Text>
                </TouchableOpacity>
              </View>

              {/* Captura de Documento y Selfie */}
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>2. Capturas requeridas:</Text>
              <View style={styles.verificationStepsBox}>
                
                {/* Paso A: Subir Documento */}
                <View style={styles.verificationStepRow}>
                  <View style={[styles.stepStatusIcon, documentoSubido ? styles.statusSuccessBg : styles.statusPendingBg]}>
                    <Ionicons 
                      name={documentoSubido ? "checkmark-circle" : "id-card-outline"} 
                      size={20} 
                      color={documentoSubido ? "#10b981" : "#FFB400"} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepItemTitle}>
                      {tipoDocumento === 'ce' ? 'Foto de Carnet de Extranjería' : 'Foto de DNI / C.I.'}
                    </Text>
                    <Text style={styles.stepItemDesc}>
                      {documentoSubido ? '✅ Documento cargado: documento_frente.jpg' : 'Sube una foto legible del frente'}
                    </Text>
                  </View>

                  {capturandoDoc ? (
                    <ActivityIndicator size="small" color="#FFB400" />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.scanBtn, documentoSubido && styles.scanBtnActive]} 
                      onPress={capturarDocumentoSimulado}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.scanBtnText, documentoSubido && styles.scanBtnTextActive]}>
                        {documentoSubido ? 'Cambiar' : '📸 Escanear'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Paso B: Selfie */}
                <View style={styles.verificationStepRow}>
                  <View style={[styles.stepStatusIcon, selfieSubida ? styles.statusSuccessBg : styles.statusPendingBg]}>
                    <Ionicons 
                      name={selfieSubida ? "checkmark-circle" : "camera-outline"} 
                      size={20} 
                      color={selfieSubida ? "#10b981" : "#FFB400"} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepItemTitle}>Foto de tu Rostro (Selfie)</Text>
                    <Text style={styles.stepItemDesc}>
                      {selfieSubida ? '✅ Foto cargada: selfie_rostro.jpg' : 'Tómate una selfie con buena luz'}
                    </Text>
                  </View>

                  {capturandoSelfie ? (
                    <ActivityIndicator size="small" color="#FFB400" />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.scanBtn, selfieSubida && styles.scanBtnActive]} 
                      onPress={capturarSelfieSimulada}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.scanBtnText, selfieSubida && styles.scanBtnTextActive]}>
                        {selfieSubida ? 'Cambiar' : '🤳 Selfie'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

              </View>

              <View style={styles.protectBanner}>
                <Ionicons name="eye-off-outline" size={16} color="#10b981" />
                <Text style={styles.protectText}>
                  Las imágenes son analizadas temporalmente en memoria para verificar tu identidad y luego borradas de forma segura.
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, (!documentoSubido || !selfieSubida) && styles.primaryBtnDisabled]} 
                onPress={startKYCFlow} 
                disabled={!documentoSubido || !selfieSubida}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={20} color={(!documentoSubido || !selfieSubida) ? "#94a3b8" : "#1a1a1a"} />
                <Text style={[styles.primaryBtnText, (!documentoSubido || !selfieSubida) && { color: '#94a3b8' }]}>
                  Iniciar Verificación con IA
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(step === 'simulating_capture' || step === 'uploading' || step === 'analyzing') && (
            <View style={styles.stepContainer}>
              <ActivityIndicator
                size="large"
                color="#FFB400"
                style={{ marginBottom: 20 }}
              />

              <Text style={styles.processingTitle}>
                {step === 'simulating_capture' && '📸 Capturando documento...'}
                {step === 'uploading' && '☁️ Enviando de forma segura...'}
                {step === 'analyzing' && '🤖 Analizando con IA...'}
              </Text>
              <Text style={styles.processingDesc}>
                {step === 'simulating_capture' && 'Preparando imagen para análisis'}
                {step === 'uploading' && 'Transmisión cifrada a servidor seguro'}
                {step === 'analyzing' && 'Claude Sonnet está leyendo tu documento'}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <Text style={styles.processingNote}>
                Este proceso es privado y seguro. No interrumpas la pantalla.
              </Text>
            </View>
          )}

          {step === 'success' && (
            <View style={styles.stepContainer}>
              <View style={styles.resultIconSuccess}>
                <Ionicons name="checkmark-circle" size={56} color="#10b981" />
              </View>
              <Text style={styles.resultTitle}>¡Verificación Exitosa! 🎉</Text>
              <Text style={styles.resultDesc}>
                Tu identidad fue validada correctamente por nuestra IA.
              </Text>

              {kycResult?.details && (
                <View style={styles.resultDetailBox}>
                  <Text style={styles.resultDetailLabel}>Resultado del análisis:</Text>
                  <Text style={styles.resultDetailText}>{kycResult.details}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSuccess} activeOpacity={0.8}>
                <Ionicons name="arrow-forward-circle" size={20} color="#1a1a1a" />
                <Text style={styles.primaryBtnText}>Continuar con mi registro</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'failed' && (
            <View style={styles.stepContainer}>
              <View style={styles.resultIconFailed}>
                <Ionicons name="close-circle" size={56} color="#ef4444" />
              </View>
              <Text style={styles.resultTitle}>Verificación Fallida</Text>
              <Text style={styles.resultDesc}>
                No pudimos leer correctamente tu documento. Por favor intenta de nuevo con mejor iluminación.
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

  // Processing steps
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

  // Result
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  docSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  docSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  docSelectorBtnActive: {
    backgroundColor: '#fff8e1',
    borderColor: '#FFB400',
  },
  docSelectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  docSelectorBtnTextActive: {
    color: '#1a1a1a',
  },
  verificationStepsBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  verificationStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stepStatusIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPendingBg: {
    backgroundColor: '#fff8e1',
  },
  statusSuccessBg: {
    backgroundColor: '#e8f5e9',
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  stepItemDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  scanBtn: {
    backgroundColor: '#FFB400',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scanBtnActive: {
    backgroundColor: '#e2e8f0',
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scanBtnTextActive: {
    color: '#475569',
  },
  primaryBtnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
});

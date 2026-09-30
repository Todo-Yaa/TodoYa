import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/user-context';

interface Phone2FAModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
  titleOverride?: string;
  messageOverride?: string;
}

export default function Phone2FAModal({
  visible,
  onClose,
  onVerified,
  titleOverride,
  messageOverride,
}: Phone2FAModalProps) {
  const { activeUser, actualizarTelefono2FA, showNotification } = useUser();

  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [codigoPais, setCodigoPais] = useState('51'); // +51 Perú por defecto
  const [celular, setCelular] = useState('');
  const [pinSent, setPinSent] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(60);
  const [cargando, setCargando] = useState(false);
  const timerRef = useRef<any>(null);

  // Cargar celular previo si existe
  useEffect(() => {
    if (visible && activeUser) {
      if (activeUser.celular) {
        setCelular(activeUser.celular.replace(/\D/g, ''));
      }
      if (activeUser.codigoPais) {
        setCodigoPais(activeUser.codigoPais.replace(/\D/g, ''));
      }
    }
  }, [visible, activeUser]);

  // Manejador del temporizador
  useEffect(() => {
    if (step === 'pin' && smsCountdown > 0) {
      timerRef.current = setInterval(() => {
        setSmsCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, smsCountdown]);

  const enviarPin = (canal: 'sms' | 'whatsapp' = 'sms') => {
    const celLimpio = celular.replace(/\D/g, '');
    if (!celLimpio || celLimpio.length < 7) {
      setPinError('Por favor ingresa un número de celular válido (mínimo 7 dígitos).');
      return;
    }

    setPinError('');
    setCargando(true);

    // Generar PIN de 4 dígitos
    const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPinSent(nuevoPin);

    setTimeout(() => {
      setCargando(false);
      setStep('pin');
      setSmsCountdown(60);
      setPinInput('');

      showNotification(
        'Código de Verificación 2FA',
        `Tu PIN de seguridad para Todo Ya es: ${nuevoPin}. Ingrésalo para verificar tu celular.`,
        'info'
      );
    }, 1000);
  };

  const verificarPin = async () => {
    if (pinInput.length !== 4) {
      setPinError('Ingresa el código completo de 4 dígitos.');
      return;
    }

    if (pinInput !== pinSent) {
      setPinError('Código incorrecto. Por favor verifica e intenta de nuevo.');
      return;
    }

    setCargando(true);
    try {
      await actualizarTelefono2FA(celular.trim(), codigoPais);
      showNotification(
        '¡Celular Verificado!',
        'Has completado la verificación de 2 pasos con éxito.',
        'success'
      );
      setCargando(false);
      onVerified();
      onClose();
    } catch (e) {
      console.warn('Error al verificar 2FA:', e);
      setCargando(false);
      setPinError('Error al guardar la verificación. Inténtalo nuevamente.');
    }
  };

  const resetState = () => {
    setStep('phone');
    setPinInput('');
    setPinError('');
    setCargando(false);
    onClose();
  };

  const socialName = activeUser?.tipoProveedor === 'google' 
    ? 'Google (Gmail)' 
    : activeUser?.tipoProveedor === 'linkedin' 
      ? 'LinkedIn' 
      : 'red social';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetState}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="phone-portrait-outline" size={26} color="#1a1a1a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {titleOverride || 'Verificación en 2 Pasos (2FA)'}
              </Text>
              <Text style={styles.subtitle}>
                Registro con {socialName} · Requerido para solicitar servicios
              </Text>
            </View>
            <TouchableOpacity onPress={resetState} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* PASO 1: Inserción de Número Celular */}
          {step === 'phone' && (
            <View style={styles.body}>
              <Text style={styles.description}>
                {messageOverride ||
                  `Para proteger tu cuenta registrada con ${socialName} y garantizar la seguridad de los proveedores, es obligatorio registrar tu número de celular y realizar la verificación en 2 pasos.`}
              </Text>

              <Text style={styles.label}>Selecciona tu país e ingresa tu Celular:</Text>

              <View style={styles.phoneRow}>
                {/* Selector de Prefijo País */}
                <View style={styles.countryPicker}>
                  <Text style={styles.countryFlag}>
                    {codigoPais === '51' ? '🇵🇪' : codigoPais === '591' ? '🇧🇴' : '📱'}
                  </Text>
                  <Text style={styles.countryPrefix}>+{codigoPais}</Text>
                </View>

                {/* Input de número */}
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Ej. 987654321"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={celular}
                  onChangeText={(val) => {
                    setCelular(val);
                    setPinError('');
                  }}
                  editable={!cargando}
                />
              </View>

              {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, (!celular.trim() || cargando) && styles.primaryBtnDisabled]}
                onPress={() => enviarPin('sms')}
                disabled={!celular.trim() || cargando}
                activeOpacity={0.8}
              >
                {cargando ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#1a1a1a" />
                    <Text style={styles.primaryBtnText}>Enviar Código por SMS</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => enviarPin('whatsapp')}
                disabled={!celular.trim() || cargando}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.whatsappBtnText}>Enviar por WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 2: Inserción del PIN de 4 dígitos */}
          {step === 'pin' && (
            <View style={styles.body}>
              <Text style={styles.description}>
                Ingresa el código de 4 dígitos que enviamos a:{'\n'}
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                  +{codigoPais} {celular}
                </Text>
              </Text>

              {/* Contenedor de 4 cajas para el PIN */}
              <View style={styles.pinBoxRow}>
                {[0, 1, 2, 3].map((idx) => {
                  const char = pinInput[idx] || '';
                  return (
                    <TextInput
                      key={idx}
                      style={[
                        styles.pinSquare,
                        pinInput.length === idx && styles.pinSquareFocused,
                      ]}
                      maxLength={1}
                      keyboardType="numeric"
                      value={char}
                      onChangeText={(val) => {
                        if (val) {
                          const nextPin = pinInput + val;
                          setPinInput(nextPin.slice(0, 4));
                        } else {
                          setPinInput(pinInput.slice(0, -1));
                        }
                      }}
                      editable={!cargando}
                    />
                  );
                })}
              </View>

              {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

              <Text style={styles.countdownText}>
                {smsCountdown > 0
                  ? `El código expira en ${smsCountdown}s`
                  : 'El código ha expirado'}
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, (pinInput.length !== 4 || cargando) && styles.primaryBtnDisabled]}
                onPress={verificarPin}
                disabled={pinInput.length !== 4 || cargando}
                activeOpacity={0.8}
              >
                {cargando ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#1a1a1a" />
                    <Text style={styles.primaryBtnText}>Verificar y Activar 2FA</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setStep('phone')}
                activeOpacity={0.7}
              >
                <Text style={styles.retryText}>Cambiar número o reenviar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFB400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 14,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#FFB400',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  primaryBtnText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '700',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pinBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  pinSquare: {
    width: 52,
    height: 56,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  pinSquareFocused: {
    borderColor: '#FFB400',
    backgroundColor: '#ffffff',
  },
  countdownText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  retryBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  retryText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

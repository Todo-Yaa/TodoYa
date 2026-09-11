import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  codigoPais: string;
  celular: string;
  pinIngresado: string;
  onPinChange: (pin: string) => void;
  pinError: string;
  smsCountdown: number;
  cargando: boolean;
  onConfirm: () => void;
  onSendChannel: (canal: 'whatsapp' | 'sms') => void;
}

export default function PinVerificationModal({
  visible,
  onClose,
  codigoPais,
  celular,
  pinIngresado,
  onPinChange,
  pinError,
  smsCountdown,
  cargando,
  onConfirm,
  onSendChannel,
}: PinVerificationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxWidth: 360 }]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={48}
            color="#FFB400"
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />
          <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 18 }]}>
            Verificación del Teléfono
          </Text>
          <Text style={[styles.modalMessage, { textAlign: 'center', color: '#64748b' }]}>
            Por favor, introduce el código de 4 dígitos enviado por SMS a:{'\n'}
            <Text style={{ fontWeight: '700', color: '#1e293b' }}>
              +{codigoPais} {celular}
            </Text>
          </Text>

          {/* Input PIN 4 dígitos */}
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map((idx) => {
              const char = pinIngresado[idx] || '';
              return (
                <TextInput
                  key={idx}
                  style={[
                    styles.pinInputBox,
                    pinIngresado.length === idx && styles.pinInputBoxFocused,
                  ]}
                  maxLength={1}
                  keyboardType="numeric"
                  value={char}
                  onChangeText={(val) => {
                    if (val) {
                      const newPin = pinIngresado + val;
                      onPinChange(newPin.slice(0, 4));
                    } else {
                      onPinChange(pinIngresado.slice(0, -1));
                    }
                  }}
                  editable={!cargando}
                  selectTextOnFocus
                  accessible={true}
                  accessibilityLabel={`Dígito ${idx + 1} del PIN`}
                />
              );
            })}
          </View>

          {pinError ? (
            <Text style={styles.errorText}>
              {pinError}
            </Text>
          ) : null}

          <Text style={styles.countdownText}>
            {smsCountdown > 0
              ? `El código expira en ${smsCountdown}s`
              : 'El código ha expirado'}
          </Text>

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={onConfirm}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Verificar PIN y activar cuenta"
            >
              <Text style={styles.modalConfirmText}>Verificar y Activar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => onSendChannel('whatsapp')}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Enviar código por WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.whatsappBtnText}>
                Enviar a mi WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => onSendChannel('sms')}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Enviar código por SMS"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#475569" />
              <Text style={styles.resendText}>Enviar por SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancelar verificación PIN"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  pinInputBox: {
    width: 50,
    height: 55,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  pinInputBoxFocused: {
    borderColor: '#FFB400',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  countdownText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalConfirmBtn: {
    backgroundColor: '#FFB400',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#2F2F2F',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    height: 44,
    borderRadius: 10,
    gap: 8,
  },
  whatsappBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  resendBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    gap: 6,
  },
  resendText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
  },
});

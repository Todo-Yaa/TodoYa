import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/user-context';

export default function LocationChangeModal() {
  const {
    showLocationChangeModal,
    locationChangeFrom,
    locationChangeTo,
    confirmCityChange,
    declineCityChange,
    activeUser
  } = useUser();

  if (!showLocationChangeModal) return null;

  const esEmpresa = activeUser?.tipoEntidad === 'empresa';
  const colorMarca = esEmpresa ? '#6366f1' : '#FFB400';
  const colorBotonTexto = esEmpresa ? '#fff' : '#2F2F2F';

  return (
    <Modal
      transparent
      visible={showLocationChangeModal}
      animationType="fade"
      onRequestClose={declineCityChange}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: esEmpresa ? '#1e1b4b' : '#fff7ed' }]}>
              <Ionicons name="location" size={24} color={colorMarca} />
            </View>
            <Text style={styles.title}>¿Cambiaste de ciudad?</Text>
          </View>

          <Text style={styles.message}>
            Detectamos que antes estabas en <Text style={styles.boldText}>{locationChangeFrom || 'tu ciudad anterior'}</Text> y ahora estás en <Text style={[styles.boldText, { color: colorMarca }]}>{locationChangeTo}</Text>. ¿Deseas actualizar tu ubicación?
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={declineCityChange}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>
                No, mantener en {locationChangeFrom}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colorMarca }]}
              onPress={confirmCityChange}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, { color: colorBotonTexto }]}>
                Sí, actualizar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Slate 900 con opacidad para fondo premium
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b', // Slate 800 premium para contraste
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#334155', // Slate 700 para bordes
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc', // Slate 50
  },
  message: {
    fontSize: 14,
    color: '#94a3b8', // Slate 400
    lineHeight: 22,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#f1f5f9',
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 10,
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569', // Slate 600
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1', // Slate 300
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PaisLatino {
  nombre: string;
  codigo: string;
  bandera: string;
}

export const PAISES_LATINOS: PaisLatino[] = [
  { nombre: "Perú", codigo: "51", bandera: "🇵🇪" },
  { nombre: "Bolivia", codigo: "591", bandera: "🇧🇴" },
  { nombre: "Colombia", codigo: "57", bandera: "🇨🇴" },
  { nombre: "Ecuador", codigo: "593", bandera: "🇪🇨" },
  { nombre: "Chile", codigo: "56", bandera: "🇨🇱" },
  { nombre: "Argentina", codigo: "54", bandera: "🇦🇷" },
  { nombre: "México", codigo: "52", bandera: "🇲🇽" },
  { nombre: "Venezuela", codigo: "58", bandera: "🇻🇪" },
  { nombre: "Paraguay", codigo: "595", bandera: "🇵🇾" },
  { nombre: "Uruguay", codigo: "598", bandera: "🇺🇾" },
  { nombre: "Brasil", codigo: "55", bandera: "🇧🇷" },
  { nombre: "Costa Rica", codigo: "506", bandera: "🇨🇷" },
  { nombre: "Panamá", codigo: "507", bandera: "🇵🇦" },
  { nombre: "Guatemala", codigo: "502", bandera: "🇬🇹" },
  { nombre: "El Salvador", codigo: "503", bandera: "🇸🇻" },
  { nombre: "Honduras", codigo: "504", bandera: "🇭🇳" },
  { nombre: "Nicaragua", codigo: "505", bandera: "🇳🇮" },
  { nombre: "República Dominicana", codigo: "1-809", bandera: "🇩🇴" },
];

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCountry: (codigo: string) => void;
}

export default function CountryPickerModal({ visible, onClose, onSelectCountry }: CountryPickerModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleText}>Seleccionar País</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeIconButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de selección de país"
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.countryScrollView}>
            {PAISES_LATINOS.map((pais) => (
              <TouchableOpacity
                key={pais.codigo}
                style={styles.countryItemRow}
                onPress={() => {
                  onSelectCountry(pais.codigo);
                  onClose();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar ${pais.nombre} +${pais.codigo}`}
              >
                <Text style={styles.flagText}>{pais.bandera}</Text>
                <Text style={styles.countryNameText}>{pais.nombre}</Text>
                <Text style={styles.countryCodeText}>+{pais.codigo}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  modalContentContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeIconButton: {
    padding: 4,
  },
  countryScrollView: {
    maxHeight: 350,
  },
  countryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  flagText: {
    fontSize: 22,
    marginRight: 12,
  },
  countryNameText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB400',
  },
});

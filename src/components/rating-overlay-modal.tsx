import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../context/user-context';

interface RatingOverlayModalProps {
  order: Order;
  onRate: (estrellas: number, etiquetas: string[]) => void;
}

const ETIQUETAS_POR_ESTRELLA: Record<string, string[]> = {
  baja: ['Mal trabajo', 'Mala actitud', 'Impuntual', 'Cobro excesivo', 'Desordenado'],
  media: ['Trabajo regular', 'Demora leve', 'Poco comunicativo', 'Faltaron detalles'],
  alta: ['Excelente trabajo', 'Gran actitud', 'Puntual y rápido', 'Muy ordenado', 'Súper recomendado']
};

export default function RatingOverlayModal({ order, onRate }: RatingOverlayModalProps) {
  const [estrellas, setEstrellas] = useState(5);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);

  // Determinar el grupo de etiquetas en base a la cantidad de estrellas
  const getEtiquetasDisponibles = () => {
    if (estrellas <= 2) return ETIQUETAS_POR_ESTRELLA.baja;
    if (estrellas <= 4) return ETIQUETAS_POR_ESTRELLA.media;
    return ETIQUETAS_POR_ESTRELLA.alta;
  };

  const handleStarPress = (puntos: number) => {
    setEstrellas(puntos);
    setEtiquetasSeleccionadas([]); // Limpiar etiquetas al cambiar la puntuación
  };

  const toggleEtiqueta = (tag: string) => {
    if (etiquetasSeleccionadas.includes(tag)) {
      setEtiquetasSeleccionadas(etiquetasSeleccionadas.filter(t => t !== tag));
    } else {
      setEtiquetasSeleccionadas([...etiquetasSeleccionadas, tag]);
    }
  };

  const handleEnviar = () => {
    onRate(estrellas, etiquetasSeleccionadas);
  };

  const isB2BOrder = 
    order.servicio === 'Decoración & Eventos' || 
    order.servicio === 'Branding & Lettering' || 
    order.servicio === 'Papelería & Oficina' || 
    order.servicio === 'Servicios B2B';

  const themeColor = isB2BOrder ? '#6366f1' : '#FFB400';
  const themeTextColor = isB2BOrder ? '#fff' : '#2F2F2F';
  const etiquetasDisponibles = getEtiquetasDisponibles();

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, isB2BOrder && styles.b2bBorder]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cabecera / Corona decorativa */}
          <View style={styles.crownContainer}>
            <View style={[styles.crownIconBg, { backgroundColor: themeColor }]}>
              <Ionicons name="star" size={32} color={themeTextColor} />
            </View>
          </View>

          <Text style={styles.modalTitle}>¡Servicio Terminado!</Text>
          <Text style={styles.modalMessage}>
            El proveedor <Text style={styles.bold}>{order.proveedor || 'Asignado'}</Text> ha marcado el trabajo "{order.titulo}" como finalizado.
          </Text>

          <Text style={styles.questionText}>¿Cómo calificarías su trabajo?</Text>

          {/* Fila de estrellas interactivas */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((num) => {
              const active = num <= estrellas;
              return (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleStarPress(num)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                >
                  <Ionicons 
                    name={active ? "star" : "star-outline"} 
                    size={40} 
                    color={active ? '#FFB400' : '#ccc'} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Etiquetas Dinámicas */}
          <Text style={styles.subQuestionText}>¿Qué destacarías de su servicio?</Text>
          <View style={styles.chipsContainer}>
            {etiquetasDisponibles.map((tag) => {
              const selected = etiquetasSeleccionadas.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.chip,
                    selected && { backgroundColor: themeColor, borderColor: themeColor }
                  ]}
                  onPress={() => toggleEtiqueta(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    selected && { color: themeTextColor, fontWeight: 'bold' }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón de Enviar Calificación (Sin cancelar para bloquear el flujo) */}
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: themeColor }]}
            onPress={handleEnviar}
            activeOpacity={0.7}
          >
            <Text style={[styles.submitBtnText, { color: themeTextColor }]}>Enviar Calificación</Text>
            <Ionicons name="arrow-forward" size={18} color={themeTextColor} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  b2bBorder: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  crownContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  crownIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#2F2F2F',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  starTouch: {
    padding: 4,
  },
  subQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    height: 52,
    gap: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

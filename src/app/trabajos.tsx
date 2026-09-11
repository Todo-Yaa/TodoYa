import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useUser } from '../context/user-context';
import { esPedidoTarifaAlta } from '../services/scoring';

export default function TrabajosScreen() {
  const { orders, completeJob, activeUser, cancelOrder } = useUser();
  const isB2BProvider = activeUser?.tipoEntidad === 'empresa';

  // Nombre de perfil del proveedor activo de forma dinámica
  const providerName = activeUser?.nombre || 'Juan Ríos';

  // Filtrar los trabajos asignados al proveedor actual en lugar de usar un nombre fijo
  const trabajos = orders.filter(o => o.proveedor === providerName);

  // Custom modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: () => {},
    singleButton: false
  });

  // Modal de cancelación con justificación (Sistema de Scoring Tarea 3.3)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfig, setCancelConfig] = useState<{ orderId: number; titulo: string } | null>(null);

  const handleComplete = (id: number, title: string) => {
    setConfirmConfig({
      title: '¿Completar Trabajo?',
      message: `¿Confirmas que has terminado el trabajo "${title}"?`,
      singleButton: false,
      onConfirm: () => {
        completeJob(id);
        setTimeout(() => {
          setConfirmConfig({
            title: '¡Trabajo Completado!',
            message: 'Se ha enviado la notificación al cliente y registrado en tus estadísticas.',
            onConfirm: () => {},
            singleButton: true
          });
          setShowConfirmModal(true);
        }, 100);
      }
    });
    setShowConfirmModal(true);
  };

  const handleCancelAsk = (id: number, title: string) => {
    setCancelConfig({ orderId: id, titulo: title });
    setShowCancelModal(true);
  };

  const confirmCancel = (justificada: boolean) => {
    if (!cancelConfig) return;
    const ok = cancelOrder(cancelConfig.orderId, justificada, justificada ? 'Cancelación justificada por el proveedor' : 'Cancelación injustificada');
    setShowCancelModal(false);
    if (ok) {
      setTimeout(() => {
        setConfirmConfig({
          title: justificada ? 'Cancelación Justificada' : 'Cancelación Registrada',
          message: justificada
            ? 'El trabajo se canceló sin penalización. No pierdes puntos de tu calificación.'
            : 'Se registró una cancelación injustificada: pierdes 10 puntos de tu calificación visible.',
          onConfirm: () => {},
          singleButton: true
        });
        setShowConfirmModal(true);
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* CORRECCIÓN: Header adaptativo. Si es empresa proveedora (B2B), se colorea con Slate oscuro (#1e293b) e Índigo (#818cf8). */}
      <View style={[styles.header, isB2BProvider && { backgroundColor: '#1e293b' }]}>
        <Text style={[styles.headerTitle, isB2BProvider && { color: '#818cf8' }]}>Mis trabajos</Text>
      </View>

      <ScrollView style={styles.body}>
        {trabajos.map((trabajo) => (
          <View key={trabajo.id} style={styles.trabajoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.titulo}>{trabajo.titulo}</Text>
              {/* Badge de estado adaptado cromáticamente */}
              <View style={[
                styles.estadoBadge, 
                { backgroundColor: trabajo.estado === 'Completado' ? '#e8f5e9' : (isB2BProvider ? '#e0e7ff' : '#FFF8DC') }
              ]}>
                <Text style={{ 
                  color: trabajo.estado === 'Completado' ? '#1b5e20' : (isB2BProvider ? '#3730a3' : '#8a6d00'),
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  {trabajo.estado}
                </Text>
              </View>
            </View>

            <Text style={styles.detalle}>
              {trabajo.servicio} · {trabajo.precio} acordados
            </Text>
            <Text style={styles.hora}>{trabajo.hora}</Text>

            <View style={styles.progressBar}>
              {/* Relleno de progreso adaptado al tipo de proveedor */}
              <View style={[
                styles.progressFill, 
                { 
                  width: `${trabajo.progreso}%`, 
                  backgroundColor: trabajo.estado === 'Completado' ? '#4caf50' : (isB2BProvider ? '#6366f1' : '#FFB400') 
                }
              ]} />
            </View>

            {trabajo.estado === 'En progreso' && (
              <>
                <TouchableOpacity 
                  style={[styles.completeBtn, isB2BProvider && { backgroundColor: '#6366f1' }]}
                  onPress={() => handleComplete(trabajo.id, trabajo.titulo)}
                >
                  <Ionicons name="checkmark-circle" size={18} color={isB2BProvider ? '#fff' : '#2F2F2F'} />
                  <Text style={[styles.completeBtnText, isB2BProvider && { color: '#fff' }]}>Marcar como completado</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cancelWorkBtn, isB2BProvider && { borderColor: '#c7d2fe' }]}
                  onPress={() => handleCancelAsk(trabajo.id, trabajo.titulo)}
                >
                  <Ionicons name="close-circle" size={16} color={isB2BProvider ? '#4f46e5' : '#b91c1c'} />
                  <Text style={[styles.cancelWorkBtnText, isB2BProvider && { color: '#4f46e5' }]}>Cancelar trabajo (afecta puntaje)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        {trabajos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No tienes trabajos asignados aún</Text>
            <Text style={styles.emptySubtext}>Postúlate a leads activos para empezar a trabajar.</Text>
          </View>
        )}
      </ScrollView>

      {/* Custom Modal con bordes y botones adaptados cromáticamente */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isB2BProvider && { borderColor: '#6366f1' }]}>
            <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            <View style={styles.modalButtons}>
              {!confirmConfig.singleButton && (
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, isB2BProvider && { backgroundColor: '#6366f1' }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmConfig.onConfirm();
                }}
              >
                <Text style={[styles.modalConfirmText, isB2BProvider && { color: '#fff' }]}>
                  {confirmConfig.singleButton ? 'Entendido' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    {/* Modal de Cancelación con justificación (Sistema de Scoring Tarea 3.3) */}
      {showCancelModal && cancelConfig && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isB2BProvider && { borderColor: '#6366f1' }]}>
            <Text style={styles.modalTitle}>¿Cancelar "{cancelConfig.titulo}"?</Text>
            <Text style={styles.modalMessage}>
              Toda cancelación injustificada resta 10 puntos de tu calificación visible (100 pts = 5.0★).{' '}
              {esPedidoTarifaAlta(orders.find(o => o.id === cancelConfig.orderId)?.precio)
                ? 'Este trabajo es de tarifa alta: perder acceso durante un tiempo también podría impedirte postularte a nuevos pedidos de alto valor.'
                : 'Si pierdes el puntaje perderás acceso a pedidos de tarifa alta (min 80 pts).'}
            </Text>
            <Text style={styles.modalMessageSmall}>¿La cancelación tiene una justificación válida?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: '#059669' }]}
                onPress={() => confirmCancel(true)}
              >
                <Text style={[styles.modalCancelText, { color: '#059669' }]}>Sí, justificada</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#dc2626' }]}
                onPress={() => confirmCancel(false)}
              >
                <Text style={styles.modalConfirmText}>No, cancelar igual</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowCancelModal(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={[styles.modalCancelText, { color: '#888' }]}>Volver sin cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2F2F2F',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFB400' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  trabajoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titulo: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detalle: { fontSize: 14, color: '#555', marginBottom: 4 },
  hora: { fontSize: 13, color: '#888', marginBottom: 12 },

  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB400',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#2F2F2F',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelWorkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 8,
  },
  cancelWorkBtnText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#2F2F2F',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#FFB400',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalMessageSmall: {
    fontSize: 14,
    color: '#2F2F2F',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#FFB400',
  },
  modalConfirmText: {
    color: '#2F2F2F',
    fontSize: 14,
    fontWeight: '700',
  },
});


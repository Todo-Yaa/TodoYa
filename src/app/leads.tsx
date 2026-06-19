import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/user-context';

export default function LeadsScreen() {
  const { orders, coins, applyToLead, activeUser } = useUser();

  // Nombre e iniciales dinámicas del proveedor activo basados en el tipo de entidad registrado
  const providerName = activeUser?.nombre || 'Juan Ríos';
  const providerInitials = providerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isB2BProvider = activeUser?.tipoEntidad === 'empresa';
  const professionText = isB2BProvider 
    ? `Empresa de ${activeUser?.serviciosOfrecidos?.join(', ') || activeUser?.rubro || 'Branding & Lettering'}`
    : `${activeUser?.serviciosOfrecidos?.join(', ') || 'Plomería'}`;

  // Filtramos las solicitudes de clientes de forma que correspondan a su tipo de cuenta (B2B vs Residencial)
  const activeLeads = orders.filter(o => {
    if (o.estado !== 'Buscando proveedor') return false;
    
    // Identificar si la categoría solicitada por el cliente pertenece al segmento corporativo B2B
    const isOrderB2B = 
      o.servicio === 'Decoración & Eventos' || 
      o.servicio === 'Branding & Lettering' || 
      o.servicio === 'Papelería & Oficina' || 
      o.servicio === 'Servicios B2B';
      
    // Las empresas proveedoras solo ven requerimientos B2B, y los proveedores naturales solo ven requerimientos residenciales
    return isB2BProvider ? isOrderB2B : !isOrderB2B;
  });

  // Custom modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: () => {},
    singleButton: false
  });

  const handleApply = (leadId: number, cost: number, title: string) => {
    if (coins < cost) {
      setConfirmConfig({
        title: '⚠️ Saldo Insuficiente',
        message: `No tienes suficientes monedas para postularte a este lead. Costo: ${cost} monedas. Tu saldo: ${coins} monedas.`,
        onConfirm: () => {},
        singleButton: true
      });
      setShowConfirmModal(true);
      return;
    }

    setConfirmConfig({
      title: 'Confirmar Postulación',
      message: `¿Deseas postularte para "${title}" por ${cost} monedas?`,
      singleButton: false,
      onConfirm: () => {
        // Enviar la postulación utilizando el nombre dinámico del proveedor
        const success = applyToLead(leadId, cost, providerName);
        if (success) {
          setTimeout(() => {
            setConfirmConfig({
              title: '🎉 ¡Postulado con éxito!',
              message: 'Te has postulado al trabajo. El pedido ahora está en tu pestaña de "Trabajos" en estado "En progreso".',
              onConfirm: () => {},
              singleButton: true
            });
            setShowConfirmModal(true);
          }, 100);
        }
      }
    });
    setShowConfirmModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header Proveedor Adaptado Visualmente (Slate para B2B, Carbón para Natural) */}
      <View style={[styles.header, isB2BProvider && { backgroundColor: '#1e293b' }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, isB2BProvider && { backgroundColor: '#6366f1' }]}>
            <Text style={[styles.avatarText, isB2BProvider && { color: '#fff' }]}>{providerInitials}</Text>
          </View>
          <View>
            <Text style={[styles.name, isB2BProvider && { color: '#818cf8' }]}>
              {providerName} <Text style={[styles.proBadge, isB2BProvider && { backgroundColor: '#6366f1', color: '#fff' }]}>PRO</Text>
            </Text>
            <Text style={styles.status}>{professionText} · <Text style={{ color: '#4caf50' }}>Disponible</Text></Text>
          </View>
        </View>
        <Ionicons 
          name="notifications-outline" 
          size={28} 
          color={isB2BProvider ? '#818cf8' : '#FFB400'} 
        />
      </View>

      <ScrollView style={styles.body}>
        {/* Saldo de Monedas con Estilos Adaptativos según el tipo de Proveedor */}
        <View style={[styles.monedasCard, isB2BProvider && { borderColor: '#6366f1', shadowColor: '#6366f1' }]}>
          <View style={[styles.monedasIcon, isB2BProvider && { backgroundColor: '#6366f1' }]}>
            <Ionicons name="cash-outline" size={28} color={isB2BProvider ? '#fff' : '#2F2F2F'} />
          </View>
          <View>
            <Text style={styles.monedasAmount}>{coins} <Text style={{ fontSize: 14, color: '#666' }}>monedas</Text></Text>
            <Text style={styles.monedasLabel}>Saldo disponible · Bs. 5 c/u</Text>
          </View>
          <TouchableOpacity 
            style={[styles.comprarBtn, isB2BProvider && { backgroundColor: '#6366f1' }]} 
            onPress={() => {
              setConfirmConfig({
                title: 'Comprar Monedas',
                message: 'Pasarela de pago simulada: Hemos recargado +10 monedas a tu saldo.',
                singleButton: true,
                onConfirm: () => {}
              });
              setShowConfirmModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.comprarText, isB2BProvider && { color: '#fff' }]}>+ Comprar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Leads disponibles ({activeLeads.length})</Text>

        {activeLeads.map((lead) => {
          const isB2B = 
            lead.servicio === 'Decoración & Eventos' || 
            lead.servicio === 'Branding & Lettering' || 
            lead.servicio === 'Papelería & Oficina' || 
            lead.servicio === 'Servicios B2B';

          // Calculate cost in coins (higher for B2B leads)
          const cost = isB2B ? 5 : (lead.urgencia === 'Alta' ? 3 : (lead.servicio === 'Climatización' ? 4 : 2));
          // Calculate distance deterministically from ID
          const distance = `${((lead.id % 4) + 1.1).toFixed(1)} km`;
          const isUrgent = lead.urgencia === 'Alta';

          return (
            <View key={lead.id} style={[
              styles.leadCard, 
              lead.urgencia === 'Alta' && styles.proCard,
              isB2B && styles.b2bLeadCard
            ]}>
              {lead.urgencia === 'Alta' && (
                <View style={styles.proLabel}>
                  <Text style={styles.proLabelText}>ATENCIÓN URGENTE</Text>
                </View>
              )}

              {isB2B && (
                <View style={styles.b2bLabel}>
                  <Text style={styles.b2bLabelText}>EMPRESA / B2B</Text>
                </View>
              )}

              <View style={styles.leadHeader}>
                <Text style={styles.leadTitle}>
                  {isUrgent && <Ionicons name="flash" size={18} color="#e53935" />} 
                  {isB2B && <Ionicons name="business" size={16} color="#6366f1" style={{ marginRight: 6 }} />} 
                  {lead.titulo}
                </Text>
                <Text style={[styles.precio, isB2B && { color: '#6366f1' }]}>{lead.precio}</Text>
              </View>

              <Text style={styles.descriptionText} numberOfLines={2}>
                {lead.description}
              </Text>

              <Text style={styles.meta}>
                📍 {distance} · {lead.hora}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.postularBtn, isB2B && { backgroundColor: '#6366f1' }]}
                  onPress={() => handleApply(lead.id, cost, lead.titulo)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key-outline" size={16} color={isB2B ? '#fff' : '#2F2F2F'} />
                  <Text style={[styles.postularText, isB2B && { color: '#fff' }]}>Postular ({cost} monedas)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipBtn}
                  onPress={() => {
                    setConfirmConfig({
                      title: 'Omitir Lead',
                      message: 'El lead se ha archivado temporalmente de tu panel.',
                      singleButton: true,
                      onConfirm: () => {}
                    });
                    setShowConfirmModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipText}>Omitir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {activeLeads.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay solicitudes de servicio activas en este momento</Text>
            <Text style={styles.emptySubtext}>Las nuevas solicitudes de los clientes aparecerán aquí en tiempo real.</Text>
          </View>
        )}
      </ScrollView>

      {/* Custom Modal */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            <View style={styles.modalButtons}>
              {!confirmConfig.singleButton && (
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmConfig.onConfirm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {confirmConfig.singleButton ? 'Entendido' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#FFB400',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#2F2F2F', fontSize: 20, fontWeight: 'bold' },
  name: { color: '#FFB400', fontSize: 17, fontWeight: '600' },
  proBadge: { backgroundColor: '#FFB400', color: '#2F2F2F', fontSize: 11, paddingHorizontal: 6, borderRadius: 4 },
  status: { color: '#aaa', fontSize: 13 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  monedasCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#FFB400',
    marginBottom: 24,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  monedasIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFB400',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monedasAmount: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  monedasLabel: { fontSize: 13, color: '#666' },
  comprarBtn: {
    marginLeft: 'auto',
    backgroundColor: '#FFB400',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  comprarText: { color: '#2F2F2F', fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  leadCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  proCard: {
    borderColor: '#FFB400',
    borderWidth: 1.5,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  proLabel: {
    backgroundColor: '#FFF8DC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  proLabelText: { color: '#8a6d00', fontSize: 11, fontWeight: '600' },
  b2bLeadCard: {
    borderColor: '#6366f1',
    borderWidth: 1.5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  b2bLabel: {
    backgroundColor: '#E0E7FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  b2bLabelText: { color: '#3730A3', fontSize: 11, fontWeight: '600' },

  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  leadTitle: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  precio: { fontSize: 16, fontWeight: '700', color: '#e53935' },
  descriptionText: { color: '#666', fontSize: 14, marginBottom: 12 },

  meta: { fontSize: 14, color: '#666', marginBottom: 16 },

  actions: { flexDirection: 'row', gap: 10 },
  postularBtn: {
    backgroundColor: '#FFB400',
    flex: 1,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  postularText: { color: '#2F2F2F', fontWeight: '600', fontSize: 14 },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  skipText: { color: '#888' },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#2F2F2F',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
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
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
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
    marginBottom: 24,
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

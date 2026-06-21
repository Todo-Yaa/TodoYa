import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/user-context';

/**
 * Componente PperfilScreen (Vista del Proveedor PRO):
 * Despliega las estadísticas de trabajo, el saldo actual de monedas del proveedor,
 * los detalles de su membresía PRO y permite regresar al "Modo Cliente".
 */
export default function PperfilScreen() {
  const { toggleRole, coins, orders, logout, activeUser } = useUser();

  // Controladores del modal de confirmación personalizado
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: () => {},
    singleButton: false
  });

  /**
   * Cambia el rol actual a 'client' (Cliente) y redirige
   * a la página de Inicio del Cliente (pantalla del mapa de servicios).
   */
  const handleSwitchRole = () => {
    toggleRole();
    router.replace('/'); // Redirecciona al inicio del cliente
  };

  /**
   * Muestra el modal de confirmación premium antes de cerrar la sesión.
   */
  const handleLogout = () => {
    setConfirmConfig({
      title: '¿Cerrar Sesión?',
      message: '¿Estás seguro de que deseas cerrar tu sesión en Todo Ya?',
      singleButton: false,
      onConfirm: () => {
        logout();
        router.replace('/'); // Redirige a raíz para forzar el Login
      }
    });
    setShowConfirmModal(true);
  };

  const providerName = activeUser?.nombre || 'Juan Ríos';
  const providerInitials = providerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isB2BProvider = activeUser?.tipoEntidad === 'empresa';
  const professionText = isB2BProvider 
    ? `Empresa Proveedora de ${activeUser?.serviciosOfrecidos?.join(', ') || activeUser?.rubro || 'Branding & Lettering'} · Cobertura: ${activeUser?.coberturaB2B || 'Nacional'}`
    : `${activeUser?.serviciosOfrecidos?.join(', ') || 'Plomería'} · Experiencia: ${activeUser?.anosExperiencia || 'Más de 3 años'}`;

  // Filtra y calcula los trabajos activos asignados al perfil del proveedor
  const myJobs = orders.filter(o => o.proveedor === providerName);
  const trabajosCount = 15 + myJobs.length; // 15 trabajos preexistentes simulados + los nuevos postulados

  // Calcular ingresos del mes dinámicamente
  const completedJobs = myJobs.filter(o => o.estado === 'Completado');
  const dynamicEarnings = completedJobs.reduce((acc, job) => {
    const numbers = job.precio?.match(/\d+/g);
    let priceVal = 80; // Default fallback
    if (numbers && numbers.length > 0) {
      priceVal = parseInt(numbers[0]);
    }
    return acc + priceVal;
  }, 0);
  const totalEarnings = 2800 + dynamicEarnings;

  // Calcular calificación promedio dinámicamente
  const ratedJobs = myJobs.filter(o => o.estado === 'Completado' && o.calificado);
  let averageRating = 4.9;
  if (ratedJobs.length > 0) {
    const sum = ratedJobs.reduce((acc, o) => acc + (o.calificacionEstrellas || 5), 0);
    averageRating = parseFloat((sum / ratedJobs.length).toFixed(1));
  }

  return (
    <View style={styles.container}>
      {/* CORRECCIÓN: Encabezado adaptativo. Si es empresa proveedora (B2B), se colorea con Slate oscuro (#1e293b) e Índigo (#818cf8). */}
      <View style={[styles.header, isB2BProvider && { backgroundColor: '#1e293b' }]}>
        <Text style={[styles.headerTitle, isB2BProvider && { color: '#818cf8' }]}>Mi perfil profesional</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Tarjeta de Información General e Indicadores (Monedas, Calificación, Trabajos) */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarBig, isB2BProvider && { backgroundColor: '#6366f1' }]}>
            <Text style={[styles.avatarTextBig, isB2BProvider && { color: '#fff' }]}>{providerInitials}</Text>
          </View>
          <Text style={styles.name}>
            {providerName} <Text style={[styles.proBadge, isB2BProvider && { backgroundColor: '#6366f1', color: '#fff' }]}>PRO</Text>
          </Text>
          <Text style={styles.profession}>{professionText}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trabajosCount}</Text>
              <Text style={styles.statLabel}>Trabajos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{averageRating} ★</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statItem}>
              {/* Despliega el saldo de monedas reactivo útil para postularse a leads */}
              <Text style={styles.statNumber}>{coins}</Text>
              <Text style={styles.statLabel}>Monedas</Text>
            </View>
          </View>
        </View>

        {/* Presentación del Proveedor */}
        <Text style={styles.sectionTitle}>
          {isB2BProvider ? 'Detalles de la Empresa' : 'Especialidades & Presentación'}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.tagsRow}>
            {(activeUser?.serviciosOfrecidos || (isB2BProvider ? ['Branding & Lettering'] : ['Plomería'])).map((serv) => (
              <View key={serv} style={[styles.infoTag, isB2BProvider && { backgroundColor: '#e0e7ff' }]}>
                <Text style={[styles.infoTagText, isB2BProvider && { color: '#3730a3' }]}>{serv}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.infoText}>
            {activeUser?.descripcionProveedor || (isB2BProvider 
              ? 'Ofrecemos soluciones gráficas y branding corporativo de alta calidad.' 
              : 'Proveedor de servicios residenciales certificado y de confianza.')}
          </Text>
        </View>

        {/* Tarjeta de Cambio de Rol a Cliente */}
        <Text style={styles.sectionTitle}>Modo Cliente</Text>
        <View style={styles.toggleCard}>
          <TouchableOpacity style={styles.toggleRow} onPress={handleSwitchRole} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
              <Ionicons 
                name={isB2BProvider ? "business-outline" : "people-outline"} 
                size={24} 
                color={isB2BProvider ? "#6366f1" : "#FFB400"} 
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountText, { fontWeight: '600' }]}>
                  {isB2BProvider ? 'Volver a modo Empresa' : 'Volver a modo Cliente residencial'}
                </Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {isB2BProvider 
                    ? 'Publica requerimientos B2B para tu empresa' 
                    : 'Busca profesionales para solucionar tus problemas'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Acceso a Estadísticas Detalladas */}
        <Text style={styles.sectionTitle}>Rendimiento Financiero</Text>
        <TouchableOpacity 
          style={styles.statsShortcutCard}
          onPress={() => router.replace('/stats')}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
            <View style={styles.statsShortcutIcon}>
              <Ionicons name="bar-chart-outline" size={24} color="#FFB400" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsShortcutTitle}>Ver Estadísticas Detalladas</Text>
              <Text style={styles.statsShortcutDesc}>Ingresos del mes: Bs. {totalEarnings.toLocaleString()} · Meta 95% completada</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Información sobre el Estado de Membresía de Pago PRO */}
        <Text style={styles.sectionTitle}>Membresía</Text>
        {/* Tarjeta de membresía adaptada con bordes y sombra de color de marca */}
        <View style={[styles.proCard, isB2BProvider && { borderColor: '#6366f1', shadowColor: '#6366f1' }]}>
          <View style={styles.proHeader}>
            <Ionicons name={"crown" as any} size={32} color={isB2BProvider ? "#6366f1" : "#FFB400"} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.proTitle}>Plan PRO activo</Text>
              <Text style={styles.proSubtitle}>Acceso a leads exclusivos</Text>
            </View>
          </View>
          <Text style={styles.renovacion}>Renueva el 15 de Julio 2026</Text>
        </View>

        {/* Botón de Cierre de Sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal personalizado con bordes y botón de confirmación adaptado al tipo de proveedor */}
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
                  activeOpacity={0.7}
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
                activeOpacity={0.7}
              >
                <Text style={[styles.modalConfirmText, isB2BProvider && { color: '#fff' }]}>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFB400' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarBig: {
    width: 100,
    height: 100,
    backgroundColor: '#FFB400',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTextBig: { color: '#2F2F2F', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '600', color: '#2F2F2F' },
  proBadge: { backgroundColor: '#FFB400', color: '#2F2F2F', fontSize: 12, paddingHorizontal: 8, borderRadius: 6, marginLeft: 6 },
  profession: { fontSize: 14, color: '#666', marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 24,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 10,
  },

  proCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FFB400',
    marginBottom: 16,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  proHeader: { flexDirection: 'row', alignItems: 'center' },
  proTitle: { fontSize: 17, fontWeight: '600', color: '#2F2F2F' },
  proSubtitle: { fontSize: 13, color: '#666' },
  renovacion: { marginTop: 12, fontSize: 13, color: '#888', textAlign: 'center' },

  logoutBtn: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  logoutText: { color: '#e53935', fontSize: 16, fontWeight: '500' },

  toggleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    justifyContent: 'space-between',
  },
  accountText: { fontSize: 16, color: '#2F2F2F' },

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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginTop: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoTagText: {
    fontSize: 11,
    color: '#5a4800',
    fontWeight: '600',
  },
  statsShortcutCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statsShortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsShortcutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F2F2F',
  },
  statsShortcutDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

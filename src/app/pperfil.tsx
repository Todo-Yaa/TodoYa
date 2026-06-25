import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/user-context';
import Storage from '../utils/storage';

// Configura los enlaces de tus redes sociales aquí:
const FACEBOOK_LINK = 'https://www.instagram.com/todoo__ya';
const INSTAGRAM_LINK = 'https://www.instagram.com/todoo__ya';

/**
 * Componente PperfilScreen (Vista del Proveedor PRO):
 * Despliega las estadísticas de trabajo, el saldo actual de monedas del proveedor,
 * los detalles de su membresía PRO y permite regresar al "Modo Cliente".
 */
export default function PperfilScreen() {
  const { t, i18n } = useTranslation();
  const { toggleRole, coins, planId, subscribeToPlan, orders, logout, activeUser } = useUser();

  // Controladores del modal de confirmación personalizado
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => { },
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
      title: t('profile.logout_confirm_title'),
      message: t('profile.logout_confirm_msg'),
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
  const currentEntidad = activeUser?.tipoEntidad || 'natural';
  const userPlan = planId || activeUser?.planId || (currentEntidad === 'empresa' ? 'business_1' : 'provider_1');
  const isPremium = currentEntidad === 'natural'
    ? (userPlan === 'provider_2' || userPlan === 'provider_3')
    : (userPlan === 'business_2' || userPlan === 'business_3');

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
        <Text style={[styles.headerTitle, isB2BProvider && { color: '#818cf8' }]}>{t('profile.provider_title')}</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Tarjeta de Información General e Indicadores (Monedas, Calificación, Trabajos) */}
        <View style={styles.profileHeader}>
          <View style={[
            styles.avatarBig, 
            isB2BProvider && { backgroundColor: '#6366f1' },
            isPremium && { backgroundColor: '#FFD700' }
          ]}>
            <Text style={[
              styles.avatarTextBig, 
              isB2BProvider && { color: '#fff' },
              isPremium && { color: '#000' }
            ]}>{providerInitials}</Text>
          </View>
          <Text style={styles.name}>
            {providerName}
            {isPremium && (
              <Text style={[styles.proBadge, { backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold' }]}> PREMIUM ★</Text>
            )}
            {!isPremium && (
              <Text style={[styles.proBadge, isB2BProvider && { backgroundColor: '#6366f1', color: '#fff' }]}> PRO</Text>
            )}
          </Text>
          <Text style={styles.profession}>{professionText}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trabajosCount}</Text>
              <Text style={styles.statLabel}>{t('profile.jobs')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{averageRating} ★</Text>
              <Text style={styles.statLabel}>{t('profile.rating')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber, 
                { fontSize: 13, color: isPremium ? '#b78103' : (isB2BProvider ? '#6366f1' : '#FFB400'), paddingVertical: 4 }
              ]}>
                {userPlan === 'provider_1' && 'Plan 1'}
                {userPlan === 'provider_2' && 'Plan 2'}
                {userPlan === 'provider_3' && 'Plan 3'}
                {userPlan === 'business_1' && 'Empresa 1'}
                {userPlan === 'business_2' && 'Empresa 2'}
                {userPlan === 'business_3' && 'Empresa 3'}
              </Text>
              <Text style={styles.statLabel}>Suscripción</Text>
            </View>
          </View>

          {/* Redes Sociales */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              onPress={() => Linking.openURL(FACEBOOK_LINK)}
              style={styles.socialIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-facebook" size={22} color={isB2BProvider ? '#818cf8' : '#3b5998'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(INSTAGRAM_LINK)}
              style={styles.socialIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-instagram" size={22} color={isB2BProvider ? '#818cf8' : '#e1306c'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Presentación del Proveedor */}
        <Text style={styles.sectionTitle}>
          {isB2BProvider ? t('profile.company_details') : t('profile.specialties_presentation')}
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
              ? t('profile.default_desc_business')
              : t('profile.default_desc_provider'))}
          </Text>
        </View>

        {/* Tarjeta de Cambio de Rol a Cliente */}
        <Text style={styles.sectionTitle}>{t('profile.client_mode_title')}</Text>
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
                  {isB2BProvider ? t('profile.back_to_client_biz') : t('profile.back_to_client_res')}
                </Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {isB2BProvider
                    ? t('profile.back_to_client_biz_desc')
                    : t('profile.back_to_client_res_desc')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Acceso a Estadísticas Detalladas */}
        <Text style={styles.sectionTitle}>{t('profile.financial_performance')}</Text>
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
              <Text style={styles.statsShortcutTitle}>{t('profile.view_detailed_stats')}</Text>
              <Text style={styles.statsShortcutDesc}>{t('profile.monthly_earnings_desc', { earnings: totalEarnings.toLocaleString() })}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Información sobre el Estado de Membresía de Pago PRO */}
        <Text style={styles.sectionTitle}>Membresía Activa</Text>
        {/* Tarjeta de membresía adaptada con bordes y sombra de color de marca */}
        <View style={[
          styles.proCard, 
          isB2BProvider && { borderColor: '#6366f1', shadowColor: '#6366f1' },
          isPremium && { borderColor: '#FFD700', shadowColor: '#FFD700', borderWidth: 2 }
        ]}>
          <View style={styles.proHeader}>
            <Ionicons name={isPremium ? "ribbon-outline" : "star-outline"} size={32} color={isPremium ? "#FFD700" : (isB2BProvider ? "#6366f1" : "#FFB400")} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.proTitle}>
                {userPlan === 'provider_1' && 'Plan 1 - Residencial'}
                {userPlan === 'provider_2' && 'Plan 2 - Profesional Premium'}
                {userPlan === 'provider_3' && 'Plan 3 - Élite Premium'}
                {userPlan === 'business_1' && 'Plan Empresa 1 - Básico'}
                {userPlan === 'business_2' && 'Plan Empresa 2 - Pro'}
                {userPlan === 'business_3' && 'Plan Empresa 3 - Élite Nacional'}
              </Text>
              <Text style={styles.proSubtitle}>
                {userPlan === 'provider_1' && 'Acceso ilimitado a clientes residenciales.'}
                {userPlan === 'provider_2' && 'Residenciales ilimitados + 3 corporativos/mes.'}
                {userPlan === 'provider_3' && 'Acceso total e ilimitado residencial/empresa.'}
                {userPlan === 'business_1' && 'Acceso ilimitado a solicitudes corporativas.'}
                {userPlan === 'business_2' && 'Acceso ilimitado mixto residencial/corporativo.'}
                {userPlan === 'business_3' && 'Acceso total ilimitado + Cartera Nacional.'}
              </Text>
            </View>
          </View>
          <Text style={styles.renovacion}>Estado: Activo · Renueba el 15 de Julio 2026</Text>
          
          <TouchableOpacity 
            style={[
              styles.upgradeBtn, 
              isB2BProvider ? { backgroundColor: '#6366f1' } : { backgroundColor: '#FFB400' },
              isPremium && { backgroundColor: '#FFD700' }
            ]}
            onPress={() => router.replace('/leads')}
            activeOpacity={0.7}
          >
            <Text style={[styles.upgradeBtnText, isPremium && { color: '#000' }]}>Cambiar o Actualizar Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Configuración de Idioma de la App */}
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.toggleCard}>
          <View style={styles.languageRow}>
            <Ionicons name="globe-outline" size={24} color="#666" style={{ marginRight: 16 }} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Text style={styles.accountText}>{t('profile.language')}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[
                  { code: 'es', name: 'ES' },
                  { code: 'en', name: 'EN' },
                  { code: 'pt', name: 'PT' },
                  { code: 'qu', name: 'QU' },
                  { code: 'ay', name: 'AY' },
                  { code: 'gn', name: 'GN' }
                ].map((lang) => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isActive ? (isB2BProvider ? '#6366f1' : '#FFB400') : '#e2e8f0',
                      }}
                      onPress={async () => {
                        await i18n.changeLanguage(lang.code);
                        await Storage.setItem('user-language', lang.code);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ 
                        fontSize: 10, 
                        fontWeight: 'bold', 
                        color: isActive ? (isB2BProvider ? '#fff' : '#2F2F2F') : '#475569' 
                      }}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Botón de Cierre de Sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
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
                  <Text style={styles.modalCancelText}>{t('profile.cancel')}</Text>
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
                  {confirmConfig.singleButton ? t('profile.understood') : t('profile.confirm')}
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
  upgradeBtn: {
    backgroundColor: '#FFB400',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#2F2F2F',
    fontWeight: '700',
    fontSize: 13,
  },

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
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
});

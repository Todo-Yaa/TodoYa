import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/user-context';
import Storage from '../utils/storage';
import TermsPrivacyModal from '../components/terms-privacy-modal';

// Configura los enlaces de tus redes sociales aquí:
const FACEBOOK_LINK = 'https://www.instagram.com/todoo__ya';
const INSTAGRAM_LINK = 'https://www.instagram.com/todoo__ya';

/**
 * Componente PperfilScreen (Vista del Proveedor PRO):
 * Despliega las estadísticas de trabajo, el saldo actual de monedas del proveedor,
 * los detalles de su membresía PRO y permite regresar al "Modo Cliente".
 */
export default function ProviderPerfilScreen() {
  const { t, i18n } = useTranslation();
  const { logout, deleteAccount, userRole, planId, coins, activeUser, toggleRole, actualizarFotoPerfil, triggerLocationCheck, orders } = useUser();
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    triggerLocationCheck().catch(() => {});
  }, []);

  const [cargandoFoto, setCargandoFoto] = useState(false);

  const seleccionarImagen = () => {
    const ultimaFecha = activeUser?.fechaUltimaModificacionFoto;
    if (ultimaFecha) {
      const diffTime = Math.abs(Date.now() - new Date(ultimaFecha).getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays < 15) {
        const diasRestantes = Math.ceil(15 - diffDays);
        setConfirmConfig({
          title: 'Límite de 15 días activo',
          message: `Solo puedes cambiar o eliminar tu foto de perfil cada 15 días. Podrás realizar cambios nuevamente en ${diasRestantes} días.`,
          onConfirm: () => {},
          singleButton: true
        });
        setShowConfirmModal(true);
        return;
      }
    }

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setCargandoFoto(true);
          const reader = new FileReader();
          reader.onload = async (readerEvent: any) => {
            const base64 = readerEvent.target.result;
            await actualizarFotoPerfil(base64);
            setCargandoFoto(false);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setCargandoFoto(true);
      setTimeout(async () => {
        await actualizarFotoPerfil("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
        setCargandoFoto(false);
      }, 1000);
    }
  };

  const eliminarImagen = () => {
    const ultimaFecha = activeUser?.fechaUltimaModificacionFoto;
    if (ultimaFecha) {
      const diffTime = Math.abs(Date.now() - new Date(ultimaFecha).getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays < 15) {
        const diasRestantes = Math.ceil(15 - diffDays);
        setConfirmConfig({
          title: 'Límite de 15 días activo',
          message: `Solo puedes cambiar o eliminar tu foto de perfil cada 15 días. Podrás realizar cambios nuevamente en ${diasRestantes} días.`,
          onConfirm: () => {},
          singleButton: true
        });
        setShowConfirmModal(true);
        return;
      }
    }

    setConfirmConfig({
      title: '¿Eliminar foto de perfil?',
      message: '¿Estás seguro de que deseas eliminar tu foto de perfil? Esto contará como una modificación y no podrás volver a subir una foto por 15 días.',
      onConfirm: async () => {
        setCargandoFoto(true);
        await actualizarFotoPerfil(null);
        setCargandoFoto(false);
      },
      singleButton: false
    });
    setShowConfirmModal(true);
  };


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

  const handleDeleteAccount = () => {
    setConfirmConfig({
      title: '¿Eliminar tu Cuenta?',
      message: '¿Estás completamente seguro? Esta acción es definitiva y borrará permanentemente todos tus datos, historial de trabajos y saldo acumulado de forma irreversible.',
      singleButton: false,
      onConfirm: async () => {
        await deleteAccount();
        router.replace('/');
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

  const serviciosList = activeUser?.serviciosOfrecidos || [];
  const serviciosCount = serviciosList.length;

  let mainProfessionTitle = 'Proveedor de Servicios Verificado';
  if (isB2BProvider) {
    mainProfessionTitle = activeUser?.rubro 
      ? `Empresa Proveedora de ${activeUser.rubro}`
      : (serviciosCount === 1 ? `Empresa de ${serviciosList[0]}` : 'Empresa Proveedora Corporativa B2B');
  } else {
    if (serviciosCount === 1) {
      mainProfessionTitle = `Técnico Especialista en ${serviciosList[0]}`;
    } else if (serviciosCount > 1 && serviciosCount <= 3) {
      mainProfessionTitle = `Especialista en ${serviciosList.join(', ')}`;
    } else if (serviciosCount > 3) {
      mainProfessionTitle = 'Técnico Especialista Multidisciplinario';
    }
  }

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
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <TouchableOpacity 
              style={[
                styles.avatarBig, 
                isB2BProvider && { backgroundColor: '#6366f1' },
                isPremium && { backgroundColor: '#FFD700' },
                { overflow: 'hidden', marginBottom: 0 }
              ]}
              onPress={seleccionarImagen}
              activeOpacity={0.8}
            >
              {cargandoFoto ? (
                <ActivityIndicator size="small" color={isPremium ? '#000' : '#fff'} />
              ) : activeUser?.fotoPerfil ? (
                <Image source={{ uri: activeUser.fotoPerfil }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={[
                  styles.avatarTextBig, 
                  isB2BProvider && { color: '#fff' },
                  isPremium && { color: '#000' }
                ]}>{providerInitials}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.editPhotoOverlay, isB2BProvider ? { backgroundColor: '#6366f1' } : { backgroundColor: '#FFB400' }]}
              onPress={seleccionarImagen}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={14} color={isB2BProvider ? '#fff' : '#2F2F2F'} />
            </TouchableOpacity>

            {activeUser?.fotoPerfil && (
              <TouchableOpacity 
                style={styles.deletePhotoOverlay}
                onPress={eliminarImagen}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={12} color="#fff" />
              </TouchableOpacity>
            )}
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
          <Text style={styles.profession}>{mainProfessionTitle}</Text>

          {/* Badges estéticos de Especialidad y Experiencia */}
          <View style={styles.headerBadgesRow}>
            <View style={[styles.headerBadgePill, isB2BProvider ? { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' } : { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
              <Ionicons name={isB2BProvider ? "earth-outline" : "construct-outline"} size={13} color={isB2BProvider ? "#4f46e5" : "#d97706"} />
              <Text style={[styles.headerBadgeText, isB2BProvider ? { color: '#3730a3' } : { color: '#b45309' }]}>
                {isB2BProvider ? `Cobertura: ${activeUser?.coberturaB2B || 'Nacional'}` : (serviciosCount > 1 ? `${serviciosCount} Especialidades` : (serviciosList[0] || 'Servicio General'))}
              </Text>
            </View>

            <View style={styles.headerBadgePillGray}>
              <Ionicons name="time-outline" size={13} color="#64748b" />
              <Text style={styles.headerBadgeTextGray}>
                {activeUser?.anosExperiencia || 'Más de 3 años de exp.'}
              </Text>
            </View>
          </View>

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
                  { code: 'pt', name: 'PT-BR' },
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

        {/* Botones de Cuenta */}
        <View style={{ gap: 4, marginBottom: 30 }}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: '#3b82f6', backgroundColor: '#eff6ff', borderWidth: 1, borderRadius: 12 }]} 
            onPress={() => setShowTermsModal(true)} 
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={22} color="#3b82f6" />
            <Text style={[styles.logoutText, { color: '#3b82f6', fontWeight: 'bold' }]}>Términos, Privacidad & Cumplimiento Legal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: '#ea4335', backgroundColor: '#fef2f2', borderWidth: 1, borderRadius: 12 }]} 
            onPress={() => {
              Linking.openURL('mailto:todoo.yap@gmail.com?subject=Sugerencia%20y%20Soporte%20-%20Todo%20Ya').catch(err => console.warn(err));
            }} 
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={22} color="#ea4335" />
            <Text style={[styles.logoutText, { color: '#ea4335', fontWeight: 'bold' }]}>Soporte & Recomendaciones (todoo.yap@gmail.com)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#e53935" />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logoutBtn, { marginTop: 10, borderColor: '#dc2626', backgroundColor: '#fef2f2', borderWidth: 1, borderRadius: 12 }]} 
            onPress={handleDeleteAccount} 
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={22} color="#dc2626" />
            <Text style={[styles.logoutText, { color: '#dc2626', fontWeight: '600' }]}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>
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
      {/* Modal de Términos, Privacidad & Cumplimiento Legal */}
      <TermsPrivacyModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
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
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  deletePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarTextBig: { color: '#2F2F2F', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '600', color: '#2F2F2F' },
  proBadge: { backgroundColor: '#FFB400', color: '#2F2F2F', fontSize: 12, paddingHorizontal: 8, borderRadius: 6, marginLeft: 6 },
  profession: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 4, textAlign: 'center' },
  headerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  headerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerBadgePillGray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerBadgeTextGray: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },

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

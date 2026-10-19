import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { listTrades } from '../services/auth/professional-profile';

// Configura los enlaces de tus redes sociales aquí:
import { useUser } from '../context/user-context';
import Storage from '../utils/storage';
import { getBusinessContextId, getBusinessCategories, getBusinessProviderSettings, saveBusinessProviderSettings, type BusinessProviderCategory } from '../services/auth/business-provider';
import KYCVerifierModal from '../components/kyc-verifier-modal';
import { getBusinessSettings, saveBusinessSettings, type BusinessSettings } from '../services/auth/business-profile';
import { getPersonalSettings, savePersonalSettings, type PersonalSettings } from '../services/auth/personal-profile';


/**
 * Componente PerfilScreen (Vista del Cliente):
 * Permite gestionar los datos de la cuenta del cliente, cerrar sesión con confirmación
 * y alternar al "Modo Proveedor" para acceder a las pantallas correspondientes.
 */
export default function PerfilScreen() {
  const { t, i18n } = useTranslation();
  const { toggleRole, logout, deleteAccount, userName, userRole, setRole, activeUser, configurarProveedor, actualizarKyc, banearProveedor, usuariosRegistrados, lastKnownCity, triggerLocationCheck } = useUser();
  const isBusiness = userRole === 'business';
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [businessDraft, setBusinessDraft] = useState<BusinessSettings | null>(null);
  const [businessBusy, setBusinessBusy] = useState(false);
  const [businessError, setBusinessError] = useState('');
  const [businessEditVisible, setBusinessEditVisible] = useState(false);
  const loadBusiness = async () => {
    if (!isBusiness) return;
    setBusinessBusy(true);
    try { setBusinessSettings(await getBusinessSettings()); setBusinessError(''); }
    catch (e) { setBusinessError(e instanceof Error ? e.message : 'No se pudo consultar la empresa'); }
    finally { setBusinessBusy(false); }
  };
  useEffect(() => { if (isBusiness) void loadBusiness(); }, [isBusiness, activeUser?.correoOTelefono]);
  const saveBusiness = async () => {
    if (!businessDraft) return;
    if (!businessDraft.tradeName.trim()) { setBusinessError('El nombre comercial es obligatorio'); return; }
    setBusinessBusy(true);
    try {
      const saved = await saveBusinessSettings(businessDraft);
      setBusinessSettings(saved); setBusinessEditVisible(false); setBusinessError('');
    } catch (e) { setBusinessError(e instanceof Error ? e.message : 'No se pudo guardar la empresa'); }
    finally { setBusinessBusy(false); }
  };
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings | null>(null);
  const [personalDraft, setPersonalDraft] = useState<PersonalSettings | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [editPersonalVisible, setEditPersonalVisible] = useState(false);
  const loadPersonal = async () => {
    if (isBusiness) return;
    setPersonalLoading(true);
    try {
      const data = await getPersonalSettings();
      setPersonalSettings(data);
      setPersonalError('');
    } catch (error) { setPersonalError(error instanceof Error ? error.message : 'No se pudo cargar el perfil'); }
    finally { setPersonalLoading(false); }
  };
  useEffect(() => { if (!isBusiness) void loadPersonal(); }, [isBusiness, activeUser?.correoOTelefono]);
  const savePersonal = async () => {
    if (!personalDraft) return;
    if (!personalDraft.firstName.trim() || !personalDraft.lastName.trim()) {
      setPersonalError('El nombre y apellido son obligatorios'); return;
    }
    setPersonalSaving(true);
    try {
      const updated = await savePersonalSettings(personalDraft);
      setPersonalSettings(updated);
      setEditPersonalVisible(false);
      setPersonalError('');
      // La identidad local de sesión no se utiliza para autorización.
      await loadPersonal();
    } catch (error) { setPersonalError(error instanceof Error ? error.message : 'No fue posible guardar los cambios'); }
    finally { setPersonalSaving(false); }
  };


  useEffect(() => {
    triggerLocationCheck().catch(() => {});
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  // Estados del onboarding y KYC
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [professionalTrades, setProfessionalTrades] = useState<{id:string;code:string;name:string}[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [experiencia, setExperiencia] = useState('1 a 3 años');
  const [cobertura, setCobertura] = useState('Local');
  const [businessCategories, setBusinessCategories] = useState<BusinessProviderCategory[]>([]);
  const [savingBusinessProvider, setSavingBusinessProvider] = useState(false);
  const [savingProfessional, setSavingProfessional] = useState(false);
  useEffect(() => {
    if (!isBusiness) return;
    void getBusinessCategories().then(setBusinessCategories).catch(() => {});
  }, [isBusiness]);

  useEffect(() => {
  if (isBusiness || !activeUser) return;
  let cancelled = false;
  setTradesLoading(true);
  listTrades().then(data => { if (!cancelled) { setProfessionalTrades(data); setErrorOnboarding(''); } }).catch(() => { if (!cancelled) setErrorOnboarding('No se pudieron cargar las especialidades. Inténtalo nuevamente.'); }).finally(() => { if (!cancelled) setTradesLoading(false); });
  return () => { cancelled = true; };
  }, [isBusiness, activeUser?.correoOTelefono]);

  const [descripcion, setDescripcion] = useState('');
  const [errorOnboarding, setErrorOnboarding] = useState('');
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Estados del Panel de Administración de Denuncias
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const cargarReportes = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setReportsList(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error al cargar reportes para panel de admin:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleKYCVerified = async (detalles: string) => {
    // 1. Actualizar KYC del usuario en base de datos y context
    await actualizarKyc(true, detalles);

    // 2. Si ya está configurado como proveedor, cambiar rol de inmediato. Si no, iniciar onboarding de proveedor
    if (activeUser?.proveedorConfigurado) {
      setRole('provider');
      router.replace('/leads');
    } else {
      setOnboardingStep(1);
      setShowOnboarding(true);
    }
  };

  const toggleServicio = (serv: string) => {
    if (serviciosSeleccionados.includes(serv)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s !== serv));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, serv]);
    }
  };

  const handleSaveOnboarding = async () => {
    if (serviciosSeleccionados.length === 0) {
      setErrorOnboarding('Selecciona al menos un servicio o categoría.');
      return;
    }
    if (descripcion.trim().length < 10) {
      setErrorOnboarding('Escribe una descripción de al menos 10 caracteres.');
      return;
    }

    setErrorOnboarding('');
    const isEmpresa = activeUser?.tipoEntidad === 'empresa';
    if (isEmpresa) {
      setSavingBusinessProvider(true);
      try {
        const businessContextId = await getBusinessContextId();
        const categoryIds = serviciosSeleccionados;
        if (categoryIds.some(id => !businessCategories.some(cat => cat.id === id))) throw new Error('Las categorías deben existir en PostgreSQL. Recarga el catálogo.');
        const saved = await saveBusinessProviderSettings(businessContextId, {
          bio: descripcion.trim(), coverage: cobertura === 'Nacional' ? 'NATIONAL' : 'LOCAL', categoryIds: categoryIds as string[],
        });
        if (saved.contextStatus !== 'ACTIVE') {
          setErrorOnboarding('Información guardada. El perfil proveedor está pendiente de activación y consentimiento.');
          return;
        }
      } catch (error) {
        setErrorOnboarding(error instanceof Error ? error.message : 'No se pudo guardar el perfil empresarial');
        return;
      } finally { setSavingBusinessProvider(false); }
    }
    if (!isEmpresa) {
      setSavingProfessional(true);
      try {
        await configurarProveedor(serviciosSeleccionados, experiencia, descripcion.trim());
      } catch (error) {
        setErrorOnboarding(error instanceof Error ? error.message : 'No se pudo guardar el perfil profesional.');
        return;
      } finally {
        setSavingProfessional(false);
      }
    } else {
      // El perfil empresarial ya se guardó en NestJS. No ejecutar la ruta
      // heredada de configurarProveedor, que solo actualiza el estado local.
      setRole('provider');
    }
    setShowOnboarding(false);
    setServiciosSeleccionados([]);
    setDescripcion('');
    router.replace('/leads');
  };

  /**
   * Cambia el rol actual a 'provider' (Proveedor) y redirige
   * a la pestaña de Leads de Trabajo.
   */
  const handleSwitchRole = () => {
    toggleRole();
    router.replace('/leads'); // Redirección a la primera pestaña de proveedor
  };

  /**
   * Muestra un modal de confirmación premium antes de proceder
   * a cerrar la sesión del usuario.
   */
  const handleLogout = () => {
    setConfirmConfig({
      title: '¿Cerrar Sesión?',
      message: '¿Estás seguro de que deseas cerrar tu sesión en Todo Ya?',
      onConfirm: () => {
        logout();
        router.replace('/'); // Vuelve a la raíz (donde se activará el Auth Guard)
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteAccount = () => {
    setConfirmConfig({
      title: '⚠️ ¿Eliminar tu Cuenta?',
      message: '¿Estás completamente seguro? Esta acción es definitiva y borrará permanentemente todos tus datos, historial de pedidos y saldo acumulado de forma irreversible.',
      onConfirm: async () => {
        await deleteAccount();
        router.replace('/');
      }
    });
    setShowConfirmModal(true);
  };

  // Calcula dinámicamente las iniciales del nombre de usuario para el Avatar
  const avatarInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CO';

  return (
    <View style={styles.container}>
      {/* Encabezado del perfil */}
      <View style={[styles.header, isBusiness && styles.b2bHeader]}>
        <Text style={[styles.headerTitle, isBusiness && { color: '#fff' }]}>
          {isBusiness ? 'Perfil Corporativo' : t('profile.title')}
        </Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Sección de Tarjeta del Perfil */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarBig, isBusiness && { backgroundColor: '#6366f1' }]}>
            <Text style={[styles.avatarTextBig, isBusiness && { color: '#fff' }]}>{avatarInitials}</Text>
          </View>
          <Text style={styles.name}>{(isBusiness ? businessSettings?.tradeName : (personalSettings && [personalSettings.firstName, personalSettings.lastName].filter(Boolean).join(' '))) || userName}</Text>
          <Text style={styles.veracity}>
            {isBusiness ? 'Reputación B2B comercial: ' : 'Índice de veracidad: '}
            <Text style={{ color: '#2F2F2F', fontWeight: '600' }}>{'—'}</Text>
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{'0'}</Text>
              <Text style={styles.statLabel}>{isBusiness ? 'Pedidos B2B' : 'Servicios'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{'—'}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>

          {/* Redes Sociales */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              onPress={() => { const url = isBusiness ? businessSettings?.facebookUrl : personalSettings?.facebookUrl; if (url) void Linking.openURL(url); }}
              style={styles.socialIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-facebook" size={22} color={isBusiness ? '#818cf8' : '#3b5998'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { const url = isBusiness ? businessSettings?.instagramUrl : personalSettings?.instagramUrl; if (url) void Linking.openURL(url); }}
              style={styles.socialIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-instagram" size={22} color={isBusiness ? '#818cf8' : '#e1306c'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Selector de Rol Dinámico */}
        <Text style={styles.sectionTitle}>{t('role_selector_title')}</Text>
        <View style={styles.rolesGrid}>
          {[
            { role: 'client', label: t('role_client'), icon: 'people-outline', desc: 'Residencial', path: '/' },
            { role: 'business', label: t('role_business'), icon: 'business-outline', desc: 'B2B/Corporativo', path: '/' },
            { role: 'provider', label: t('role_provider'), icon: 'construct-outline', desc: 'Ofrecer servicios', path: '/leads' }
          ]
            .filter((item) => {
              const entity = activeUser?.tipoEntidad || 'natural';
              if (entity === 'empresa') {
                return item.role !== 'client';
              } else {
                return item.role !== 'business';
              }
            })
            .map((item, index) => {
              const isActive = userRole === item.role;
              const isSelfBusiness = item.role === 'business';
              const isSelfProvider = item.role === 'provider';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.roleOptionCard,
                    isActive && (
                      isSelfBusiness ? styles.activeBusinessCard :
                      (isSelfProvider ? styles.activeProviderCard : styles.activeClientCard)
                    )
                  ]}
                  onPress={() => {
                    if (item.role === 'provider') {
                      if (activeUser?.tipoEntidad === 'natural' && !activeUser?.kycVerificado) {
                        // Obligar verificación KYC si es persona natural no verificada
                        setShowKYCModal(true);
                      } else if (activeUser?.proveedorConfigurado && activeUser?.tipoEntidad !== 'empresa') {
                        setRole('provider');
                        router.replace('/leads');
                      } else {
                        setServiciosSeleccionados([]);
                        setErrorOnboarding('');
                        setOnboardingStep(1);
                        setShowOnboarding(true);
                      }
                    } else {
                      setRole(item.role as any);
                      router.replace(item.path as any);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isActive ? '#fff' : '#666'}
                  />
                  <Text style={[styles.roleOptionLabel, isActive && { color: '#fff', fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.roleOptionDesc, isActive && { color: '#e2e8f0' }]}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Listado de Datos y Opciones de Cuenta */}
        <Text style={styles.sectionTitle}>{isBusiness ? 'Datos de la Empresa' : 'Cuenta'}</Text>
        <View style={styles.accountCard}>
          {isBusiness ? (
            <>
              <TouchableOpacity style={styles.accountRow} onPress={() => { if (businessSettings) { setBusinessDraft({ ...businessSettings }); setBusinessError(''); setBusinessEditVisible(true); } }}>
                <Ionicons name="create-outline" size={24} color="#6366f1" />
                <Text style={styles.accountText}>{businessBusy ? 'Cargando empresa…' : 'Editar datos de la empresa'}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
              {!!businessError && <Text style={{ color: '#dc2626', padding: 12 }}>{businessError}</Text>}
              <View style={styles.accountRow}>
                <Ionicons name="business-outline" size={24} color="#666" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#888' }}>Razón Social</Text>
                  <Text style={styles.accountText}>{businessSettings?.legalName || 'Sin razón social registrada'}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <Ionicons name="document-text-outline" size={24} color="#666" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#888' }}>NIT / Registro</Text>
                  <Text style={styles.accountText}>{businessSettings?.taxId || 'Sin registro fiscal'}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <Ionicons name="receipt-outline" size={24} color="#666" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#888' }}>Facturación Electrónica</Text>
                  <Text style={styles.accountText}>{businessSettings?.billingEmail || 'Sin correo de facturación'}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <Ionicons name="pie-chart-outline" size={24} color="#666" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#888' }}>Rubro de la Empresa</Text>
                  <Text style={styles.accountText}>{businessSettings?.industryLabel || businessSettings?.activityType || 'Sin rubro registrado'}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.accountRow} onPress={() => { if (personalSettings) { setPersonalDraft({ ...personalSettings }); setPersonalError(''); setEditPersonalVisible(true); } }}>
                <Ionicons name="create-outline" size={24} color="#FFB400" />
                <View style={{ flex: 1 }}><Text style={styles.accountText}>{personalSettings ? [personalSettings.firstName, personalSettings.lastName].filter(Boolean).join(' ') : userName}</Text><Text style={{ fontSize: 11, color: '#888' }}>Editar datos de cuenta {personalLoading ? '· Cargando…' : ''}</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={() => triggerLocationCheck(true)}>
                <Ionicons name="location-outline" size={24} color="#666" />
                <Text style={styles.accountText}>{personalSettings?.city || 'Sin ciudad registrada'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountRow} activeOpacity={0.7}>
                <Ionicons name="call-outline" size={24} color="#666" />
                <Text style={styles.accountText}>
                  {personalSettings?.phone || 'Sin teléfono registrado'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Fila del selector de idiomas */}
          <View style={styles.accountRow}>
            <Ionicons name="globe-outline" size={24} color="#666" />
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
                        backgroundColor: isActive ? (isBusiness ? '#6366f1' : '#FFB400') : '#e2e8f0',
                      }}
                      onPress={async () => {
                        if (!isBusiness && personalSettings) {
                          try {
                            const updated = await savePersonalSettings({ ...personalSettings, languageCode: lang.code });
                            setPersonalSettings(updated);
                          } catch (error) {
                            setPersonalError(error instanceof Error ? error.message : 'No se pudo guardar el idioma');
                            return;
                          }
                        }
                        await i18n.changeLanguage(lang.code);
                        await Storage.setItem('user-language', lang.code);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: isActive ? (isBusiness ? '#fff' : '#2F2F2F') : '#475569'
                      }}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Panel de Control de Denuncias (Simulación de Administración) */}
          <TouchableOpacity
            style={[styles.accountRow, { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
            onPress={() => {
              cargarReportes();
              setShowAdminPanel(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-outline" size={24} color="#4f46e5" />
            <Text style={[styles.accountText, { color: '#4f46e5', fontWeight: 'bold' }]}>Administrar Denuncias (Soporte)</Text>
            <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 'auto' }}>
              <Text style={{ fontSize: 10, color: '#4f46e5', fontWeight: '700' }}>Admin</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountRow, { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#e53935" />
            <Text style={[styles.accountText, { color: '#e53935' }]}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountRow, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color="#dc2626" />
            <Text style={[styles.accountText, { color: '#dc2626', fontWeight: '600' }]}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 12 }}>
          Todo Ya © 2026
        </Text>
      </ScrollView>

      <Modal visible={isBusiness && businessEditVisible} transparent animationType="fade" onRequestClose={() => setBusinessEditVisible(false)}>
        <View style={styles.adminModalOverlay}>
          <View style={[styles.adminModalContent, { height: 'auto', maxHeight: '90%', padding: 22 }]}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 15 }}>Editar empresa</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {businessDraft && ([
                ['tradeName', 'Nombre comercial'], ['legalName', 'Razón social'],
                ['taxCountryCode', 'País tributario (PE, BO...)'], ['taxId', 'RUC / NIT'],
                ['billingEmail', 'Correo de facturación'], ['industryLabel', 'Rubro comercial'],
                ['activityType', 'Actividad económica'], ['commercialPhone', 'Teléfono comercial'],
                ['city', 'Ciudad'], ['facebookUrl', 'Facebook (https://...)'],
                ['instagramUrl', 'Instagram (https://...)'],
              ] as const).map(([key, label]) => (
                <View key={key} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: '#475569', marginBottom: 5 }}>{label}</Text>
                  <TextInput value={businessDraft[key]} onChangeText={v => setBusinessDraft(p => p ? { ...p, [key]: v } : p)}
                    editable={businessDraft.canEditLegal || !(['legalName', 'taxCountryCode', 'taxId'] as string[]).includes(key)}
                    autoCapitalize={['billingEmail', 'facebookUrl', 'instagramUrl', 'taxCountryCode'].includes(key) ? 'none' : 'sentences'}
                    style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, color: '#1e293b' }}/>
                </View>
              ))}
              {!!businessError && <Text style={{ color: '#dc2626', marginBottom: 10 }}>{businessError}</Text>}
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setBusinessEditVisible(false)} style={{ padding: 14 }}><Text>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity disabled={businessBusy} onPress={() => void saveBusiness()} style={{ backgroundColor: '#6366f1', padding: 14, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{businessBusy ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!isBusiness && editPersonalVisible} transparent animationType="fade" onRequestClose={() => setEditPersonalVisible(false)}>
        <View style={styles.adminModalOverlay}>
          <View style={[styles.adminModalContent, { height: 'auto', maxHeight: '90%', padding: 22 }]}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 15 }}>Editar mi perfil</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {personalDraft && ([
                ['firstName', 'Nombres'], ['lastName', 'Apellidos'], ['phone', 'Teléfono'],
                ['city', 'Ciudad'], ['facebookUrl', 'Facebook (https://...)'],
                ['instagramUrl', 'Instagram (https://...)'],
              ] as const).map(([key, label]) => (
                <View key={key} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: '#475569', marginBottom: 5 }}>{label}</Text>
                  <TextInput value={personalDraft[key]} onChangeText={value => setPersonalDraft(v => v ? { ...v, [key]: value } : v)}
                    editable={!(personalDraft.nameEditableAfter && new Date(personalDraft.nameEditableAfter) > new Date() && (key === 'firstName' || key === 'lastName'))}
                    autoCapitalize={key === 'facebookUrl' || key === 'instagramUrl' ? 'none' : 'sentences'}
                    style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, color: '#1e293b' }}/>
                </View>
              ))}
              {personalDraft?.nameEditableAfter && new Date(personalDraft.nameEditableAfter) > new Date() && (
                <Text style={{ color: '#64748b', marginBottom: 10 }}>El nombre podrá modificarse después del {new Date(personalDraft.nameEditableAfter).toLocaleDateString()}.</Text>
              )}
              {!!personalError && <Text style={{ color: '#dc2626', marginBottom: 10 }}>{personalError}</Text>}
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setEditPersonalVisible(false)} style={{ padding: 14 }}><Text>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity disabled={personalSaving} onPress={() => void savePersonal()} style={{ backgroundColor: '#FFB400', padding: 14, borderRadius: 10 }}>
                  <Text style={{ fontWeight: '700' }}>{personalSaving ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>



      {/* Modal de confirmación personalizado (Evita alertas nativas) */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmConfig.onConfirm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal de Onboarding de Proveedor */}
      {showOnboarding && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440, width: '92%', maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Stepper Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.modalTitle, { fontSize: 13, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }]}>
                  Paso {onboardingStep} de 3
                </Text>
                <TouchableOpacity onPress={() => setShowOnboarding(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalTitle, { marginTop: 0, marginBottom: 12 }]}>
                {onboardingStep === 1 && "Especialidades y Categorías"}
                {onboardingStep === 2 && (activeUser?.tipoEntidad === 'empresa' ? "Cobertura Comercial" : "Años de Experiencia")}
                {onboardingStep === 3 && "Presentación Profesional"}
              </Text>

              {/* Progress Stepper Bar */}
              <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${onboardingStep * 33.3}%`,
                    backgroundColor: activeUser?.tipoEntidad === 'empresa' ? '#6366f1' : '#FFB400'
                  }}
                />
              </View>

              {errorOnboarding ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning-outline" size={16} color="#e53935" />
                  <Text style={styles.errorText}>{errorOnboarding}</Text>
                </View>
              ) : null}

              {/* Paso 1: Categorías */}
              {onboardingStep === 1 && (
                <View>
                  <Text style={[styles.modalMessage, { marginBottom: 16 }]}>
                    {activeUser?.tipoEntidad === 'empresa'
                      ? 'Selecciona qué categorías de insumos o servicios ofrece tu empresa para los clientes corporativos.'
                      : 'Elige las categorías de servicios técnicos residenciales en las que te especializas.'}
                  </Text>
                  <Text style={styles.fieldLabel}>Categorías disponibles:</Text>
                  <View style={styles.chipsContainer}>
                    {(activeUser?.tipoEntidad === 'empresa' ? businessCategories : professionalTrades).map((serv) => {
                      const selected = serviciosSeleccionados.includes(serv.id);
                      return (
                        <TouchableOpacity
                          key={serv.id}
                          style={[
                            styles.chip,
                            selected && {
                              backgroundColor: activeUser?.tipoEntidad === 'empresa' ? '#6366f1' : '#FFB400',
                              borderColor: activeUser?.tipoEntidad === 'empresa' ? '#6366f1' : '#FFB400',
                            }
                          ]}
                          onPress={() => toggleServicio(serv.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.chipText,
                            selected && {
                              color: activeUser?.tipoEntidad === 'empresa' ? '#fff' : '#2F2F2F',
                              fontWeight: 'bold',
                            }
                          ]}>
                            {serv.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Paso 2: Experiencia / Cobertura */}
              {onboardingStep === 2 && (
                <View>
                  <Text style={[styles.modalMessage, { marginBottom: 16 }]}>
                    {activeUser?.tipoEntidad === 'empresa'
                      ? 'Define el alcance geográfico de los envíos o servicios comerciales de tu empresa.'
                      : 'Indica cuántos años de experiencia tienes prestando estos servicios.'}
                  </Text>

                  {activeUser?.tipoEntidad === 'empresa' ? (
                    <>
                      <Text style={styles.fieldLabel}>Cobertura geográfica:</Text>
                      <View style={styles.segmentContainer}>
                        {['Local', 'Nacional'].map((cob) => {
                          const selected = cobertura === cob;
                          return (
                            <TouchableOpacity
                              key={cob}
                              style={[
                                styles.segmentBtn,
                                selected && { backgroundColor: '#6366f1', borderColor: '#6366f1' }
                              ]}
                              onPress={() => setCobertura(cob)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.segmentText, selected && { color: '#fff', fontWeight: 'bold' }]}>
                                {cob}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>Años de trayectoria:</Text>
                      <View style={styles.segmentContainer}>
                        {['Menos de 1 año', '1 a 3 años', 'Más de 3 años'].map((exp) => {
                          const selected = experiencia === exp;
                          return (
                            <TouchableOpacity
                              key={exp}
                              style={[
                                styles.segmentBtn,
                                selected && { backgroundColor: '#FFB400', borderColor: '#FFB400' }
                              ]}
                              onPress={() => setExperiencia(exp)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.segmentText, selected && { color: '#2F2F2F', fontWeight: 'bold' }]}>
                                {exp}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Paso 3: Descripción */}
              {onboardingStep === 3 && (
                <View>
                  <Text style={[styles.modalMessage, { marginBottom: 16 }]}>
                    {activeUser?.tipoEntidad === 'empresa'
                      ? 'Escribe una breve presentación de tu negocio para que las empresas conozcan su trayectoria.'
                      : 'Describe brevemente tus principales habilidades. Esta información la verán los clientes.'}
                  </Text>

                  <Text style={styles.fieldLabel}>Presentación (mín. 10 caracteres):</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholder={activeUser?.tipoEntidad === 'empresa'
                      ? "Ej: Somos una distribuidora autorizada de papelería corporativa y material escolar a nivel nacional..."
                      : "Ej: Plomero matriculado con experiencia en detección de fugas de agua y gas..."}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* Acciones del Stepper */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 30, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }}>
                {onboardingStep > 1 ? (
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setOnboardingStep(prev => prev - 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Atrás</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowOnboarding(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                )}

                {onboardingStep < 3 ? (
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      {
                        backgroundColor: activeUser?.tipoEntidad === 'empresa' ? '#6366f1' : '#FFB400',
                      }
                    ]}
                    onPress={() => {
                      if (onboardingStep === 1 && serviciosSeleccionados.length === 0) {
                        setErrorOnboarding('Selecciona al menos una categoría.');
                        return;
                      }
                      setErrorOnboarding('');
                      setOnboardingStep(prev => prev + 1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalConfirmText,
                      {
                        color: activeUser?.tipoEntidad === 'empresa' ? '#fff' : '#2F2F2F',
                      }
                    ]}>
                      Siguiente
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      {
                        backgroundColor: activeUser?.tipoEntidad === 'empresa' ? '#6366f1' : '#FFB400',
                      }
                    ]}
                    onPress={() => { if (!savingProfessional && !savingBusinessProvider) void handleSaveOnboarding(); }}
                    disabled={savingProfessional || savingBusinessProvider}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalConfirmText,
                      {
                        color: activeUser?.tipoEntidad === 'empresa' ? '#fff' : '#2F2F2F',
                      }
                    ]}>
                      {savingProfessional || savingBusinessProvider ? "Guardando…" : "Guardar y Activar"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* MODAL KYC — Verificación de Identidad obligatoria antes de Onboarding de Proveedor */}
      <KYCVerifierModal
        visible={showKYCModal}
        userName={userName}
        onVerified={handleKYCVerified}
        onClose={() => setShowKYCModal(false)}
      />

      {/* MODAL DE PANEL DE ADMINISTRACIÓN DE REPORTES / BANEO */}
      <Modal visible={showAdminPanel} transparent animationType="slide" onRequestClose={() => setShowAdminPanel(false)}>
        <View style={styles.adminModalOverlay}>
          <View style={styles.adminModalContent}>
            <View style={styles.adminHeader}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.adminTitle}>Panel de Control: Denuncias</Text>
              <TouchableOpacity onPress={() => setShowAdminPanel(false)} style={{ marginLeft: 'auto', padding: 4 }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {loadingReports ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={{ marginTop: 12, color: '#64748b' }}>Cargando denuncias registradas...</Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                  Aquí puedes ver las quejas de los usuarios sobre los proveedores y tomar decisiones de suspender (banear) o perdonar la cuenta.
                </Text>

                {reportsList.length === 0 ? (
                  <View style={{ alignItems: 'center', marginVertical: 40, gap: 12 }}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: '600' }}>¡No hay denuncias pendientes!</Text>
                  </View>
                ) : (
                  reportsList.map((rep) => {
                    // Buscar si el proveedor reportado está actualmente baneado
                    const matchesUser = usuariosRegistrados.find(u => u.nombre.toLowerCase() === rep.reportadoNombre.toLowerCase());
                    const isCurrentlyBanned = matchesUser ? matchesUser.baneado === true : false;
                    const providerEmailOrPhone = matchesUser ? matchesUser.correoOTelefono : '';

                    return (
                      <View key={rep.id} style={styles.reportCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.reportedName}>Técnico: {rep.reportadoNombre}</Text>
                          <View style={[styles.statusBadge, isCurrentlyBanned ? styles.bannedBadge : styles.pendingBadge]}>
                            <Text style={isCurrentlyBanned ? styles.bannedBadgeText : styles.pendingBadgeText}>
                              {isCurrentlyBanned ? 'Suspendido' : 'Activo'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.reportCardRow}>
                          <Text style={{ fontWeight: '700' }}>Motivo:</Text> {rep.motivo}
                        </Text>
                        <Text style={styles.reportCardRow}>
                          <Text style={{ fontWeight: '700' }}>Detalles:</Text> {rep.descripcion}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          Reportado en: {new Date(rep.createdAt).toLocaleString()}
                        </Text>

                        {matchesUser ? (
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                            {isCurrentlyBanned ? (
                              <TouchableOpacity
                                style={[styles.adminActionBtn, { backgroundColor: '#10b981' }]}
                                onPress={async () => {
                                  const ok = await banearProveedor(providerEmailOrPhone, false);
                                  if (ok) {
                                    alert(`Se ha levantado la suspensión a ${rep.reportadoNombre}.`);
                                    cargarReportes();
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="checkmark-done" size={14} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Reactivar Cuenta</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={[styles.adminActionBtn, { backgroundColor: '#ef4444' }]}
                                onPress={async () => {
                                  const ok = await banearProveedor(providerEmailOrPhone, true);
                                  if (ok) {
                                    alert(`Se ha baneado y suspendido permanentemente la cuenta de ${rep.reportadoNombre}.`);
                                    cargarReportes();
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="ban" size={14} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Banear y Suspender</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#e53935', marginTop: 6, fontStyle: 'italic' }}>
                            * El proveedor no está registrado localmente en la sesión activa (semilla estática).
                          </Text>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#FFB400',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  b2bHeader: {
    backgroundColor: '#1e293b',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2F2F2F' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarBig: {
    width: 90,
    height: 90,
    backgroundColor: '#2F2F2F',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTextBig: { color: '#FFB400', fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '600', color: '#2F2F2F', marginBottom: 4 },
  veracity: { fontSize: 14, color: '#666' },

  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  statLabel: { fontSize: 12, color: '#888' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 10,
    paddingLeft: 4,
  },

  accountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accountText: { fontSize: 16, color: '#2F2F2F' },

  toggleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    justifyContent: 'space-between',
  },

  // Role Grid Styles
  rolesGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleOptionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  roleOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F2F2F',
    marginTop: 4,
  },
  roleOptionDesc: {
    fontSize: 9,
    color: '#888',
  },
  activeClientCard: {
    backgroundColor: '#FFB400',
    borderColor: '#FFB400',
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  activeProviderCard: {
    backgroundColor: '#2F2F2F',
    borderColor: '#2F2F2F',
    shadowColor: '#2F2F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  activeBusinessCard: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginBottom: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipText: {
    fontSize: 12,
    color: '#4a5568',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  segmentText: {
    fontSize: 12,
    color: '#4a5568',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as any,
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
  // Admin Panel Styles
  adminModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  adminModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    height: '75%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    padding: 18,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  reportCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 8,
  },
  reportedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  reportCardRow: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#ecfdf5',
  },
  pendingBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  bannedBadge: {
    backgroundColor: '#fef2f2',
  },
  bannedBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});

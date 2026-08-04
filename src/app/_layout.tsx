import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated'; // Para una animación fluida de desvanecimiento
import { UserProvider, useUser } from '../context/user-context';
import LoginScreen from '../components/login-screen';
import RatingOverlayModal from '../components/rating-overlay-modal';
import NotificationBanner from '../components/notification-banner';
import LocationChangeModal from '../components/location-change-modal';
import OnboardingModal from '../components/onboarding-modal';
import PlanUpsellModal from '../components/plan-upsell-modal';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width > 768;

  if (isLargeScreen) {
    const userContext = useUser();
    const esEmpresa = userContext?.activeUser?.tipoEntidad === 'empresa';
    const colorMarca = esEmpresa ? '#818cf8' : '#FFB400';
    
    return (
      <View style={styles.webRoot}>
        {/* Glowing blurred backgrounds */}
        <View style={styles.glowOrange} />
        <View style={styles.glowIndigo} />

        <View style={styles.webContainer}>
          {/* Columna Izquierda: Branding e Información */}
          <View style={styles.webHeroColumn}>
            <Image
              source={require('../../assets/icon.png')}
              style={[styles.webLogo, { borderColor: colorMarca }]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Text style={styles.webTitle}>Todo Ya</Text>
              <View style={styles.webBetaBadge}>
                <Text style={styles.webBetaBadgeText}>BETA</Text>
              </View>
            </View>
            <Text style={styles.webSlogan}>Servicios locales en minutos</Text>
            
            <View style={styles.webFeatureList}>
              <View style={styles.webFeatureItem}>
                <Ionicons name="flash-outline" size={20} color="#FFB400" />
                <Text style={styles.webFeatureText}>Conexión ultra rápida con proveedores en un radio de 5 km.</Text>
              </View>
              <View style={styles.webFeatureItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#818cf8" />
                <Text style={styles.webFeatureText}>Verificación de identidad (KYC obligatoria) para tu seguridad.</Text>
              </View>
              <View style={styles.webFeatureItem}>
                <Ionicons name="location-outline" size={20} color="#FFB400" />
                <Text style={styles.webFeatureText}>Detección en tiempo real de cambios de ciudad vía GPS nativo.</Text>
              </View>
              <View style={styles.webFeatureItem}>
                <Ionicons name="sync-outline" size={20} color="#818cf8" />
                <Text style={styles.webFeatureText}>Sincronización robusta con base de datos Neon DB (PostgreSQL).</Text>
              </View>
            </View>

            <Text style={styles.webFooter}>Todo Ya (BETA)  2026 · Experiencia Web Optimizada</Text>
          </View>

          {/* Columna Derecha: El Emulador / Teléfono Mockup */}
          <View style={styles.phoneMockupFrame}>
            <View style={styles.phoneCameraNotch} />
            <View style={styles.phoneScreenContent}>
              {children}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Componente NavigationLayout:
 * Controla la barra de pestañas (bottom navigation) y aplica restricciones de acceso (Auth Guard).
 */
function NavigationLayout() {
  const { userRole, isAuthenticated, orders, rateOrder, isSwitchingRole, activeUser, notification, clearNotification, isDbOnline, isSyncing, triggerSync, activeToast, dismissToast, simulationState, simulationStep, nextSimulationStep, stopSimulation } = useUser();
  const isClient = userRole === 'client';
  const isBusiness = userRole === 'business';
  const isConsumer = isClient || isBusiness;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Registrar token de notificación push si el usuario está autenticado y es nativo
  useEffect(() => {
    if (isAuthenticated && activeUser && Platform.OS !== 'web') {
      (async () => {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
          }
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          });
          const pushToken = tokenData.data;
          console.log('[Push] Token obtenido:', pushToken);

          // Actualizar en el servidor (Neon y localStorage)
          await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              correoOTelefono: activeUser.correoOTelefono,
              pushToken: pushToken
            })
          });
        } catch (e) {
          console.warn('[Push] Error al configurar notificaciones push:', e);
        }
      })();
    }
  }, [isAuthenticated, activeUser]);

  // CORRECCIÓN: Unificamos el color y fondo de la barra de pestañas de acuerdo al tipo de entidad del usuario activo.
  // Si el usuario es de tipo 'empresa' (como Corporación Alfa S.A. o Imprenta Beta), se le asignan los tonos B2B (índigo/slate oscuro)
  // de forma consistente tanto en el rol de comprador (business) como en el de vendedor (provider).
  const esEmpresa = activeUser?.tipoEntidad === 'empresa';
  const colorActivo = esEmpresa ? '#818cf8' : '#FFB400';
  const colorInactivo = esEmpresa ? '#94a3b8' : '#888';
  const fondoTabBar = esEmpresa ? '#1e293b' : (isClient ? '#fff' : '#2F2F2F');
  const colorBordeTabBar = esEmpresa ? '#0f172a' : (isClient ? '#eee' : '#1F1F1F');

  // [AUTH GUARD]: Si el usuario no ha iniciado sesión, se bloquea la navegación de pestañas
  // y se despliega la pantalla de Login a pantalla completa.
  if (!isAuthenticated) {
    return (
      <ResponsiveWrapper>
        <LoginScreen />
      </ResponsiveWrapper>
    );
  }

  const unratedOrder = isConsumer
    ? orders.find(o => o.estado === 'Completado' && !o.calificado)
    : undefined;

  return (
    <ResponsiveWrapper>
      <View style={{ flex: 1 }}>

      {/*  Badge de estado: Offline / Sincronizando */}
      {(!isDbOnline || isSyncing) && (
        <View style={[styles.statusBadge, isSyncing ? styles.badgeSyncing : styles.badgeOffline]}>
          {isSyncing 
            ? <ActivityIndicator size={10} color="#fff" style={{ marginRight: 5 }} />
            : <Ionicons name="cloud-offline-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
          }
          <Text style={styles.statusBadgeText}>
            {isSyncing ? 'Sincronizando...' : 'Modo offline — Datos locales'}
          </Text>
        </View>
      )}

      <Tabs
      screenOptions={{
        // Color activo de los iconos y texto adaptado dinámicamente
        tabBarActiveTintColor: colorActivo,
        // Color inactivo
        tabBarInactiveTintColor: colorInactivo,
        // Estilo dinámico de la barra de pestañas según el rol y tipo de entidad
        tabBarStyle: { 
          backgroundColor: fondoTabBar,
          borderTopWidth: 1,
          borderTopColor: colorBordeTabBar,
          height: 60,
        },
        headerShown: false, // Ocultar el encabezado nativo por defecto
      }}
    >
      {/* 
        PANTALLAS DEL CLIENTE / EMPRESA:
        Usamos `href: isConsumer ? undefined : null` para ocultar o mostrar dinámicamente
        las pestañas en la barra inferior según el rol del usuario actual.
      */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Inicio', 
          href: isConsumer ? undefined : null, // Muestra pestaña de inicio si es Cliente o Empresa
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="solicitar" 
        options={{ 
          title: 'Solicitar', 
          href: isConsumer ? undefined : null, // Muestra pestaña de solicitar si es Cliente o Empresa
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="pedidos" 
        options={{ 
          title: 'Pedidos', 
          href: isConsumer ? undefined : null, // Muestra pestaña de pedidos si es Cliente o Empresa
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          href: isConsumer ? undefined : null, // Muestra pestaña de perfil si es Cliente o Empresa
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> 
        }} 
      />

      {/* 
        PANTALLAS DEL PROVEEDOR:
        Se visualizan si el rol es 'provider'.
      */}
      <Tabs.Screen 
        name="leads" 
        options={{ 
          title: 'Leads', 
          href: userRole === 'provider' ? undefined : null, // Muestra pestaña si es Proveedor
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="stats" 
        options={{ 
          title: 'Estadísticas', 
          href: userRole === 'provider' ? undefined : null, // Muestra pestaña si es Proveedor
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="trabajos" 
        options={{ 
          title: 'Trabajos', 
          href: userRole === 'provider' ? undefined : null, // Muestra pestaña si es Proveedor
          tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="pperfil" 
        options={{ 
          title: 'Mi Perfil', 
          href: userRole === 'provider' ? undefined : null, // Muestra pestaña si es Proveedor
          tabBarIcon: ({ color }) => <Ionicons name="construct" size={24} color={color} /> 
        }} 
      />

      {/* Pantalla Explore (Desactivada y oculta para todos los usuarios) */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      {/* Pantalla de Chat en Tiempo Real (accesible via router.push, oculta del tab bar) */}
      <Tabs.Screen name="chat-room" options={{ href: null }} />
      </Tabs>
      {unratedOrder && (
        <RatingOverlayModal 
          order={unratedOrder}
          onRate={(estrellas, etiquetas) => rateOrder(unratedOrder.id, estrellas, etiquetas)}
        />
      )}

      {/* Banner de Notificación In-App Global */}
      <NotificationBanner toast={activeToast} onDismiss={dismissToast} />

      {/* Modal flotante global de cambio de ubicación por GPS */}
      <LocationChangeModal />

      {/* Modal de Tutorial de Bienvenida (Onboarding Carousel de 5 pasos) */}
      <OnboardingModal />

      {/* Modal no invasivo de Recomendación de Mejora de Plan (Estilo Uber One) */}
      <PlanUpsellModal />

      {/* Panel Controlador de la Simulación Guiada */}
      {simulationState && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut} 
          style={[
            styles.simulationFloater, 
            simulationState === 'client' ? styles.simFloaterClient : styles.simFloaterProvider
          ]}
        >
          <View style={styles.simFloaterHeader}>
            <Ionicons 
              name="cog-outline" 
              size={18} 
              color={simulationState === 'client' ? '#d97706' : '#818cf8'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.simFloaterHeaderText, { color: simulationState === 'client' ? '#d97706' : '#818cf8' }]}>
              {simulationState === 'client' 
                ? `🤖 Simulación Cliente (Paso ${simulationStep}/5)` 
                : `🤖 Simulación Proveedor (Paso ${simulationStep}/5)`}
            </Text>
            <TouchableOpacity onPress={stopSimulation} activeOpacity={0.7} style={styles.simFloaterClose}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.simFloaterBody}>
            {getSimulationText(simulationState, simulationStep)}
          </Text>
          <View style={styles.simFloaterActions}>
            <TouchableOpacity 
              style={[styles.simFloaterBtn, { backgroundColor: '#ef4444' }]} 
              onPress={stopSimulation}
            >
              <Text style={[styles.simFloaterBtnText, { color: '#fff' }]}>Salir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.simFloaterBtn, 
                { backgroundColor: simulationState === 'client' ? '#FFB400' : '#6366f1' }
              ]} 
              onPress={nextSimulationStep}
            >
              <Text style={[styles.simFloaterBtnText, { color: simulationState === 'client' ? '#2F2F2F' : '#fff', fontWeight: 'bold' }]}>
                {simulationStep === 5 ? 'Finalizar' : 'Siguiente Paso →'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Pantalla flotante de transición de rol con micro-animación de desvanecimiento */}
      {isSwitchingRole && (
        <Animated.View 
          entering={FadeIn.duration(220)} 
          exiting={FadeOut.duration(200)} 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: userRole === 'business' || userRole === 'provider' ? '#1e293b' : '#ffffff', 
              justifyContent: 'center', 
              alignItems: 'center', 
              zIndex: 99999 
            }
          ]}
        >
          <ActivityIndicator 
            size="large" 
            color={userRole === 'business' || userRole === 'provider' ? '#818cf8' : '#FFB400'} 
          />
          <Text style={{ 
            marginTop: 18, 
            color: userRole === 'business' || userRole === 'provider' ? '#ffffff' : '#2F2F2F', 
            fontSize: 15, 
            fontWeight: '600',
            letterSpacing: 0.5
          }}>
            {userRole === 'provider' 
              ? 'Activando perfil profesional...' 
              : (userRole === 'business' ? 'Ingresando a cuenta corporativa...' : 'Ingresando a cuenta residencial...')}
          </Text>
        </Animated.View>
      )}
    </View>
    </ResponsiveWrapper>
  );
}

import '../i18n'; // Inicializar i18n
import { loadSavedLanguage } from '../i18n';

/**
 * Componente Raíz de Entrada (RootLayout):
 * Envuelve el árbol con `UserProvider` para disponibilizar el estado de sesión y datos.
 * Inicializa la carga del idioma guardado del usuario antes de renderizar la aplicación.
 */
export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadSavedLanguage().finally(() => {
      setIsI18nReady(true);
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!isI18nReady || showSplash) {
    return <CustomSplashScreen />;
  }

  return (
    <UserProvider>
      <NavigationLayout />
    </UserProvider>
  );
}

/**
 * CustomSplashScreen:
 * Pantalla de carga sofisticada y fluida con el logotipo brillante de Todo Ya.
 */
function CustomSplashScreen() {
  return (
    <Animated.View 
      exiting={FadeOut.duration(400)}
      style={{
        flex: 1,
        backgroundColor: '#FFB400', // Fondo amarillo oro de la marca
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      {/* Tarjeta Flotante Elevada del Logotipo */}
      <Animated.View
        entering={ZoomIn.duration(700).delay(100)}
        style={{
          width: 120,
          height: 120,
          borderRadius: 30,
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 10,
          marginBottom: 24,
        }}
      >
        <Image 
          source={require('../../assets/icon.png')}
          style={{
            width: 100,
            height: 100,
            borderRadius: 22,
            resizeMode: 'contain',
          }}
        />
      </Animated.View>
      
      {/* Título de Marca e Insignia BETA */}
      <Animated.View
        entering={FadeIn.duration(700).delay(400)}
        style={{ alignItems: 'center' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Text style={{
            color: '#2F2F2F',
            fontSize: 34,
            fontWeight: '900',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}>
            Todo Ya
          </Text>
          <View style={{
            backgroundColor: '#e11d48', // Carmesí para máximo contraste
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 }}>
              BETA
            </Text>
          </View>
        </View>

        <Text style={{
          color: '#473a00',
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.5,
          textAlign: 'center',
          marginTop: 4,
        }}>
          Y si pudieras resolverlo todo... YA?
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40 }}>
          <ActivityIndicator size="small" color="#2F2F2F" />
          <Text style={{ color: '#594900', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
            Cargando experiencia...
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notificationToast: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#2F2F2F',
    borderRadius: 20,
    padding: 16,
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastSuccess: {
    backgroundColor: '#10b981',
  },
  toastWarning: {
    backgroundColor: '#f59e0b',
  },
  toastBusiness: {
    backgroundColor: '#6366f1',
  },
  toastIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  toastMessage: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  toastClose: {
    padding: 4,
  },
  //  Badge de estado de conexión
  statusBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99998,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeOffline: {
    backgroundColor: '#ef4444', // rojo
  },
  badgeSyncing: {
    backgroundColor: '#3b82f6', // azul
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Estilos responsivos de Web para Laptop y Tablets
  webRoot: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate 900
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  glowOrange: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(255, 180, 0, 0.05)',
    top: -100,
    left: -100,
    filter: 'blur(100px)',
  } as any,
  glowIndigo: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    bottom: -150,
    right: -150,
    filter: 'blur(120px)',
  } as any,
  webContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    maxWidth: 1200,
    paddingHorizontal: 40,
    gap: 80,
  },
  webHeroColumn: {
    flex: 1,
    maxWidth: 500,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingRight: 20,
  },
  webLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  webTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    marginBottom: 8,
  },
  webBetaBadge: {
    backgroundColor: '#FFB400',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  webBetaBadgeText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  webSlogan: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 40,
    fontWeight: '500',
  },
  webFeatureList: {
    gap: 20,
    marginBottom: 50,
    width: '100%',
  },
  webFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webFeatureText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    flex: 1,
  },
  webFooter: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 20,
  },
  phoneMockupFrame: {
    width: 390,
    height: '90%',
    maxHeight: 800,
    backgroundColor: '#000',
    borderRadius: 40,
    padding: 10,
    borderWidth: 8,
    borderColor: '#334155', // Slate 700 para emular el bisel del celular
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  phoneCameraNotch: {
    position: 'absolute',
    top: 15,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 20,
    backgroundColor: '#000',
    borderRadius: 10,
    zIndex: 999999,
  },
  phoneScreenContent: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  simulationFloater: {
    position: 'absolute',
    bottom: 75,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 20,
    padding: 16,
    zIndex: 999999,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  simFloaterClient: {
    borderColor: '#FFB400',
  },
  simFloaterProvider: {
    borderColor: '#6366f1',
  },
  simFloaterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  simFloaterHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  simFloaterClose: {
    padding: 2,
  },
  simFloaterBody: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  simFloaterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  simFloaterBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simFloaterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

function getSimulationText(state: 'client' | 'provider', step: number): string {
  if (state === 'client') {
    switch (step) {
      case 1:
        return "¡Bienvenido Carlos! Has accedido a la pantalla principal como Cliente. Presiona 'Siguiente' para dirigirte al formulario de solicitud de servicio.";
      case 2:
        return "Escribiremos automáticamente un requerimiento de cortocircuito. La IA corregirá el texto e identificará la categoría 'Electricidad' y la urgencia alta. Presiona 'Siguiente' para iniciar la búsqueda.";
      case 3:
        return "El radar de 90s se ha iniciado buscando electricistas a la redonda. En segundos cargarán los técnicos disponibles en tiempo real. Presiona 'Siguiente' para verlos.";
      case 4:
        return "Hemos encontrado a Carlos Mamani y Fernando Ruiz. Haz clic en 'Aceptar Oferta' de Fernando o presiona 'Siguiente' para aceptarla automáticamente e ir al chat.";
      case 5:
        return "Estás en el chat coordinando con tu técnico. Presiona 'Finalizar' para simular que completó el trabajo, realizar el cobro del saldo y mostrar el sistema de calificación obligatoria.";
      default:
        return "";
    }
  } else {
    switch (step) {
      case 1:
        return "¡Bienvenido Pedro! Has iniciado sesión como Proveedor Premium (Plan 2) con un saldo de 24 monedas. Presiona 'Siguiente' para buscar leads de trabajo.";
      case 2:
        return "Visualizas una solicitud de Luis Alberto buscando plomero por S/.15. Presiona 'Siguiente' para simular tu postulación (gasto de 2 monedas) e ir al panel de trabajos.";
      case 3:
        return "¡El cliente aceptó tu postulación! El trabajo ahora está 'En progreso'. Presiona 'Siguiente' para abrir la sala de chat de negociación.";
      case 4:
        return "Estás en la sala de chat. Puedes coordinar detalles. Presiona 'Siguiente' para volver al panel de trabajos y proceder con la simulación del término de obra.";
      case 5:
        return "Presiona 'Finalizar' para simular la entrega del trabajo. Dado tu Plan 2, se debitará un 10% de comisión (2 monedas en vez de 4), dejando tu saldo en 22 monedas.";
      default:
        return "";
    }
  }
}

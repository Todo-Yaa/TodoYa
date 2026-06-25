import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated'; // Para una animación fluida de desvanecimiento
import { UserProvider, useUser } from '../context/user-context';
import LoginScreen from '../components/login-screen';
import RatingOverlayModal from '../components/rating-overlay-modal';

/**
 * Componente NavigationLayout:
 * Controla la barra de pestañas (bottom navigation) y aplica restricciones de acceso (Auth Guard).
 */
function NavigationLayout() {
  const { userRole, isAuthenticated, orders, rateOrder, isSwitchingRole, activeUser, notification, clearNotification } = useUser();
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
    return <LoginScreen />;
  }

  const unratedOrder = isConsumer
    ? orders.find(o => o.estado === 'Completado' && !o.calificado)
    : undefined;

  return (
    <View style={{ flex: 1 }}>
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
      {notification && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.notificationToast,
            notification.type === 'success' && styles.toastSuccess,
            notification.type === 'warning' && styles.toastWarning,
            isBusiness && styles.toastBusiness,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.toastIconBg}>
              <Ionicons
                name={
                  notification.type === 'success'
                    ? 'checkmark-circle'
                    : notification.type === 'warning'
                    ? 'warning'
                    : 'flash'
                }
                size={22}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle} numberOfLines={1}>{notification.title}</Text>
              <Text style={styles.toastMessage} numberOfLines={2}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={clearNotification} style={styles.toastClose}>
              <Ionicons name="close-circle" size={22} color="#fff" />
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
        backgroundColor: '#1E1E1E', // Fondo oscuro sofisticado
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Resplandor del logo de Todo Ya */}
      <Animated.Image 
        entering={ZoomIn.duration(800).delay(100)}
        source={require('../../assets/images/logo-glow.png')}
        style={{
          width: 250,
          height: 250,
          resizeMode: 'contain',
        }}
      />
      
      {/* Título de Marca */}
      <Animated.View
        entering={FadeIn.duration(800).delay(500)}
        style={{ alignItems: 'center', marginTop: -10 }}
      >
        <Text style={{
          color: '#FFB400',
          fontSize: 32,
          fontWeight: '900',
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadowColor: 'rgba(255, 180, 0, 0.4)',
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 15,
        }}>
          Todo Ya
        </Text>
        <Text style={{
          color: '#aaaaaa',
          fontSize: 12,
          fontWeight: '500',
          marginTop: 8,
          letterSpacing: 2,
        }}>
          SERVICIOS LOCALES EN MINUTOS
        </Text>
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
    backgroundColor: '#2F2F2F', // Default neutral dark charcoal
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
});

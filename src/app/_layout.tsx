import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'; // Para una animación fluida de desvanecimiento
import { UserProvider, useUser } from '../context/user-context';
import LoginScreen from '../components/login-screen';
import RatingOverlayModal from '../components/rating-overlay-modal';

/**
 * Componente NavigationLayout:
 * Controla la barra de pestañas (bottom navigation) y aplica restricciones de acceso (Auth Guard).
 */
function NavigationLayout() {
  const { userRole, isAuthenticated, orders, rateOrder, isSwitchingRole } = useUser();
  const isClient = userRole === 'client';
  const isBusiness = userRole === 'business';
  const isConsumer = isClient || isBusiness;

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
        // Color activo de los iconos y texto (Dorado premium para cliente/proveedor, azul corporativo para empresas)
        tabBarActiveTintColor: isBusiness ? '#818cf8' : '#FFB400',
        // Color inactivo
        tabBarInactiveTintColor: isBusiness ? '#94a3b8' : '#888',
        // Estilo dinámico de la barra de pestañas según el rol
        tabBarStyle: { 
          backgroundColor: isBusiness ? '#1e293b' : (isClient ? '#fff' : '#2F2F2F'), // Slate oscuro para Empresa, claro para Cliente, carbón oscuro para Proveedor
          borderTopWidth: 1,
          borderTopColor: isBusiness ? '#0f172a' : (isClient ? '#eee' : '#1F1F1F'),
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
      </Tabs>
      {unratedOrder && (
        <RatingOverlayModal 
          order={unratedOrder}
          onRate={(estrellas, etiquetas) => rateOrder(unratedOrder.id, estrellas, etiquetas)}
        />
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

/**
 * Componente Raíz de Entrada (RootLayout):
 * Envuelve el árbol con `UserProvider` para disponibilizar el estado de sesión y datos.
 */
export default function RootLayout() {
  return (
    <UserProvider>
      <NavigationLayout />
    </UserProvider>
  );
}

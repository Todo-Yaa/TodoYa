import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { 
          backgroundColor: '#fff', 
          borderTopWidth: 1,
          height: 60,
        },
        headerShown: false,
      }}
    >
      {/* Pantallas Cliente */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Inicio', 
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="solicitar" 
        options={{ 
          title: 'Solicitar', 
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="pedidos" 
        options={{ 
          title: 'Pedidos', 
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> 
        }} 
      />

      {/* Pantallas Proveedor (ocultas por ahora) */}
      <Tabs.Screen name="leads" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="trabajos" options={{ href: null }} />
      <Tabs.Screen name="pperfil" options={{ href: null }} />
    </Tabs>
  );
}
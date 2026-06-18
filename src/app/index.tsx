import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import MapView from '../components/map-view';
import { useUser } from '../context/user-context';

export default function HomeScreen() {
  const { userRole, userName, orders } = useUser();
  const [showModal, setShowModal] = useState(false);

  // Filtramos pedidos de esta empresa
  const businessOrders = orders.filter(o => 
    o.servicio === 'Decoración & Eventos' || 
    o.servicio === 'Branding & Lettering' || 
    o.servicio === 'Papelería & Oficina'
  );
  
  const pendingOrdersCount = businessOrders.filter(o => o.estado === 'Buscando proveedor').length;
  const inProgressOrdersCount = businessOrders.filter(o => o.estado === 'En progreso').length;
  const completedOrdersCount = businessOrders.filter(o => o.estado === 'Completado').length;

  const getInitials = (name: string) => {
    if (!name) return 'CO';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  if (userRole === 'business') {
    return (
      <View style={styles.container}>
        {/* Header B2B Corporativo */}
        <View style={styles.b2bHeader}>
          <View style={styles.headerContent}>
            <View style={styles.b2bAvatar}>
              <Text style={styles.b2bAvatarText}>{getInitials(userName)}</Text>
            </View>
            <View>
              <Text style={styles.b2bGreeting}>{userName} 🏢</Text>
              <Text style={styles.b2bLocation}>Cuenta Empresa · Santa Cruz</Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={28} color="#818cf8" />
        </View>

        <ScrollView style={styles.body}>
          {/* Tarjeta de Resumen Estadístico */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Resumen de Solicitudes B2B</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#6366f1' }]}>{pendingOrdersCount}</Text>
                <Text style={styles.statLabel}>Buscando</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#fbbf24' }]}>{inProgressOrdersCount}</Text>
                <Text style={styles.statLabel}>En Curso</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#10b981' }]}>{completedOrdersCount}</Text>
                <Text style={styles.statLabel}>Completadas</Text>
              </View>
            </View>
          </View>

          {/* Categorías B2B */}
          <Text style={styles.b2bSectionTitle}>¿Qué necesita adquirir hoy?</Text>
          <View style={styles.b2bServicesGrid}>
            {[
              { id: 'deco', icon: "gift-outline", label: "Decoración & Eventos", desc: "Aniversarios y espacios", color: "#818cf8" },
              { id: 'litering', icon: "text-outline", label: "Branding & Lettering", desc: "Vitrina, letreros y gráfica", color: "#34d399" },
              { id: 'papeleria', icon: "document-text-outline", label: "Papelería & Oficina", desc: "Papelería e insumos", color: "#f43f5e" },
              { id: 'otros', icon: "cube-outline", label: "Servicios B2B", desc: "Proveedores corporativos", color: "#a78bfa" },
            ].map((service, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.b2bServiceCard}
                onPress={() => router.push('/solicitar')}
                activeOpacity={0.7}
              >
                <View style={[styles.b2bServiceIconBg, { backgroundColor: service.color + '15' }]}>
                  <Ionicons name={service.icon as any} size={32} color={service.color} />
                </View>
                <Text style={styles.b2bServiceLabel}>{service.label}</Text>
                <Text style={styles.b2bServiceDesc}>{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Proveedores B2B Cercanos */}
          <Text style={styles.b2bSectionTitle}>Socios B2B en tu Zona (Radio 10km)</Text>
          <View style={styles.mapPlaceholder}>
            <MapView />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Vista Residencial Estándar (Clientes)
  return (
    <View style={styles.container}>
      {/* Header Dorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>LM</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hola, Luis 👋</Text>
            <Text style={styles.location}>Santa Cruz de la Sierra</Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#2F2F2F" />
      </View>

      <ScrollView style={styles.body}>
        {/* Botón Pánico */}
        <TouchableOpacity 
          style={styles.panicButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={32} color="white" />
          <Text style={styles.panicText}>Servicio urgente — ¡ahora!</Text>
        </TouchableOpacity>

        {/* Buscador */}
        <TouchableOpacity style={styles.searchBox} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#aaa" />
          <Text style={styles.searchText}>Ej: "tengo una fuga en el lavabo..."</Text>
        </TouchableOpacity>

        {/* Servicios */}
        <Text style={styles.sectionTitle}>¿Qué necesitas?</Text>
        
        <View style={styles.servicesGrid}>
          {[
            { icon: "hammer-outline", label: "Plomería", price: "Desde Bs. 80" },
            { icon: "flash-outline", label: "Electricidad", price: "Desde Bs. 60" },
            { icon: "brush-outline", label: "Pintura", price: "Desde Bs. 120" },
            { icon: "snow-outline", label: "AC / Clima", price: "Desde Bs. 150" },
          ].map((service, i) => (
            <TouchableOpacity key={i} style={styles.serviceCard} onPress={() => router.push('/solicitar')} activeOpacity={0.7}>
              <Ionicons name={service.icon as any} size={48} color="#2F2F2F" />
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mapa */}
        <Text style={styles.sectionTitle}>Proveedores cercanos (Radio de 5 km)</Text>
        <View style={styles.mapPlaceholder}>
          <MapView />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#FFB400',
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
    backgroundColor: '#2F2F2F',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFB400', fontSize: 20, fontWeight: 'bold' },
  greeting: { fontSize: 18, fontWeight: '600', color: '#2F2F2F' },
  location: { fontSize: 13, color: '#5a4800' },

  body: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },

  panicButton: {
    backgroundColor: '#e53935',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  panicText: { color: 'white', fontSize: 17, fontWeight: '600' },

  searchBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchText: { color: '#999', fontSize: 15 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceLabel: { fontSize: 15, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  servicePrice: { fontSize: 12, color: '#666', marginTop: 4 },

  mapPlaceholder: {
    height: 300,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  b2bHeader: {
    backgroundColor: '#1e293b',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  b2bAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  b2bAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  b2bGreeting: { fontSize: 18, fontWeight: '700', color: '#fff' },
  b2bLocation: { fontSize: 13, color: '#94a3b8' },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  b2bSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  b2bServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  b2bServiceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  b2bServiceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  b2bServiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  b2bServiceDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
});

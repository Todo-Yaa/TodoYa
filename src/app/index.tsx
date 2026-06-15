import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [showModal, setShowModal] = useState(false);

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
        >
          <Ionicons name="flash" size={32} color="white" />
          <Text style={styles.panicText}>Servicio urgente — ¡ahora!</Text>
        </TouchableOpacity>

        {/* Buscador */}
        <TouchableOpacity style={styles.searchBox}>
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
            <TouchableOpacity key={i} style={styles.serviceCard}>
              <Ionicons name={service.icon as any} size={48} color="#2F2F2F" />
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mapa */}
        <Text style={styles.sectionTitle}>Proveedores cercanos</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={{ color: '#666' }}>🗺️ Mapa (próximamente)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#FFD700',
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
  avatarText: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
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
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceLabel: { fontSize: 15, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  servicePrice: { fontSize: 12, color: '#666', marginTop: 4 },

  mapPlaceholder: {
    height: 160,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
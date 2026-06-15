import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LeadsScreen() {
  const leads = [
    {
      id: 1,
      titulo: "Fuga en lavabo — URGENTE",
      precio: "Bs. 80–150",
      distancia: "1.2 km",
      tiempo: "Hace 2 min",
      urgente: true,
      monedas: 2
    },
    {
      id: 2,
      titulo: "Instalación de grifo",
      precio: "Bs. 60–100",
      distancia: "2.4 km",
      tiempo: "Hace 18 min",
      urgente: false,
      monedas: 1
    },
    {
      id: 3,
      titulo: "Remodelación baño completo",
      precio: "Bs. 800+",
      distancia: "3.1 km",
      tiempo: "Hace 47 min",
      urgente: false,
      monedas: 5,
      pro: true
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Proveedor */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JR</Text>
          </View>
          <View>
            <Text style={styles.name}>Juan Ríos <Text style={styles.proBadge}>PRO</Text></Text>
            <Text style={styles.status}>Plomero · <Text style={{ color: '#4caf50' }}>Disponible</Text></Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#FFD700" />
      </View>

      <ScrollView style={styles.body}>
        {/* Saldo de Monedas */}
        <View style={styles.monedasCard}>
          <View style={styles.monedasIcon}>
            <Ionicons name="coin" size={28} color="#2F2F2F" />
          </View>
          <View>
            <Text style={styles.monedasAmount}>24 <Text style={{ fontSize: 14, color: '#666' }}>monedas</Text></Text>
            <Text style={styles.monedasLabel}>Saldo disponible · Bs. 5 c/u</Text>
          </View>
          <TouchableOpacity style={styles.comprarBtn}>
            <Text style={styles.comprarText}>+ Comprar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Leads disponibles</Text>

        {leads.map((lead) => (
          <View key={lead.id} style={[styles.leadCard, lead.pro && styles.proCard]}>
            {lead.pro && (
              <View style={styles.proLabel}>
                <Text style={styles.proLabelText}>Membresía PRO exclusivo</Text>
              </View>
            )}

            <View style={styles.leadHeader}>
              <Text style={styles.leadTitle}>
                {lead.urgente && <Ionicons name="flash" size={18} color="#e53935" />} {lead.titulo}
              </Text>
              <Text style={styles.precio}>{lead.precio}</Text>
            </View>

            <Text style={styles.meta}>
              📍 {lead.distancia} · {lead.tiempo}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.postularBtn}>
                <Ionicons name="coin" size={16} color="#2F2F2F" />
                <Text style={styles.postularText}>Postular ({lead.monedas} monedas)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn}>
                <Text style={styles.skipText}>Omitir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2F2F2F',
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
    backgroundColor: '#FFD700',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#2F2F2F', fontSize: 20, fontWeight: 'bold' },
  name: { color: '#FFD700', fontSize: 17, fontWeight: '600' },
  proBadge: { backgroundColor: '#FFD700', color: '#2F2F2F', fontSize: 11, paddingHorizontal: 6, borderRadius: 4 },
  status: { color: '#aaa', fontSize: 13 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  monedasCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 24,
  },
  monedasIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFD700',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monedasAmount: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  monedasLabel: { fontSize: 13, color: '#666' },
  comprarBtn: {
    marginLeft: 'auto',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  comprarText: { color: '#2F2F2F', fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  leadCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  proCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  proLabel: {
    backgroundColor: '#FFF8DC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  proLabelText: { color: '#8a6d00', fontSize: 11, fontWeight: '600' },

  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  leadTitle: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  precio: { fontSize: 16, fontWeight: '700', color: '#e53935' },

  meta: { fontSize: 14, color: '#666', marginBottom: 16 },

  actions: { flexDirection: 'row', gap: 10 },
  postularBtn: {
    backgroundColor: '#FFD700',
    flex: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  postularText: { color: '#2F2F2F', fontWeight: '600', fontSize: 14 },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  skipText: { color: '#888' },
});
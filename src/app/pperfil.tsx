import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PperfilScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil profesional</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarTextBig}>JR</Text>
          </View>
          <Text style={styles.name}>Juan Ríos <Text style={styles.proBadge}>PRO</Text></Text>
          <Text style={styles.profession}>Plomero certificado · 5 años de experiencia</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Trabajos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9 ★</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Monedas</Text>
            </View>
          </View>
        </View>

        {/* Membresía PRO */}
        <Text style={styles.sectionTitle}>Membresía</Text>
        <View style={styles.proCard}>
          <View style={styles.proHeader}>
            <Ionicons name="crown" size={32} color="#FFD700" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.proTitle}>Plan PRO activo</Text>
              <Text style={styles.proSubtitle}>Acceso a leads exclusivos</Text>
            </View>
          </View>
          <Text style={styles.renovacion}>Renueva el 15 de Julio 2026</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFD700' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarBig: {
    width: 100,
    height: 100,
    backgroundColor: '#FFD700',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTextBig: { color: '#2F2F2F', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '600', color: '#2F2F2F' },
  proBadge: { backgroundColor: '#FFD700', color: '#2F2F2F', fontSize: 12, paddingHorizontal: 8, borderRadius: 6, marginLeft: 6 },
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
  },

  proCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  proHeader: { flexDirection: 'row', alignItems: 'center' },
  proTitle: { fontSize: 17, fontWeight: '600', color: '#2F2F2F' },
  proSubtitle: { fontSize: 13, color: '#666' },
  renovacion: { marginTop: 12, fontSize: 13, color: '#888', textAlign: 'center' },

  logoutBtn: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  logoutText: { color: '#e53935', fontSize: 16, fontWeight: '500' },
});
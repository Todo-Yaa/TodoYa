import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis estadísticas</Text>
        <Text style={styles.headerSubtitle}>Junio 2026</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Estadísticas principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Trabajos completados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Bs. 3,240</Text>
            <Text style={styles.statLabel}>Ingresos del mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>4.9 ★</Text>
            <Text style={styles.statLabel}>Calificación promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>Tasa de aceptación</Text>
          </View>
        </View>

        {/* Reputación */}
        <Text style={styles.sectionTitle}>Reputación</Text>
        <View style={styles.reputationCard}>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Puntualidad</Text>
            <Text style={styles.stars}>★★★★★</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Calidad del trabajo</Text>
            <Text style={styles.stars}>★★★★★</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Comunicación</Text>
            <Text style={styles.stars}>★★★★☆</Text>
          </View>
        </View>
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
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFD700' },
  headerSubtitle: { fontSize: 14, color: '#aaa', marginTop: 4 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#2F2F2F' },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  reputationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reputationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  repLabel: { fontSize: 15, color: '#555' },
  stars: { fontSize: 16, color: '#FFD700' },
})
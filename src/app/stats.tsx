import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/user-context';

export default function StatsScreen() {
  const { orders, activeUser } = useUser();
  const isB2BProvider = activeUser?.tipoEntidad === 'empresa';
  const providerName = activeUser?.nombre || 'Juan Ríos';

  // Filter completed jobs for the active provider dynamically
  const myCompletedJobs = orders.filter(o => o.proveedor === providerName && o.estado === 'Completado');

  // Calculate dynamic earnings from completed jobs
  const dynamicEarnings = myCompletedJobs.reduce((acc, job) => {
    const numbers = job.precio.match(/\d+/g);
    let priceVal = 80; // Default fallback
    if (numbers && numbers.length > 0) {
      priceVal = parseInt(numbers[0]);
    }
    return acc + priceVal;
  }, 0);

  // Baseline completed jobs + new completed ones
  const totalCompletedCount = 15 + myCompletedJobs.length;
  const totalEarnings = 2800 + dynamicEarnings;

  return (
    <View style={styles.container}>
      {/* CORRECCIÓN: Header adaptativo. Si es empresa proveedora (B2B), se colorea con Slate oscuro (#1e293b) e Índigo (#818cf8). */}
      <View style={[styles.header, isB2BProvider && { backgroundColor: '#1e293b' }]}>
        <Text style={[styles.headerTitle, isB2BProvider && { color: '#818cf8' }]}>Mis estadísticas</Text>
        <Text style={styles.headerSubtitle}>Junio 2026</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Estadísticas principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompletedCount}</Text>
            <Text style={styles.statLabel}>Trabajos completados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Bs. {totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ingresos del mes</Text>
          </View>
          <View style={styles.statCard}>
            {/* Calificación promedio adaptada cromáticamente */}
            <Text style={[styles.statValue, { color: isB2BProvider ? '#818cf8' : '#FFB400' }]}>4.9 ★</Text>
            <Text style={styles.statLabel}>Calificación promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Tasa de aceptación</Text>
          </View>
        </View>

        {/* Reputación */}
        <Text style={styles.sectionTitle}>Reputación</Text>
        <View style={styles.reputationCard}>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Puntualidad</Text>
            {/* Estrellas adaptadas cromáticamente al modo empresa */}
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>★★★★★</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Calidad del trabajo</Text>
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>★★★★★</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Comunicación</Text>
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>★★★★☆</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFB400' },
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
  stars: { fontSize: 16, color: '#FFB400' },
});

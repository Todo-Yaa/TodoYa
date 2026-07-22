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
    const numbers = job.precio?.match(/\d+/g);
    let priceVal = 80; // Default fallback
    if (numbers && numbers.length > 0) {
      priceVal = parseInt(numbers[0]);
    }
    return acc + priceVal;
  }, 0);

  // Baseline completed jobs + new completed ones
  const totalCompletedCount = 15 + myCompletedJobs.length;
  const totalEarnings = 2800 + dynamicEarnings;

  // Calificación promedio dinámica y estrellas
  const ratedJobs = myCompletedJobs.filter(o => o.calificado);
  let averageRating = 4.9;
  let punctualStars = '★★★★★';
  let qualityStars = '★★★★★';
  let communicationStars = '★★★★☆';
  
  if (ratedJobs.length > 0) {
    const sum = ratedJobs.reduce((acc, o) => acc + (o.calificacionEstrellas || 5), 0);
    averageRating = parseFloat((sum / ratedJobs.length).toFixed(1));
    
    const fullStars = Math.round(averageRating);
    punctualStars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    qualityStars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    communicationStars = '★'.repeat(Math.max(1, fullStars - 1)) + '☆'.repeat(5 - Math.max(1, fullStars - 1));
  }

  // Distribución de servicios completados
  const serviceDistribution: Record<string, number> = {
    'Plomería': 8,
    'Electricidad': 4,
    'Climatización': 3,
  };

  myCompletedJobs.forEach(job => {
    const srv = job.servicio || 'Otros';
    serviceDistribution[srv] = (serviceDistribution[srv] || 0) + 1;
  });

  const totalServices = Object.values(serviceDistribution).reduce((a, b) => a + b, 0);

  // Ingresos semanales (semanas 1 a 4)
  const baseWeekly = [600, 800, 700, 700];
  // Añadir ingresos dinámicos a la última semana
  baseWeekly[3] += dynamicEarnings;

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
            <Text style={styles.statValue}>S/. {totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ingresos del mes</Text>
          </View>
          <View style={styles.statCard}>
            {/* Calificación promedio adaptada cromáticamente */}
            <Text style={[styles.statValue, { color: isB2BProvider ? '#818cf8' : '#FFB400' }]}>{averageRating} ★</Text>
            <Text style={styles.statLabel}>Calificación promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Tasa de aceptación</Text>
          </View>
        </View>

        {/* Gráfico de Ingresos Semanales */}
        <Text style={styles.sectionTitle}>Ingresos Semanales (S/.)</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBarsContainer}>
            {baseWeekly.map((val, idx) => {
              const maxVal = Math.max(...baseWeekly, 1000);
              const barHeight = Math.max(10, Math.round((val / maxVal) * 120));
              return (
                <View key={idx} style={styles.chartCol}>
                  <Text style={styles.chartBarValue}>{val}</Text>
                  <View style={[styles.chartBar, { height: barHeight }]} />
                  <Text style={styles.chartBarLabel}>Sem {idx + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Distribución de Servicios */}
        <Text style={styles.sectionTitle}>Distribución de Servicios</Text>
        <View style={styles.distributionCard}>
          {Object.entries(serviceDistribution).map(([name, count]) => {
            const percentage = totalServices > 0 ? Math.round((count / totalServices) * 100) : 0;
            return (
              <View key={name} style={styles.distRow}>
                <View style={styles.distInfo}>
                  <Text style={styles.distName}>{name}</Text>
                  <Text style={styles.distCount}>{count} trab. ({percentage}%)</Text>
                </View>
                <View style={styles.distProgressBarBg}>
                  <View style={[styles.distProgressBarFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Reputación */}
        <Text style={styles.sectionTitle}>Métricas de Calidad</Text>
        <View style={styles.reputationCard}>
          <View style={styles.reputationRow}>
            {/* Estrellas adaptadas cromáticamente al modo empresa */}
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>{punctualStars}</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Calidad del trabajo</Text>
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>{qualityStars}</Text>
          </View>
          <View style={styles.reputationRow}>
            <Text style={styles.repLabel}>Comunicación</Text>
            <Text style={[styles.stars, isB2BProvider && { color: '#818cf8' }]}>{communicationStars}</Text>
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

  // Chart and Distribution styles
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 15,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#FFB400',
    borderRadius: 6,
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
  distributionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee',
  },
  distRow: {
    marginBottom: 14,
  },
  distInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2F2F',
  },
  distCount: {
    fontSize: 12,
    color: '#888',
  },
  distProgressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFB400',
    borderRadius: 3,
  },
});

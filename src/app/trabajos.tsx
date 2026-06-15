import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TrabajosScreen() {
  const trabajos = [
    {
      titulo: "Fuga lavabo — Luis M.",
      estado: "Activo",
      detalle: "Hoy 10:30 · Bs. 120 acordados",
      progreso: 65,
      color: "#FFD700"
    },
    {
      titulo: "Grifo cocina — Ana P.",
      estado: "Completado",
      detalle: "Bs. 80 · 8 Jun 2026",
      progreso: 100,
      color: "#4caf50"
    },
    {
      titulo: "Instalación enchufe sala",
      estado: "En progreso",
      detalle: "Ayer · Bs. 90",
      progreso: 40,
      color: "#FFD700"
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis trabajos</Text>
      </View>

      <ScrollView style={styles.body}>
        {trabajos.map((trabajo, index) => (
          <View key={index} style={styles.trabajoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.titulo}>{trabajo.titulo}</Text>
              <View style={[
                styles.estadoBadge, 
                { backgroundColor: trabajo.estado === 'Completado' ? '#e8f5e9' : '#FFF8DC' }
              ]}>
                <Text style={{ 
                  color: trabajo.estado === 'Completado' ? '#1b5e20' : '#8a6d00',
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  {trabajo.estado}
                </Text>
              </View>
            </View>

            <Text style={styles.detalle}>{trabajo.detalle}</Text>

            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { width: `${trabajo.progreso}%`, backgroundColor: trabajo.color }
              ]} />
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
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFD700' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  trabajoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titulo: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detalle: { fontSize: 14, color: '#555', marginBottom: 14 },

  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
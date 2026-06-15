import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PedidosScreen() {
  const pedidos = [
    {
      id: 1,
      titulo: "Fuga en lavabo",
      proveedor: "Juan Ríos",
      servicio: "Plomería",
      estado: "En progreso",
      progreso: 65,
      hora: "Hoy 10:30",
      color: "#FFD700"
    },
    {
      id: 2,
      titulo: "Instalación de AC",
      proveedor: "Carlos Mamani",
      servicio: "Climatización",
      estado: "Buscando proveedor",
      progreso: 25,
      hora: "Hace 45 min",
      color: "#FFD700"
    },
    {
      id: 3,
      titulo: "Pintura sala",
      proveedor: "María López",
      servicio: "Pintura",
      estado: "Completado",
      progreso: 100,
      hora: "12 Jun 2026",
      color: "#4caf50"
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis pedidos</Text>
        <Text style={styles.headerSubtitle}>Historial de solicitudes</Text>
      </View>

      <ScrollView style={styles.body}>
        {pedidos.map((pedido) => (
          <View key={pedido.id} style={styles.pedidoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.titulo}>{pedido.titulo}</Text>
              <View style={[styles.estadoBadge, { backgroundColor: pedido.estado === 'Completado' ? '#e8f5e9' : '#FFF8DC' }]}>
                <Text style={{ color: pedido.estado === 'Completado' ? '#1b5e20' : '#8a6d00', fontSize: 12, fontWeight: '500' }}>
                  {pedido.estado}
                </Text>
              </View>
            </View>

            <Text style={styles.detalle}>
              {pedido.proveedor} · {pedido.servicio}
            </Text>
            <Text style={styles.hora}>{pedido.hora}</Text>

            {/* Barra de progreso */}
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${pedido.progreso}%`, backgroundColor: pedido.color }
                ]} 
              />
            </View>
          </View>
        ))}

        {pedidos.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="document-outline" size={60} color="#ccc" />
            <Text style={{ color: '#888', marginTop: 16 }}>Aún no tienes pedidos</Text>
          </View>
        )}
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
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2F2F2F' },
  headerSubtitle: { fontSize: 14, color: '#5a4800', marginTop: 4 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  pedidoCard: {
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
    marginBottom: 8,
  },
  titulo: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detalle: { fontSize: 14, color: '#555', marginBottom: 4 },
  hora: { fontSize: 13, color: '#888', marginBottom: 12 },

  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/user-context';

export default function PedidosScreen() {
  const { orders: pedidos, userRole } = useUser();
  const isBusiness = userRole === 'business';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isBusiness && styles.b2bHeader]}>
        <Text style={[styles.headerTitle, isBusiness && { color: '#fff' }]}>
          {isBusiness ? 'Requerimientos B2B' : 'Mis pedidos'}
        </Text>
        <Text style={[styles.headerSubtitle, isBusiness && { color: '#94a3b8' }]}>
          {isBusiness ? 'Historial de compras y servicios corporativos' : 'Historial de solicitudes'}
        </Text>
      </View>

      <ScrollView style={styles.body}>
        {pedidos.map((pedido) => {
          const isB2BOrder = 
            pedido.servicio === 'Decoración & Eventos' || 
            pedido.servicio === 'Branding & Lettering' || 
            pedido.servicio === 'Papelería & Oficina' || 
            pedido.servicio === 'Servicios B2B';

          return (
            <View key={pedido.id} style={styles.pedidoCard}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                  <Text style={styles.titulo}>{pedido.titulo}</Text>
                  {isB2BOrder && (
                    <View style={styles.cardB2bBadge}>
                      <Text style={styles.cardB2bBadgeText}>B2B</Text>
                    </View>
                  )}
                </View>
                <View style={[
                  styles.estadoBadge, 
                  { backgroundColor: pedido.estado === 'Completado' ? '#e8f5e9' : (isBusiness ? '#EEF2F6' : '#FFF8DC') }
                ]}>
                  <Text style={{ 
                    color: pedido.estado === 'Completado' ? '#1b5e20' : (isBusiness ? '#3730A3' : '#8a6d00'), 
                    fontSize: 12, 
                    fontWeight: '500' 
                  }}>
                    {pedido.estado}
                  </Text>
                </View>
              </View>

              <Text style={styles.detalle}>
                {pedido.proveedor ? `${pedido.proveedor} · ` : (isBusiness ? 'Buscando socio B2B · ' : 'Buscando técnico · ')} {pedido.servicio}
              </Text>
              <Text style={styles.hora}>{pedido.hora}</Text>

              {/* Barra de progreso */}
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${pedido.progreso}%`, 
                      backgroundColor: pedido.estado === 'Completado' ? '#4caf50' : (isBusiness ? '#818cf8' : '#FFB400') 
                    }
                  ]} 
                />
              </View>

              {/* Calificación otorgada */}
              {pedido.calificado && (
                <View style={styles.calificacionResumen}>
                  <View style={styles.estrellasFila}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons 
                        key={s} 
                        name={s <= (pedido.calificacionEstrellas || 0) ? "star" : "star-outline"} 
                        size={16} 
                        color="#FFB400" 
                      />
                    ))}
                    <Text style={styles.calificacionTexto}>
                      ({pedido.calificacionEstrellas} / 5)
                    </Text>
                  </View>
                  {pedido.calificacionEtiquetas && pedido.calificacionEtiquetas.length > 0 && (
                    <View style={styles.etiquetasFila}>
                      {pedido.calificacionEtiquetas.map((tag, i) => (
                        <View key={i} style={[styles.etiquetaTag, isBusiness && { backgroundColor: '#e0e7ff', borderColor: '#e0e7ff' }]}>
                          <Text style={[styles.etiquetaTagText, isBusiness && { color: '#3730a3' }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

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
    backgroundColor: '#FFB400',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  b2bHeader: {
    backgroundColor: '#1e293b',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2F2F2F' },
  headerSubtitle: { fontSize: 14, color: '#5a4800', marginTop: 4 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  pedidoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  titulo: { fontSize: 16, fontWeight: '600', color: '#2F2F2F' },
  cardB2bBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardB2bBadgeText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '700',
  },
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
  calificacionResumen: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  estrellasFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  calificacionTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  etiquetasFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  etiquetaTag: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#FFB400',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etiquetaTagText: {
    fontSize: 10,
    color: '#b68000',
    fontWeight: '600',
  },
});

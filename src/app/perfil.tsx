import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Avatar y Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarTextBig}>LM</Text>
          </View>
          <Text style={styles.name}>Luis Alberto M.</Text>
          <Text style={styles.veracity}>Índice de veracidad: <Text style={{ color: '#2F2F2F', fontWeight: '600' }}>98%</Text></Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Servicios</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.8 ★</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>
        </View>

        {/* Cuenta */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        
        <View style={styles.accountCard}>
          <TouchableOpacity style={styles.accountRow}>
            <Ionicons name="location-outline" size={24} color="#666" />
            <Text style={styles.accountText}>Santa Cruz de la Sierra</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountRow}>
            <Ionicons name="call-outline" size={24} color="#666" />
            <Text style={styles.accountText}>+591 7XXX XXXX</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.accountRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="log-out-outline" size={24} color="#e53935" />
            <Text style={[styles.accountText, { color: '#e53935' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 12 }}>
          Todo Ya © 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#FFD700',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2F2F2F' },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarBig: {
    width: 90,
    height: 90,
    backgroundColor: '#2F2F2F',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTextBig: { color: '#FFD700', fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '600', color: '#2F2F2F', marginBottom: 4 },
  veracity: { fontSize: 14, color: '#666' },

  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  statLabel: { fontSize: 12, color: '#888' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 4,
  },

  accountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  accountText: { fontSize: 16, color: '#2F2F2F' },
});
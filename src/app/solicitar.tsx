import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SolicitarScreen() {
  const [inputText, setInputText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [servicio, setServicio] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [precio, setPrecio] = useState('');

  const processNLP = () => {
    if (!inputText.trim()) {
      Alert.alert('Escribe tu problema', 'Por favor describe qué necesitas');
      return;
    }

    const text = inputText.toLowerCase();
    let serv = 'Plomería';
    let urg = 'Normal';
    let prec = 'Bs. 80–150';

    if (text.includes('electr') || text.includes('luz') || text.includes('cable')) {
      serv = 'Electricidad';
      prec = 'Bs. 60–120';
    } else if (text.includes('pint') || text.includes('pared')) {
      serv = 'Pintura';
      prec = 'Bs. 120–300';
    } else if (text.includes('ac') || text.includes('aire') || text.includes('clima')) {
      serv = 'AC / Climatización';
      prec = 'Bs. 150–400';
    }

    if (text.includes('urgente') || text.includes('ahora') || text.includes('rápido') || text.includes('rapido')) {
      urg = 'Alta';
    }

    setServicio(serv);
    setUrgencia(urg);
    setPrecio(prec);
    setShowResult(true);
  };

  const confirmarSolicitud = () => {
    Alert.alert('✅ Solicitud Enviada', 'Estamos buscando proveedores cercanos...', [
      { text: 'OK', onPress: () => setShowResult(false) }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva solicitud</Text>
        <Text style={styles.headerSubtitle}>Cuéntanos qué necesitas</Text>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.aiChip}>
          <Ionicons name="sparkles" size={20} color="#FFD700" />
          <Text style={styles.aiText}>La IA analizará tu solicitud</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Ej: tengo una fuga debajo del lavabo, es urgente..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.sendButton} onPress={processNLP}>
          <Ionicons name="send" size={22} color="#FFD700" />
          <Text style={styles.sendButtonText}>Analizar y buscar proveedores</Text>
        </TouchableOpacity>

        {showResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Análisis IA</Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultRow}><Text style={styles.bold}>Servicio:</Text> {servicio}</Text>
              <Text style={styles.resultRow}><Text style={styles.bold}>Urgencia:</Text> <Text style={urgencia === 'Alta' ? styles.urgent : {}}>{urgencia}</Text></Text>
              <Text style={styles.resultRow}><Text style={styles.bold}>Precio estimado:</Text> {precio}</Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmarSolicitud}>
              <Text style={styles.confirmButtonText}>Confirmar y buscar proveedores</Text>
            </TouchableOpacity>
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

  aiChip: {
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  aiText: { color: '#5a4800', fontWeight: '500' },

  input: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },

  sendButton: {
    backgroundColor: '#2F2F2F',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sendButtonText: { color: '#FFD700', fontSize: 16, fontWeight: '600' },

  resultContainer: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 12, textTransform: 'uppercase' },
  
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  resultRow: { fontSize: 15, marginVertical: 6 },
  bold: { fontWeight: '600' },
  urgent: { color: '#e53935', fontWeight: '600' },

  confirmButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#2F2F2F', fontSize: 16, fontWeight: '600' },
});
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '../context/user-context';
import MapView from '../components/map-view';

/**
 * Componente SolicitarScreen:
 * Formulario del Cliente para crear nuevas solicitudes.
 * Utiliza un motor de análisis de texto básico (NLP simulado) para sugerir de forma automática
 * la categoría, el costo sugerido y la urgencia según la descripción escrita.
 */
interface CandidateProvider {
  name: string;
  lat: number;
  lng: number;
  service: string;
  rating: string;
  price: string;
  experience: string;
  description: string;
  distance: string;
}

const CANDIDATOS_DATABASE: Record<string, CandidateProvider[]> = {
  'Plomería': [
    { name: "Juan Ríos", lat: -17.7725, lng: -63.1930, service: "Plomería", rating: "4.9 ★", price: "Bs. 90", experience: "Más de 3 años", description: "Plomero certificado residencial", distance: "1.7 km" },
    { name: "Andrés López", lat: -17.7880, lng: -63.1790, service: "Plomería", rating: "4.7 ★", price: "Bs. 110", experience: "1 a 3 años", description: "Experto en detección de fugas", distance: "0.6 km" }
  ],
  'Electricidad': [
    { name: "Carlos Mamani", lat: -17.7950, lng: -63.1650, service: "Electricidad", rating: "4.8 ★", price: "Bs. 70", experience: "Más de 3 años", description: "Técnico electricista domiciliario", distance: "2.3 km" },
    { name: "Fernando Ruiz", lat: -17.7810, lng: -63.1920, service: "Electricidad", rating: "4.6 ★", price: "Bs. 60", experience: "1 a 3 años", description: "Instalaciones y cortocircuitos", distance: "1.1 km" }
  ],
  'Pintura': [
    { name: "María López", lat: -17.7610, lng: -63.1720, service: "Pintura", rating: "4.8 ★", price: "Bs. 130", experience: "Más de 3 años", description: "Pintura en interiores y exteriores", distance: "2.7 km" },
    { name: "José Vargas", lat: -17.7850, lng: -63.1690, service: "Pintura", rating: "4.9 ★", price: "Bs. 120", experience: "Más de 3 años", description: "Acabados premium y texturas", distance: "1.4 km" }
  ],
  'Climatización': [
    { name: "Andrés Silva", lat: -17.7890, lng: -63.2050, service: "Climatización", rating: "4.9 ★", price: "Bs. 160", experience: "Más de 3 años", description: "Instalación y mantenimiento de AC split", distance: "2.5 km" },
    { name: "Ramiro Paz", lat: -17.7780, lng: -63.1750, service: "Climatización", rating: "4.7 ★", price: "Bs. 140", experience: "1 a 3 años", description: "Limpieza profunda y carga de gas", distance: "0.9 km" }
  ],
  'Papelería & Oficina': [
    { name: "Librería Alfa Insumos", lat: -17.7910, lng: -63.1790, service: "Papelería & Oficina", rating: "4.9 ★", price: "Bs. 320", experience: "Más de 3 años", description: "Papelería e insumos por mayor para oficinas", distance: "0.9 km" },
    { name: "Imprenta Beta B2B", lat: -17.7710, lng: -63.1890, service: "Papelería & Oficina", rating: "4.8 ★", price: "Bs. 350", experience: "Más de 3 años", description: "Servicios gráficos y material corporativo", distance: "1.5 km" }
  ],
  'Branding & Lettering': [
    { name: "Gráfica Beta", lat: -17.7710, lng: -63.1890, service: "Branding & Lettering", rating: "4.8 ★", price: "Bs. 450", experience: "Más de 3 años", description: "Especialistas en letreros y vitrinas B2B", distance: "1.5 km" },
    { name: "Branding Express", lat: -17.7800, lng: -63.1990, service: "Branding & Lettering", rating: "4.7 ★", price: "Bs. 500", experience: "1 a 3 años", description: "Identidad visual y papelería corporativa", distance: "1.8 km" }
  ],
  'Decoración & Eventos': [
    { name: "Eventos Premium", lat: -17.7650, lng: -63.1780, service: "Decoración & Eventos", rating: "4.9 ★", price: "Bs. 850", experience: "Más de 3 años", description: "Globos y decoración corporativa", distance: "2.1 km" },
    { name: "DecoOficina", lat: -17.7920, lng: -63.1890, service: "Decoración & Eventos", rating: "4.6 ★", price: "Bs. 950", experience: "1 a 3 años", description: "Ambientación de espacios de trabajo", distance: "1.2 km" }
  ],
  'Servicios B2B': [
    { name: "Servicios Integrales Alfa", lat: -17.7820, lng: -63.1780, service: "Servicios B2B", rating: "4.7 ★", price: "Bs. 300", experience: "Más de 3 años", description: "Limpieza y mantenimiento de oficinas", distance: "0.8 km" },
    { name: "Imprenta y Gráfica Beta", lat: -17.7710, lng: -63.1890, service: "Servicios B2B", rating: "4.8 ★", price: "Bs. 400", experience: "Más de 3 años", description: "Soluciones de impresión y papelería", distance: "1.5 km" }
  ]
};

const getCandidates = (cat: string) => {
  return CANDIDATOS_DATABASE[cat] || [
    { name: "Juan Ríos", lat: -17.7725, lng: -63.1930, service: cat, rating: "4.9 ★", price: "Bs. 80", experience: "Más de 3 años", description: "Servicios generales de confianza", distance: "1.7 km" },
    { name: "María López", lat: -17.7610, lng: -63.1720, service: cat, rating: "4.8 ★", price: "Bs. 120", experience: "Más de 3 años", description: "Servicios premium", distance: "2.7 km" }
  ];
};

export default function SolicitarScreen() {
  const { addOrder, userRole } = useUser();
  const isBusiness = userRole === 'business';
  const [inputText, setInputText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [servicio, setServicio] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Controladores del modal de alerta/confirmación personalizado
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const [isFocused, setIsFocused] = useState(false);

  // Estados para la búsqueda en tiempo real
  const [faseBusqueda, setFaseBusqueda] = useState<'input' | 'scanning' | 'offers' | 'expired'>('input');
  const [contador, setContador] = useState(15);
  const [candidatos, setCandidatos] = useState<CandidateProvider[]>([]);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [timerIntervalId]);

  /**
   * Procesa la entrada de texto simulando un análisis progresivo con Inteligencia Artificial.
   * Cuenta con 3 etapas visuales con retardos programados de 500ms para enriquecer la UX.
   */
  const processNLP = () => {
    if (!inputText.trim()) {
      setConfirmConfig({
        title: '⚠️ Entrada vacía',
        message: 'Por favor describe qué necesitas antes de analizar.',
        onConfirm: () => {}
      });
      setShowConfirmModal(true);
      return;
    }

    setLoading(true);
    setLoadingText('Analizando descripción con IA...');

    // Etapa 1: Análisis gramatical básico
    setTimeout(() => {
      setLoadingText('Clasificando categoría de servicio...');
      
      // Etapa 2: Mapeo de categorías
      setTimeout(() => {
        setLoadingText('Calculando rango de precio estimado...');

        // Etapa 3: Cálculo del presupuesto de base
        setTimeout(() => {
          const text = inputText.toLowerCase();
          let serv = isBusiness ? 'Decoración & Eventos' : 'Plomería'; // Categoría por defecto
          let urg = 'Normal';
          let prec = isBusiness ? 'Bs. 800–1500' : 'Bs. 80–150';

          if (isBusiness) {
            // Clasificación Corporativa B2B
            if (text.includes('decor') || text.includes('evento') || text.includes('fiesta') || text.includes('cumpleañ') || text.includes('aniversario') || text.includes('globos') || text.includes('arreglos')) {
              serv = 'Decoración & Eventos';
              prec = 'Bs. 800–2500';
            } else if (text.includes('lettering') || text.includes('litering') || text.includes('letrero') || text.includes('rotul') || text.includes('branding') || text.includes('diseño') || text.includes('grafic') || text.includes('gráfic')) {
              serv = 'Branding & Lettering';
              prec = 'Bs. 400–1200';
            } else if (text.includes('papel') || text.includes('insumo') || text.includes('suministro') || text.includes('carpetas') || text.includes('útiles') || text.includes('bolígrafo') || text.includes('cuaderno') || text.includes('resma')) {
              serv = 'Papelería & Oficina';
              prec = 'Bs. 200–800';
            } else if (text.includes('electr') || text.includes('luz') || text.includes('ac') || text.includes('clima') || text.includes('plomer') || text.includes('fuga')) {
              serv = 'Servicios B2B';
              prec = 'Bs. 300–1000';
            }
          } else {
            // Clasificación Residencial Estándar
            if (text.includes('electr') || text.includes('luz') || text.includes('cable') || text.includes('enchufe') || text.includes('corto')) {
              serv = 'Electricidad';
              prec = 'Bs. 60–120';
            } else if (text.includes('pint') || text.includes('pared') || text.includes('techo')) {
              serv = 'Pintura';
              prec = 'Bs. 120–300';
            } else if (text.includes('ac') || text.includes('aire') || text.includes('clima') || text.includes('frío') || text.includes('split')) {
              serv = 'Climatización';
              prec = 'Bs. 150–400';
            }
          }

          // Detección del nivel de urgencia del usuario
          if (text.includes('urgente') || text.includes('ahora') || text.includes('rápido') || text.includes('rapido') || text.includes('urgencia')) {
            urg = 'Alta';
          }

          setServicio(serv);
          setUrgencia(urg);
          setPrecio(prec);
          setLoading(false);
          setShowResult(true); // Despliega la tarjeta con los resultados sugeridos
        }, 500);
      }, 500);
    }, 500);
  };

  /**
   * Cambia la fase de búsqueda a 'scanning' e inicia la postulación en tiempo real.
   */
  const iniciarEscaneoRealTime = () => {
    setShowResult(false);
    setFaseBusqueda('scanning');
    
    // Simular escaneo de 2 segundos (radar de transmisión de señal)
    setTimeout(() => {
      const filtered = getCandidates(servicio);
      setCandidatos(filtered);
      setFaseBusqueda('offers');
      setContador(15);
      
      // Iniciar el temporizador regresivo de 15 segundos
      const interval = setInterval(() => {
        setContador((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setFaseBusqueda('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(interval);
    }, 2000);
  };

  /**
   * Finaliza la solicitud, guarda el pedido en el contexto con el proveedor aceptado
   * y redirige al usuario a la pestaña de "Pedidos" activos en estado 'En progreso'.
   */
  const aceptarOferta = (pro: CandidateProvider) => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    
    let title = `${servicio} — ${urgencia === 'Alta' ? 'Urgente' : 'Estándar'}`;
    if (inputText.length < 30) {
      title = inputText;
    } else {
      title = inputText.substring(0, 25) + '...';
    }

    addOrder(title, servicio, inputText, pro.price, urgencia, pro.name);

    setConfirmConfig({
      title: '🎉 ¡Oferta Aceptada!',
      message: `Has seleccionado a ${pro.name}. El proveedor ha aceptado y el trabajo está en curso.`,
      onConfirm: () => {
        resetForm();
        router.replace('/pedidos');
      }
    });
    setShowConfirmModal(true);
  };

  /**
   * Crea la solicitud en la lista general en estado 'Buscando proveedor' (sin asignar).
   */
  const publicarSinAsignar = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);

    let title = `${servicio} — ${urgencia === 'Alta' ? 'Urgente' : 'Estándar'}`;
    if (inputText.length < 30) {
      title = inputText;
    } else {
      title = inputText.substring(0, 25) + '...';
    }

    addOrder(title, servicio, inputText, precio, urgencia, null);

    setConfirmConfig({
      title: '✅ Publicado en Lista General',
      message: 'Tu solicitud ha sido enviada. Los proveedores cercanos ya pueden verla y postularse.',
      onConfirm: () => {
        resetForm();
        router.replace('/pedidos');
      }
    });
    setShowConfirmModal(true);
  };

  const reintentarBusqueda = () => {
    setFaseBusqueda('input');
    setInputText('');
    setShowResult(false);
  };

  const resetForm = () => {
    setInputText('');
    setFaseBusqueda('input');
    setShowResult(false);
  };

  return (
    <View style={styles.container}>
      {faseBusqueda === 'input' && (
        <>
          {/* Encabezado de la página */}
          <View style={[styles.header, isBusiness && styles.b2bHeader]}>
            <Text style={[styles.headerTitle, isBusiness && { color: '#fff' }]}>
              {isBusiness ? 'Nueva solicitud B2B' : 'Nueva solicitud'}
            </Text>
            <Text style={[styles.headerSubtitle, isBusiness && { color: '#94a3b8' }]}>
              {isBusiness ? 'Publica los requerimientos corporativos de tu empresa' : 'Cuéntanos qué necesitas'}
            </Text>
          </View>

          <ScrollView style={styles.body}>
            {/* Chip informativo sobre IA */}
            <View style={[styles.aiChip, isBusiness && styles.b2bAiChip]}>
              <Ionicons name="sparkles" size={20} color={isBusiness ? '#818cf8' : '#FFB400'} />
              <Text style={[styles.aiText, isBusiness && { color: '#4f46e5' }]}>La IA clasificará tu pedido corporativo</Text>
            </View>

            {/* Input de descripción multilínea */}
            <TextInput
              style={[
                styles.input,
                isBusiness && { borderColor: '#818cf8' },
                isFocused && (isBusiness ? styles.inputFocusedB2B : styles.inputFocused)
              ]}
              placeholder={isBusiness ? "Ej: Requerimos decoración corporativa con globos para nuestro aniversario de oficina, y 15 resmas de papel bond..." : "Ej: tengo una fuga debajo del lavabo, es urgente..."}
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={4}
              editable={!loading}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            {/* Botón de análisis / Estado cargando */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isBusiness ? '#818cf8' : '#FFB400'} />
                <Text style={styles.loadingText}>{loadingText}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.sendButton, isBusiness && { backgroundColor: '#818cf8' }]} 
                onPress={processNLP}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={22} color={isBusiness ? '#fff' : '#FFB400'} />
                <Text style={[styles.sendButtonText, isBusiness && { color: '#fff' }]}>Analizar y buscar socios B2B</Text>
              </TouchableOpacity>
            )}

            {/* Resultados sugeridos por la IA */}
            {showResult && !loading && (
              <View style={styles.resultContainer}>
                <Text style={styles.sectionTitle}>Análisis IA</Text>

                <View style={styles.resultCard}>
                  <Text style={styles.resultRow}><Text style={styles.bold}>Servicio:</Text> {servicio}</Text>
                  <Text style={styles.resultRow}><Text style={styles.bold}>Urgencia:</Text> <Text style={urgencia === 'Alta' ? styles.urgent : {}}>{urgencia}</Text></Text>
                  <Text style={styles.resultRow}><Text style={styles.bold}>Precio estimado:</Text> {precio}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.confirmButton, isBusiness && { backgroundColor: '#818cf8' }]} 
                  onPress={iniciarEscaneoRealTime}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmButtonText, isBusiness && { color: '#fff' }]}>Confirmar y buscar proveedores</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {faseBusqueda === 'scanning' && (
        <View style={styles.scanningContainer}>
          <Ionicons name="sparkles" size={54} color={isBusiness ? '#6366f1' : '#FFB400'} style={{ marginBottom: 20 }} />
          <ActivityIndicator size="large" color={isBusiness ? '#6366f1' : '#FFB400'} />
          <Text style={styles.scanningTitle}>Transmitiendo Solicitud</Text>
          <Text style={styles.scanningSubtitle}>
            Enviando requerimiento de {servicio} a proveedores libres en un radio de 5km...
          </Text>
          <View style={[styles.radarOuterCircle, isBusiness && { backgroundColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
            <View style={[styles.radarInnerCircle, isBusiness && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1' }]} />
          </View>
        </View>
      )}

      {faseBusqueda === 'offers' && (
        <>
          {/* Header Bidding */}
          <View style={[styles.header, isBusiness && styles.b2bHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={[styles.headerTitle, isBusiness && { color: '#fff' }]}>Ofertas de Proveedores</Text>
              <Text style={[styles.headerSubtitle, isBusiness && { color: '#94a3b8' }]}>{servicio} · {urgencia}</Text>
            </View>
            <View style={[styles.timerBadge, isBusiness && { backgroundColor: '#818cf8' }, contador < 5 && styles.timerDanger]}>
              <Ionicons name="time-outline" size={18} color={contador < 5 ? '#fff' : (isBusiness ? '#fff' : '#2F2F2F')} />
              <Text style={[styles.timerText, { color: contador < 5 ? '#fff' : (isBusiness ? '#fff' : '#2F2F2F') }]}>{contador}s</Text>
            </View>
          </View>

          {/* Map Section */}
          <View style={styles.mapWrap}>
            <MapView providersList={candidatos} />
          </View>

          {/* Candidates Slider */}
          <ScrollView style={styles.candidatesList} showsVerticalScrollIndicator={true}>
            <Text style={styles.sectionTitle}>Proveedores Libres Disponibles ({candidatos.length})</Text>
            {candidatos.map((pro, index) => {
              const avatarInit = pro.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
              return (
                <View key={index} style={styles.candidateCard}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={[styles.candidateAvatar, isBusiness ? { backgroundColor: '#e0e7ff' } : { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#FFB400' }]}>
                      <Text style={[styles.candidateAvatarText, isBusiness ? { color: '#3730a3' } : { color: '#b68000' }]}>{avatarInit}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.candidateName}>{pro.name}</Text>
                        <Text style={styles.candidatePrice}>{pro.price}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={[styles.candidateRating, !isBusiness && { color: '#b68000' }, isBusiness && { color: '#6366f1' }]}>{pro.rating}</Text>
                        <Text style={styles.candidateDistance}>· a {pro.distance} de distancia</Text>
                      </View>
                      <Text style={styles.candidateDesc} numberOfLines={2}>{pro.description}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                    <TouchableOpacity 
                      style={[styles.acceptBtn, isBusiness ? { backgroundColor: '#6366f1' } : { backgroundColor: '#FFB400' }]}
                      onPress={() => aceptarOferta(pro)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.acceptBtnText, isBusiness ? { color: '#fff' } : { color: '#2F2F2F' }]}>Aceptar Oferta</Text>
                      <Ionicons name="checkmark" size={16} color={isBusiness ? '#fff' : '#2F2F2F'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity 
              style={styles.publishFallbackBtn}
              onPress={publicarSinAsignar}
              activeOpacity={0.7}
            >
              <Text style={styles.publishFallbackText}>Publicar en lista general sin asignar</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {faseBusqueda === 'expired' && (
        <View style={styles.expiredContainer}>
          <Ionicons name="hourglass-outline" size={64} color="#e53935" style={{ marginBottom: 16 }} />
          <Text style={styles.expiredTitle}>¡Tiempo de espera agotado!</Text>
          <Text style={styles.expiredSubtitle}>
            Los proveedores cercanos de {servicio} no respondieron a tiempo. Puedes reintentar la búsqueda o publicar tu solicitud en la lista general.
          </Text>
          <View style={styles.expiredActions}>
            <TouchableOpacity 
              style={[styles.confirmButton, { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]} 
              onPress={reintentarBusqueda}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#475569', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, isBusiness ? { backgroundColor: '#6366f1' } : { backgroundColor: '#FFB400' }, { flex: 1.5 }]} 
              onPress={publicarSinAsignar}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, isBusiness ? { color: '#fff' } : { color: '#2F2F2F' }]}>Publicar en Lista General</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal personalizado */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, isBusiness && { backgroundColor: '#6366f1' }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmConfig.onConfirm();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalConfirmText, isBusiness && { color: '#fff' }]}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2F2F2F' },
  headerSubtitle: { fontSize: 14, color: '#5a4800', marginTop: 4 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  aiChip: {
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#FFB400',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  aiText: { color: '#5a4800', fontWeight: '500' },

  input: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#eee',
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: '#FFB400',
    backgroundColor: '#fff',
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  inputFocusedB2B: {
    borderColor: '#818cf8',
    backgroundColor: '#fff',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  sendButton: {
    backgroundColor: '#2F2F2F',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sendButtonText: { color: '#FFB400', fontSize: 16, fontWeight: '600' },

  resultContainer: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 12, textTransform: 'uppercase' },
  
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  resultRow: { fontSize: 15, marginVertical: 6 },
  bold: { fontWeight: '600' },
  urgent: { color: '#e53935', fontWeight: '600' },

  confirmButton: {
    backgroundColor: '#FFB400',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#2F2F2F', fontSize: 16, fontWeight: '600' },

  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#FFB400',
  },
  modalConfirmText: {
    color: '#2F2F2F',
    fontSize: 14,
    fontWeight: '700',
  },
  b2bHeader: {
    backgroundColor: '#1e293b',
  },
  b2bAiChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#818cf8',
  },
  scanningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  scanningTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F2F2F',
    marginTop: 16,
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 320,
  },
  radarOuterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  radarInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFB400',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFB400',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  timerDanger: {
    backgroundColor: '#e53935',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  mapWrap: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
  },
  candidatesList: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  candidateCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  candidatePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  candidateRating: {
    fontSize: 12,
    fontWeight: '600',
  },
  candidateDistance: {
    fontSize: 12,
    color: '#888',
  },
  candidateDesc: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
    lineHeight: 18,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  publishFallbackBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 10,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  publishFallbackText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  expiredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  expiredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F2F2F',
    marginTop: 16,
    marginBottom: 8,
  },
  expiredSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 320,
  },
  expiredActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
});


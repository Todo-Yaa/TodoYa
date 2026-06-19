import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/user-context';
import MapView from '../components/map-view';
import { matchProviders } from '../services/ai-matching';

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
  isCounterOffer?: boolean;
  priceValue?: number;
  originalPriceValue?: number;
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
  const { t } = useTranslation();
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

  // Estados para la búsqueda en tiempo real y flujo B2B
  const [faseBusqueda, setFaseBusqueda] = useState<'input' | 'scanning' | 'offers' | 'expired' | 'chat'>('input');
  const [contador, setContador] = useState(15);
  const [candidatos, setCandidatos] = useState<CandidateProvider[]>([]);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);
  const [presupuestoInput, setPresupuestoInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<CandidateProvider | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'client' | 'provider'; text: string; time: string }>>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [replyIndex, setReplyIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [b2bVisibleOffers, setB2bVisibleOffers] = useState<CandidateProvider[]>([]);

  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [timerIntervalId]);

  /**
   * Procesa la entrada de texto mediante el algoritmo de matching (IA / local).
   */
  const processNLP = async () => {
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

    try {
      // 1. Llamar al servicio de emparejamiento inteligente (intenta API online -> fallback local offline)
      const res = await matchProviders(inputText, -17.784, -63.180);
      
      const cat = res.nlpAnalysis.categoriaDetectada;
      const urg = res.nlpAnalysis.urgenciaDetectada;
      
      setServicio(cat);
      setUrgencia(urg);
      setPrecio(res.precioSugerido);

      // 2. Mapear los proveedores obtenidos al formato del estado de la pantalla
      let mapped = res.proveedoresEmparejados.map((p: any) => ({
        name: p.nombre,
        lat: p.lat,
        lng: p.lng,
        service: p.especialidad,
        rating: `${p.rating} ★`,
        price: urg === 'Alta' ? 'Bs. 180' : 'Bs. 120', // precio base estimado
        experience: `${p.experiencia} años`,
        description: p.descripcion,
        distance: `${p.distanciaKm} km`
      }));

      // Si no devolvió nada (por ejemplo, categorías B2B no cargadas en la BD temporal), usar fallback estático
      if (mapped.length === 0) {
        mapped = getCandidates(cat);
      }

      setCandidatos(mapped);

      // 3. Si es cuenta corporativa, pre-calcular sugerido
      if (isBusiness) {
        let sugerido = '600';
        if (cat === 'Decoración & Eventos') sugerido = '1200';
        else if (cat === 'Branding & Lettering') sugerido = '800';
        else if (cat === 'Papelería & Oficina') sugerido = '450';
        else if (cat === 'Servicios B2B') sugerido = '600';
        setPresupuestoInput(sugerido);
      }

      setLoading(false);
      setShowResult(true);
    } catch (err) {
      console.error('Error al clasificar solicitud:', err);
      setLoading(false);
      setConfirmConfig({
        title: '⚠️ Error de análisis',
        message: 'No pudimos completar el análisis de IA. Inténtalo de nuevo.',
        onConfirm: () => {}
      });
      setShowConfirmModal(true);
    }
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
      
      if (isBusiness) {
        // Generar contraofertas corporativas en base al presupuesto del usuario
        const baseBudget = parseFloat(presupuestoInput) || 600;
        const b2bCandidates = filtered.map((pro, index) => {
          let finalPrice = baseBudget;
          let isCounter = false;
          
          if (index === 1) {
            // El segundo candidato ofrece un 8% menos
            finalPrice = Math.round(baseBudget * 0.92);
            isCounter = true;
          } else if (index === 2 || (index === 0 && filtered.length === 1)) {
            // El tercer candidato ofrece un 15% más por servicio premium
            finalPrice = Math.round(baseBudget * 1.15);
            isCounter = true;
          }
          
          return {
            ...pro,
            price: `Bs. ${finalPrice}`,
            priceValue: finalPrice,
            isCounterOffer: isCounter,
            originalPriceValue: baseBudget,
            description: index === 2 
              ? `${pro.description} (Servicio Express Premium con Garantía extendida)`
              : pro.description
          };
        });

        setCandidatos(b2bCandidates);
        setFaseBusqueda('offers');
        setB2bVisibleOffers([]);

        // Mostrar ofertas progresivamente para una UX espectacular
        setB2bVisibleOffers([b2bCandidates[0]]);
        
        if (b2bCandidates[1]) {
          setTimeout(() => {
            setB2bVisibleOffers(prev => [...prev, b2bCandidates[1]]);
          }, 1200);
        }
        if (b2bCandidates[2]) {
          setTimeout(() => {
            setB2bVisibleOffers(prev => [...prev, b2bCandidates[2]]);
          }, 2400);
        }
      } else {
        // Flujo residencial normal con temporizador de 15 segundos
        setCandidatos(filtered);
        setFaseBusqueda('offers');
        setContador(15);
        
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
      }
    }, 2000);
  };

  /**
   * Finaliza la solicitud, guarda el pedido en el contexto con el proveedor aceptado
   * y redirige al usuario a la pestaña de "Pedidos" activos en estado 'En progreso'.
   */
  const aceptarOferta = (pro: CandidateProvider) => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    
    if (isBusiness) {
      // Flujo B2B: Iniciar un chat interactivo con la empresa seleccionada antes de crear formalmente el pedido
      setSelectedProvider(pro);
      setFaseBusqueda('chat');
      setReplyIndex(0);
      setIsTyping(false);
      
      const priceMsg = pro.isCounterOffer 
        ? `mi contraoferta de ${pro.price}` 
        : `tu presupuesto propuesto de Bs. ${presupuestoInput}`;
        
      setChatMessages([
        {
          sender: 'provider',
          text: `¡Hola! He recibido tu solicitud para el servicio de "${servicio}" y he aceptado formalizar ${priceMsg}. ¿Cuándo coordinamos la entrega o los detalles operativos?`,
          time: 'Ahora'
        }
      ]);
    } else {
      // Flujo residencial estándar
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
    }
  };

  const enviarMensajeChat = () => {
    if (!nuevoMensaje.trim() || !selectedProvider) return;
    
    const clientMsg = nuevoMensaje.trim();
    setChatMessages(prev => [...prev, { sender: 'client', text: clientMsg, time: 'Ahora' }]);
    setNuevoMensaje('');
    
    // Simular indicador de escribiendo
    setTimeout(() => {
      setIsTyping(true);
    }, 600);
    
    // Simular respuesta del proveedor corporativo
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';
      
      if (replyIndex === 0) {
        replyText = `Excelente. Contamos con todo el equipamiento necesario y emitimos factura de ley. ¿Nos facilitas el NIT y correo de facturación corporativa para armar el contrato de servicio?`;
      } else if (replyIndex === 1) {
        replyText = `Entendido, queda agendado. Acabo de registrar la orden en nuestro sistema interno para comenzar mañana a primera hora. Te mantendremos informado del avance.`;
      } else {
        replyText = `Perfecto. Si tienes cualquier otro requerimiento o cambio de último momento, nos avisas por aquí. ¡Muchas gracias por confiar en nosotros!`;
      }
      
      setChatMessages(prev => [...prev, { sender: 'provider', text: replyText, time: 'Ahora' }]);
      setReplyIndex(prev => prev + 1);
    }, 1800);
  };

  const concluirChatYCrearPedido = () => {
    if (!selectedProvider) return;
    
    let title = `${servicio} — ${urgencia === 'Alta' ? 'Urgente' : 'Estándar'}`;
    if (inputText.length < 30) {
      title = inputText;
    } else {
      title = inputText.substring(0, 25) + '...';
    }

    addOrder(title, servicio, inputText, selectedProvider.price, urgencia, selectedProvider.name);

    resetForm();
    router.replace('/pedidos');
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
              {isBusiness ? t('solicitud.title_b2b') : t('solicitud.title')}
            </Text>
            <Text style={[styles.headerSubtitle, isBusiness && { color: '#94a3b8' }]}>
              {isBusiness ? t('solicitud.subtitle_b2b') : t('solicitud.subtitle')}
            </Text>
          </View>

          <ScrollView style={styles.body}>
            {/* Chip informativo sobre IA */}
            <View style={[styles.aiChip, isBusiness && styles.b2bAiChip]}>
              <Ionicons name="sparkles" size={20} color={isBusiness ? '#818cf8' : '#FFB400'} />
              <Text style={[styles.aiText, isBusiness && { color: '#4f46e5' }]}>{t('solicitud.ai_classification')}</Text>
            </View>

            {/* Input de descripción multilínea */}
            <TextInput
              style={[
                styles.input,
                isBusiness && { borderColor: '#818cf8' },
                isFocused && (isBusiness ? styles.inputFocusedB2B : styles.inputFocused)
              ]}
              placeholder={isBusiness ? t('solicitud.placeholder_b2b') : t('solicitud.placeholder')}
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
                <Text style={[styles.sendButtonText, isBusiness && { color: '#fff' }]}>{t('solicitud.analyze_btn')}</Text>
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
                  
                  {isBusiness && (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 }}>
                      <Text style={[styles.inputLabel, { marginTop: 0, color: '#4f46e5' }]}>Tu presupuesto objetivo (Bs.):</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#818cf8', borderRadius: 10, paddingHorizontal: 12, height: 44, marginTop: 4 }}>
                        <Text style={{ fontSize: 15, color: '#4f46e5', marginRight: 4, fontWeight: '600' }}>Bs.</Text>
                        <TextInput
                          style={{ flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600', outlineStyle: 'none' } as any}
                          value={presupuestoInput}
                          onChangeText={setPresupuestoInput}
                          keyboardType="numeric"
                          placeholder="Ej. 1000"
                        />
                      </View>
                      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Los socios B2B enviarán cotizaciones o contraofertas basándose en esta cifra.
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.confirmButton, isBusiness && { backgroundColor: '#818cf8' }]} 
                  onPress={iniciarEscaneoRealTime}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmButtonText, isBusiness && { color: '#fff' }]}>{t('solicitud.confirm_btn')}</Text>
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
          <Text style={styles.scanningTitle}>{t('solicitud.scanning_title')}</Text>
          <Text style={styles.scanningSubtitle}>
            {t('solicitud.scanning_subtitle', { servicio })}
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
            {isBusiness ? (
              <View style={[styles.timerBadge, { backgroundColor: '#4f46e5' }]}>
                <Ionicons name="radio-outline" size={18} color="#fff" />
                <Text style={[styles.timerText, { color: '#fff' }]}>En vivo</Text>
              </View>
            ) : (
              <View style={[styles.timerBadge, isBusiness && { backgroundColor: '#818cf8' }, contador < 5 && styles.timerDanger]}>
                <Ionicons name="time-outline" size={18} color={contador < 5 ? '#fff' : (isBusiness ? '#fff' : '#2F2F2F')} />
                <Text style={[styles.timerText, { color: contador < 5 ? '#fff' : (isBusiness ? '#fff' : '#2F2F2F') }]}>{contador}s</Text>
              </View>
            )}
          </View>

          {/* Map Section */}
          <View style={styles.mapWrap}>
            <MapView providersList={isBusiness ? b2bVisibleOffers : candidatos} />
          </View>

          {/* Candidates Slider */}
          <ScrollView style={styles.candidatesList} showsVerticalScrollIndicator={true}>
            <Text style={styles.sectionTitle}>
              {isBusiness 
                ? `Postulaciones recibidas (${b2bVisibleOffers.length} de ${candidatos.length})` 
                : `Proveedores Libres Disponibles (${candidatos.length})`}
            </Text>
            {(isBusiness ? b2bVisibleOffers : candidatos).map((pro, index) => {
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
                      
                      {/* Fila B2B explicativa de la oferta */}
                      {isBusiness && (
                        <View style={{ alignSelf: 'flex-start', marginVertical: 6, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, backgroundColor: pro.isCounterOffer ? '#f5f3ff' : '#ecfdf5', borderWidth: 1, borderColor: pro.isCounterOffer ? '#c084fc' : '#34d399' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: pro.isCounterOffer ? '#7c3aed' : '#059669' }}>
                            {pro.isCounterOffer 
                              ? `Contraoferta (Presupuesto objetivo: Bs. ${presupuestoInput})` 
                              : 'Acepta tu presupuesto'}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.candidateDesc} numberOfLines={2}>{pro.description}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                    <TouchableOpacity 
                      style={[styles.acceptBtn, isBusiness ? { backgroundColor: '#6366f1' } : { backgroundColor: '#FFB400' }]}
                      onPress={() => aceptarOferta(pro)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.acceptBtnText, isBusiness ? { color: '#fff' } : { color: '#2F2F2F' }]}>
                        {isBusiness ? 'Aceptar y Chatear' : 'Aceptar Oferta'}
                      </Text>
                      <Ionicons name="chatbubbles-outline" size={16} color={isBusiness ? '#fff' : '#2F2F2F'} style={{ marginLeft: 2 }} />
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

      {faseBusqueda === 'chat' && selectedProvider && (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Header del Chat */}
          <View style={[styles.header, styles.b2bHeader, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <TouchableOpacity 
              style={{ padding: 4 }} 
              onPress={() => setFaseBusqueda('offers')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{selectedProvider.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>En línea · Cotización: {selectedProvider.price}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#4f46e5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 }}
              onPress={concluirChatYCrearPedido}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Ver Pedidos</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Mensajes */}
          <ScrollView 
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          >
            {chatMessages.map((msg, index) => {
              const isMe = msg.sender === 'client';
              return (
                <View 
                  key={index}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    backgroundColor: isMe ? '#818cf8' : '#fff',
                    padding: 12,
                    borderRadius: 16,
                    borderTopRightRadius: isMe ? 4 : 16,
                    borderTopLeftRadius: isMe ? 16 : 4,
                    maxWidth: '80%',
                    borderWidth: isMe ? 0 : 1,
                    borderColor: '#e2e8f0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                    elevation: 1
                  }}
                >
                  <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#1e293b', lineHeight: 20 }}>
                    {msg.text}
                  </Text>
                  <Text style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8', alignSelf: 'flex-end', marginTop: 4 }}>
                    {msg.time}
                  </Text>
                </View>
              );
            })}

            {/* Indicador de "Escribiendo..." */}
            {isTyping && (
              <View 
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#fff',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  borderTopLeftRadius: 4,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                  {selectedProvider.name} está escribiendo...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Barra de Entrada del Chat */}
          <View 
            style={{
              padding: 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#f1f5f9',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 14,
                color: '#1e293b',
                outlineStyle: 'none'
              } as any}
              placeholder="Escribe tu mensaje a la empresa..."
              value={nuevoMensaje}
              onChangeText={setNuevoMensaje}
              onSubmitEditing={enviarMensajeChat}
            />
            <TouchableOpacity 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#6366f1',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={enviarMensajeChat}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane" size={18} color="#fff" />
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

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
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


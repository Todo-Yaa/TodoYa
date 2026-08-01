import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Storage from '../utils/storage';
import { useUser } from '../context/user-context';

const { width } = Dimensions.get('window');
const INSTAGRAM_URL = 'https://www.instagram.com/todoo__ya';

interface OnboardingModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function OnboardingModal({ visible: externalVisible, onClose: externalClose }: OnboardingModalProps) {
  const { activeUser, userRole } = useUser();
  const isBusiness = activeUser?.tipoEntidad === 'empresa' || userRole === 'business';

  const [internalVisible, setInternalVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (externalVisible !== undefined) {
      setInternalVisible(externalVisible);
    } else {
      // Verificar si el usuario ya vio el onboarding
      Storage.getItem('todo_ya_has_seen_onboarding').then(val => {
        if (!val) {
          setInternalVisible(true);
        }
      }).catch(() => {});
    }
  }, [externalVisible]);

  const handleFinish = async () => {
    await Storage.setItem('todo_ya_has_seen_onboarding', 'true');
    setInternalVisible(false);
    if (externalClose) externalClose();
  };

  const handleNext = () => {
    if (currentSlide < 4) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleOpenInstagram = () => {
    Linking.openURL(INSTAGRAM_URL).catch(err => {
      console.warn('Error al abrir Instagram:', err);
    });
  };

  if (!internalVisible) return null;

  // --- DIAPOSITIVAS PARA EMPRESAS (B2B CORPORATIVO) ---
  const businessSlides = [
    {
      icon: "business-outline",
      iconColor: "#818cf8",
      iconBg: "#1e1b4b",
      tag: "B2B CORPORATIVO",
      tagBg: "#312e81",
      tagColor: "#a5b4fc",
      title: "Revolución en Compras B2B",
      subtitle: "Optimiza las compras y contrataciones de tu empresa. Papelería, eventos, mantenimiento y servicios técnicos corporativos sin burocracia."
    },
    {
      icon: "gift-outline",
      iconColor: "#6366f1",
      iconBg: "#312e81",
      tag: "PROMOCIÓN EXCLUSIVA",
      tagBg: "#4338ca",
      tagColor: "#c7d2fe",
      title: "3 Meses Gratis de Solicitudes",
      subtitle: "Publica solicitudes B2B ilimitadas sin costo durante tus primeros 90 días. Comprueba el ahorro de costos y tiempos de respuesta en tiempo real."
    },
    {
      icon: "trending-down-outline",
      iconColor: "#c084fc",
      iconBg: "#581c87",
      tag: "SUBASTA INVERTIDA",
      tagBg: "#6b21a8",
      tagColor: "#e9d5ff",
      title: "Cotización Inteligente en Vivo",
      subtitle: "Define tu presupuesto objetivo. Nuestra IA clasifica tu requerimiento y proveedores pre-verificados compiten ofreciendo presupuestos instantáneos."
    },
    {
      icon: "receipt-outline",
      iconColor: "#34d399",
      iconBg: "#064e3b",
      tag: "FACTURACIÓN & COBERTURA",
      tagBg: "#047857",
      tagColor: "#a7f3d0",
      title: "Facturación & Cobertura Nacional",
      subtitle: "Empresas verificadas con NIT/RUC, facturación electrónica legal y red de proveedores corporativos a nivel local y nacional."
    },
    {
      icon: "rocket-outline",
      iconColor: "#818cf8",
      iconBg: "#1e1b4b",
      tag: "COMUNIDAD B2B",
      tagBg: "#312e81",
      tagColor: "#a5b4fc",
      title: "Impulsa tu Empresa",
      subtitle: "Únete a la red corporativa líder de Latinoamérica. Síguenos en Instagram para conocer casos de éxito y actualizaciones exclusivas B2B."
    }
  ];

  // --- DIAPOSITIVAS PARA PERSONAS NATURALES (HOGAR / SERVICIOS) ---
  const naturalSlides = [
    {
      icon: "home-outline",
      iconColor: "#f59e0b",
      iconBg: "#78350f",
      tag: "SERVICIOS DEL HOGAR",
      tagBg: "#92400e",
      tagColor: "#fef08a",
      title: "¡Soluciones para tu Hogar!",
      subtitle: "Conecta con técnicos calificados de plomería, electricidad, pintura, climatización, mecánica y viandas en minutos."
    },
    {
      icon: "speedometer-outline",
      iconColor: "#22c55e",
      iconBg: "#14532d",
      tag: "RADAR 90 SEGUNDOS",
      tagBg: "#15803d",
      tagColor: "#bbf7d0",
      title: "Radar Inteligente en Vivo",
      subtitle: "Describe tu problema. El radar escanea profesionales libres a menos de 5 km que responden en segundos con tarifas transparentes."
    },
    {
      icon: "mic-outline",
      iconColor: "#c084fc",
      iconBg: "#581c87",
      tag: "IA MULTILINGÜE",
      tagBg: "#6b21a8",
      tagColor: "#e9d5ff",
      title: "IA por Voz & Lenguas Nativas",
      subtitle: "Habla por el micrófono en Español, Quechua, Aymara o Guaraní. Nuestra IA corregirá la ortografía y calculará el precio de mercado automáticamente."
    },
    {
      icon: "shield-checkmark-outline",
      iconColor: "#10b981",
      iconBg: "#064e3b",
      tag: "SEGURIDAD GARANTIZADA",
      tagBg: "#047857",
      tagColor: "#a7f3d0",
      title: "Técnicos Verificados (KYC)",
      subtitle: "Tranquilidad total para tu hogar. Todos los proveedores escanean su DNI/C.I. y biometría facial antes de ser habilitados."
    },
    {
      icon: "sparkles-outline",
      iconColor: "#f59e0b",
      iconBg: "#78350f",
      tag: "COMUNIDAD TODO YA",
      tagBg: "#92400e",
      tagColor: "#fef08a",
      title: "¡Comienza a Solucionar!",
      subtitle: "Únete a miles de hogares satisfechos. Síguenos en Instagram para ver trucos del hogar, testimonios y ofertas exclusivas."
    }
  ];

  const slides = isBusiness ? businessSlides : naturalSlides;
  const slide = slides[currentSlide];
  const accentColor = isBusiness ? "#6366f1" : "#3b82f6";

  return (
    <Modal visible={internalVisible} transparent animationType="fade">
      <View style={styles.container}>
        {/* Botón Saltar (Skip) */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleFinish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Tag llamativo dinámico */}
          <View style={[styles.badgeTag, { backgroundColor: slide.tagBg }]}>
            <Text style={[styles.badgeTagText, { color: slide.tagColor }]}>{slide.tag}</Text>
          </View>

          {/* Ícono central circular */}
          <View style={[styles.iconCircle, { backgroundColor: slide.iconBg }]}>
            <Ionicons name={slide.icon as any} size={48} color={slide.iconColor} />
          </View>

          {/* Título y Subtítulo */}
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          {/* Caja de Instagram (Solo en el último Slide) */}
          {currentSlide === 4 && (
            <View style={styles.instagramBox}>
              <View style={styles.instaHeader}>
                <Ionicons name="logo-instagram" size={24} color="#e1306c" style={{ marginRight: 8 }} />
                <Text style={styles.instaTitle}>Síguenos en Instagram</Text>
              </View>
              <Text style={styles.instaSubtext}>
                {isBusiness 
                  ? "Casos de éxito corporativo, novedades B2B y actualizaciones exclusivas."
                  : "Obtén consejos del hogar, detrás de escenas y promociones especiales."}
              </Text>
              <TouchableOpacity style={styles.instaBtn} onPress={handleOpenInstagram} activeOpacity={0.8}>
                <Text style={styles.instaBtnText}>Seguir a @todoo__ya</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer: Paginador de Puntos y Botón Siguiente/Comenzar */}
        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot, 
                  currentSlide === index && [styles.dotActive, { backgroundColor: accentColor }]
                ]}
                onPress={() => setCurrentSlide(index)}
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: accentColor }]} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {currentSlide === 4 ? (isBusiness ? "Comenzar en Modo Empresa" : "Comenzar") : "Siguiente"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  badgeTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  instagramBox: {
    width: '100%',
    backgroundColor: '#1f1f23',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  instaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  instaTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  instaSubtext: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 17,
  },
  instaBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(225, 48, 108, 0.08)',
  },
  instaBtnText: {
    color: '#e1306c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    width: '100%',
    gap: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3f3f46',
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nextBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

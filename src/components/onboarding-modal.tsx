import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Storage from '../utils/storage';

const { width } = Dimensions.get('window');

const INSTAGRAM_URL = 'https://www.instagram.com/todoo__ya';

interface OnboardingModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function OnboardingModal({ visible: externalVisible, onClose: externalClose }: OnboardingModalProps) {
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

  const slides = [
    {
      icon: "calendar-outline",
      iconColor: "#3b82f6",
      iconBg: "#1e3a8a",
      title: "¡Bienvenido a Todo Ya!",
      subtitle: "Servicios locales en minutos. Soluciona problemas del hogar y compras corporativas B2B en tiempo real de forma rápida y confiable."
    },
    {
      icon: "radio-outline",
      iconColor: "#22c55e",
      iconBg: "#14532d",
      title: "Radar Inteligente en Vivo",
      subtitle: "Transmite tu necesidad. En menos de 90 segundos los proveedores calificados cercanos responden con presupuestos transparentes y competitivos."
    },
    {
      icon: "school-outline",
      iconColor: "#a855f7",
      iconBg: "#581c87",
      title: "IA Multilingüe e Inclusiva",
      subtitle: "Describe lo que necesitas por texto o voz en Español, Quechua, Aymara o Guaraní. Nuestra IA clasificará y sugerirá tarifas de mercado automáticamente."
    },
    {
      icon: "id-card-outline",
      iconColor: "#10b981",
      iconBg: "#064e3b",
      title: "Seguridad & Verificación KYC",
      subtitle: "Proveedores pre-verificados mediante escaneo de DNI/C.I. y reconocimiento facial. Reseñas y calificaciones transparentes para tu total tranquilidad."
    },
    {
      icon: "shield-checkmark-outline",
      iconColor: "#f59e0b",
      iconBg: "#78350f",
      title: "Comienza Ahora",
      subtitle: "Únete a nuestra comunidad. Síguenos en Instagram para enterarte de promociones, detrás de escenas y soporte técnico personalizado."
    }
  ];

  const slide = slides[currentSlide];

  return (
    <Modal visible={internalVisible} transparent animationType="fade">
      <View style={styles.container}>
        {/* Botón Saltar (Skip) */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleFinish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>

        <View style={styles.content}>
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
                Obtén consejos, detrás de escenas y entérate antes que nadie de nuevas funciones.
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
                style={[styles.dot, currentSlide === index && styles.dotActive]}
                onPress={() => setCurrentSlide(index)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {currentSlide === 4 ? "Comenzar" : "Siguiente"}
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  instagramBox: {
    width: '100%',
    backgroundColor: '#1f1f23',
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
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
    backgroundColor: '#3b82f6',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nextBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#3b82f6',
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

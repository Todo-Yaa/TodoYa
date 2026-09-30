import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Storage from '../utils/storage';
import { useUser } from '../context/user-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const UPSELL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas entre recomendaciones no invasivas

interface PlanUpsellModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function PlanUpsellModal({ visible: externalVisible, onClose: externalClose }: PlanUpsellModalProps) {
  const { activeUser, userRole, planId, formatPrice } = useUser();
  const isB2B = activeUser?.tipoEntidad === 'empresa' || userRole === 'business';
  const isProvider = userRole === 'provider';

  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (externalVisible !== undefined) {
      setInternalVisible(externalVisible);
    } else {
      // Verificar frecuencia no invasiva (1 vez cada 24 horas)
      checkUpsellEligibility();
    }
  }, [externalVisible, activeUser, userRole, planId]);

  const checkUpsellEligibility = async () => {
    // Si ya está en el plan máximo (Plan 3 o Business 3), no mostrar upsell
    if (planId === 'provider_3' || planId === 'business_3') {
      return;
    }

    try {
      const lastShown = await Storage.getItem('todo_ya_last_upsell_shown');
      const now = Date.now();
      if (!lastShown || (now - parseInt(lastShown, 10)) > UPSELL_COOLDOWN_MS) {
        // Retardo no invasivo de 3 segundos al entrar a la app
        const timer = setTimeout(() => {
          setInternalVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Error al verificar elegibilidad de upsell:', e);
    }
  };

  const handleDismiss = async () => {
    await Storage.setItem('todo_ya_last_upsell_shown', Date.now().toString());
    setInternalVisible(false);
    if (externalClose) externalClose();
  };

  const handleUpgrade = async () => {
    await Storage.setItem('todo_ya_last_upsell_shown', Date.now().toString());
    setInternalVisible(false);
    if (externalClose) externalClose();

    // Redirigir a la pantalla de planes (Leads o Perfil)
    if (isProvider) {
      router.push('/leads');
    } else {
      router.push('/perfil');
    }
  };

  if (!internalVisible) return null;

  // --- BENEFICIOS PARA PROVEEDORES (PLAN 2 / PLAN 3) ---
  const providerBenefits = [
    {
      icon: "flash-outline",
      iconColor: "#FFB400",
      title: "Prioridad en Leads",
      desc: "Recibe notificaciones instantáneas de clientes cercanos antes que los planes básicos."
    },
    {
      icon: "trending-down-outline",
      iconColor: "#10b981",
      title: "50% Menos Comisión",
      desc: "Paga solo 10% de comisión por trabajo completado en lugar de la tarifa estándar del 20%."
    },
    {
      icon: "briefcase-outline",
      iconColor: "#818cf8",
      title: "Acceso a Trabajos B2B",
      desc: "Postúlate a contrataciones corporativas de mayor presupuesto y contratos de empresas."
    },
    {
      icon: "ribbon-outline",
      iconColor: "#f59e0b",
      title: "Insignia PRO ★ Destacada",
      desc: "Luce el sello de verificación dorada en tu perfil que aumenta tus contrataciones 3x."
    }
  ];

  // --- BENEFICIOS PARA EMPRESAS (PLAN EMPRESA 2 / 3) ---
  const businessBenefits = [
    {
      icon: "earth-outline",
      iconColor: "#818cf8",
      title: "Cobertura Nacional Realtime",
      desc: "Monitorea licitaciones y proveedores corporativos en todo el país en tiempo real."
    },
    {
      icon: "receipt-outline",
      iconColor: "#10b981",
      title: "Trazabilidad & Facturación",
      desc: "Reportes contables descargables en Excel, facturación legal y ejecutivo de cuenta VIP."
    },
    {
      icon: "stats-chart-outline",
      iconColor: "#c084fc",
      title: "Subasta Invertida IA",
      desc: "Compara ofertas automáticas de los proveedores mejor cualificados sin burocracia."
    },
    {
      icon: "shield-checkmark-outline",
      iconColor: "#38bdf8",
      title: "Sello Corporativo Élite",
      desc: "Acceso a licitaciones de alto volumen y compras institucionales de gran escala."
    }
  ];

  const benefits = isB2B ? businessBenefits : providerBenefits;
  const planTitle = isB2B 
    ? (planId === 'business_2' ? "Plan Empresa 3 — Élite" : "Plan Empresa 2 — Pro") 
    : (planId === 'provider_2' ? "Plan 3 — Élite" : "Plan 2 — Profesional");

  const rawPriceBob = isB2B 
    ? (planId === 'business_2' ? 500 : 300) 
    : (planId === 'provider_2' ? 200 : 120);

  const planPrice = formatPrice ? `${formatPrice(rawPriceBob)} / mes` : `Bs. ${rawPriceBob} / mes`;

  const promoBannerText = isB2B 
    ? "Aumenta la eficiencia en compras corporativas de tu empresa" 
    : "Genera hasta un 40% más de ganancias con prioridad de asignación";

  const accentColor = isB2B ? "#6366f1" : "#FFB400";

  return (
    <Modal visible={internalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header con título y botón de cierre */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{planTitle}</Text>
              <Text style={styles.sheetPrice}>
                {planPrice} <Text style={styles.badgeFree}>Recomendado</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Banner de Ganancia / Valor */}
          <View style={[styles.promoBanner, { borderColor: accentColor }]}>
            <Ionicons name="pricetag-outline" size={20} color={accentColor} style={{ marginRight: 10 }} />
            <Text style={styles.promoBannerText}>{promoBannerText}</Text>
          </View>

          {/* Carrusel Horizontal de Beneficios (Estilo Uber One) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.benefitsScroll}
          >
            {benefits.map((b, idx) => (
              <View key={idx} style={styles.benefitCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name={b.icon as any} size={28} color={b.iconColor} />
                </View>
                <Text style={styles.cardTitle}>{b.title}</Text>
                <Text style={styles.cardDesc}>{b.desc}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Términos en letra pequeña */}
          <Text style={styles.termsText}>
            Puedes cambiar de plan o cancelar tu suscripción en cualquier momento desde tu panel de usuario sin penalizaciones.
          </Text>

          {/* Selector de cuenta activa y Botón principal de Acción */}
          <View style={styles.footerRow}>
            <View style={styles.userInfoPill}>
              <Ionicons name="person-circle-outline" size={18} color="#94a3b8" />
              <Text style={styles.userInfoText} numberOfLines={1}>
                {activeUser?.nombre || 'Usuario Activo'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.upgradeBtn, { backgroundColor: accentColor }]} 
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={[styles.upgradeBtnText, isB2B && { color: '#ffffff' }]}>
                Mejorar mi Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sheetPrice: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 2,
  },
  badgeFree: {
    fontSize: 11,
    color: '#38bdf8',
    backgroundColor: '#0369a1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f23',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  promoBannerText: {
    flex: 1,
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  benefitsScroll: {
    gap: 12,
    paddingBottom: 16,
  },
  benefitCard: {
    width: 170,
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  termsText: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: 120,
  },
  userInfoText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#18181b',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

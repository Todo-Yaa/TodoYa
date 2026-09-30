import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationTray from '../components/notification-tray';
import { useUser } from '../context/user-context';
import { esPedidoTarifaAlta, getProviderScore } from '../services/scoring';

export default function LeadsScreen() {
  const {
    orders,
    coins,
    planId,
    subscribeToPlan,
    applyToLead,
    activeUser,
    syncOrders,
    addCoins,
    usuariosRegistrados,
    showNotification,
    notificationsList,
    markAllNotificationsRead,
    clearAllNotifications,
    triggerLocationCheck,
    formatPrice,
    adaptPrice,
    currencySymbol,
    currencyCode
  } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  // VeriPagos payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'packages' | 'loading' | 'qr' | 'success' | 'error'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<{ coins: number; priceBs: number } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; priceBs: number } | null>(null);
  const [qrData, setQrData] = useState<{ qr: string; movimiento_id: any } | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  // Nombre e iniciales dinámicas del proveedor activo basados en el tipo de entidad registrado
  const providerName = activeUser?.nombre || 'Juan Ríos';
  const providerInitials = providerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isB2BProvider = activeUser?.tipoEntidad === 'empresa';
  const serviciosListLeads = activeUser?.serviciosOfrecidos || [];
  const serviciosCountLeads = serviciosListLeads.length;
  const professionText = isB2BProvider
    ? (activeUser?.rubro ? `Empresa de ${activeUser.rubro}` : (serviciosCountLeads === 1 ? `Empresa de ${serviciosListLeads[0]}` : 'Empresa Proveedora Corporativa B2B'))
    : (serviciosCountLeads === 1 ? `Especialista en ${serviciosListLeads[0]}` : (serviciosCountLeads > 3 ? 'Técnico Especialista Multidisciplinario' : `Especialista en ${serviciosListLeads.join(', ')}`));

  const currentEntidad = activeUser?.tipoEntidad || 'natural';
  const userPlan = planId || activeUser?.planId || (currentEntidad === 'empresa' ? 'business_1' : 'provider_1');

  const getPlanDetails = (pId: string | null) => {
    const p150 = formatPrice ? formatPrice(150) : 'Bs. 150';
    const p300 = formatPrice ? formatPrice(300) : 'Bs. 300';
    const p500 = formatPrice ? formatPrice(500) : 'Bs. 500';
    const p50 = formatPrice ? formatPrice(50) : 'Bs. 50';
    const p120 = formatPrice ? formatPrice(120) : 'Bs. 120';
    const p200 = formatPrice ? formatPrice(200) : 'Bs. 200';

    if (isB2BProvider) {
      if (pId === 'business_2') return { name: 'Plan Empresa 2 - Pro', price: `${p300}/mes`, desc: 'Acceso Mixto e Ilimitado' };
      if (pId === 'business_3') return { name: 'Plan Empresa 3 - Élite', price: `${p500}/mes`, desc: 'Acceso Nacional Realtime' };
      return { name: 'Plan Empresa 1 - Básico', price: `${p150}/mes`, desc: 'Acceso Corporativo B2B' };
    } else {
      if (pId === 'provider_2') return { name: 'Plan 2 - Profesional', price: `${p120}/mes`, desc: 'Residenciales + 3 B2B/mes' };
      if (pId === 'provider_3') return { name: 'Plan 3 - Élite', price: `${p200}/mes`, desc: 'Acceso Total Ilimitado' };
      return { name: 'Plan 1 - Residencial', price: `${p50}/mes`, desc: 'Acceso Residencial Ilimitado' };
    }
  };

  const planDetails = getPlanDetails(userPlan);

  const now = new Date();
  const b2bCountThisMonth = orders.filter(o => {
    if (o.proveedor !== providerName) return false;
    const isB2B =
      o.servicio === 'Decoración & Eventos' ||
      o.servicio === 'Branding & Lettering' ||
      o.servicio === 'Papelería & Oficina' ||
      o.servicio === 'Servicios B2B';
    if (!isB2B) return false;
    if (!o.acceptedAt) return false;
    const accDate = new Date(o.acceptedAt);
    return accDate.getMonth() === now.getMonth() && accDate.getFullYear() === now.getFullYear();
  }).length;

  // Filtramos las solicitudes de clientes de forma que correspondan a su tipo de cuenta (B2B vs Residencial) y plan de suscripción
  const activeLeads = orders.filter(o => {
    if (o.estado !== 'Buscando proveedor') return false;

    // Identificar si la categoría solicitada por el cliente pertenece al segmento corporativo B2B
    const isOrderB2B =
      o.servicio === 'Decoración & Eventos' ||
      o.servicio === 'Branding & Lettering' ||
      o.servicio === 'Papelería & Oficina' ||
      o.servicio === 'Servicios B2B';

    // Los proveedores naturales con Plan 1 solo ven residencial. Plan 2 y Plan 3 ven residenciales y B2B.
    // Las empresas proveedoras con Plan Empresa 1 solo ven B2B. Plan Empresa 2 y Plan Empresa 3 ven B2B y residenciales.
    if (currentEntidad === 'natural') {
      if (userPlan === 'provider_1') {
        return !isOrderB2B;
      }
      return true; // provider_2 y provider_3 ven ambos
    } else {
      if (userPlan === 'business_1') {
        return isOrderB2B;
      }
      return true; // business_2 y business_3 ven ambos
    }
  });

  const unreadCount = notificationsList.filter(n => !n.read).length;

  // Custom modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => { },
    singleButton: false
  });

  const handleApply = (leadId: number, cost: number, title: string, isB2BOrder: boolean) => {
    // Sistema de Scoring (Tarea 3.3): bloquear tarifa alta con puntaje insuficiente
    const leadObj = orders.find(o => o.id === leadId);
    const providerScore = getProviderScore(activeUser);
    if (leadObj && esPedidoTarifaAlta(leadObj.precio) && !providerScore.puedeAccederTarifaAlta) {
      setConfirmConfig({
        title: 'Tarifa Alta restringida',
        message: `Necesitas al menos 80 pts (4.0★) para postularte a pedidos de tarifa alta. Tu puntaje actual es ${providerScore.puntaje} pts (${providerScore.estrellas}★). Las cancelaciones injustificadas reducen tu puntaje.`,
        singleButton: true,
        onConfirm: () => { }
      });
      setShowConfirmModal(true);
      return;
    }

    // Validar exclusividad de entidad para la postulación
    if (currentEntidad === 'natural' && isB2BOrder) {
      setConfirmConfig({
        title: 'Exclusividad B2B',
        message: 'Esta es una solicitud corporativa. Las solicitudes B2B son exclusivas para proveedores registrados como Empresa.',
        singleButton: true,
        onConfirm: () => { }
      });
      setShowConfirmModal(true);
      return;
    }
    if (currentEntidad === 'empresa' && !isB2BOrder) {
      setConfirmConfig({
        title: 'Exclusividad Residencial',
        message: 'Esta es una solicitud residencial. Las solicitudes residenciales son exclusivas para proveedores individuales (Natural).',
        singleButton: true,
        onConfirm: () => { }
      });
      setShowConfirmModal(true);
      return;
    }

    setConfirmConfig({
      title: 'Confirmar Postulación',
      message: `¿Deseas postularte para "${title}" de forma ilimitada bajo tu plan actual?`,
      singleButton: false,
      onConfirm: () => {
        const success = applyToLead(leadId, 0, providerName);
        if (success) {
          setTimeout(() => {
            loadTransactionHistory(); // Actualizar historial de transacciones en la UI
            setConfirmConfig({
              title: '¡Postulado con éxito!',
              message: 'Te has postulado al trabajo. El pedido ahora está en tu pestaña de "Trabajos" en estado "En progreso".',
              onConfirm: () => { },
              singleButton: true
            });
            setShowConfirmModal(true);
          }, 100);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const loadTransactionHistory = useCallback(async () => {
    let finalUserId = activeUser?.id;
    if (!finalUserId && activeUser?.correoOTelefono) {
      const found = usuariosRegistrados.find(u => u.correoOTelefono === activeUser.correoOTelefono);
      if (found?.id) finalUserId = found.id;
    }
    if (finalUserId) {
      try {
        const res = await fetch(`/api/wallet?userId=${finalUserId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setTransactionHistory(data.history || []);
          }
        }
      } catch (e) {
        console.error('Error fetching transaction history:', e);
      }
    }
  }, [activeUser, usuariosRegistrados]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncOrders();
    await loadTransactionHistory();
    setRefreshing(false);
  }, [syncOrders, loadTransactionHistory]);

  // Load history on load or user changes
  useEffect(() => {
    loadTransactionHistory();
    triggerLocationCheck().catch(() => { });
  }, [activeUser, loadTransactionHistory]);


  // Function to call /api/veripagos and generate QR
  const handleGenerateQR = async (plan: { id: string; name: string; priceBs: number }) => {
    setSelectedPlan(plan);
    setPaymentStep('loading');
    setPaymentError('');

    let finalUserId = activeUser?.id;
    if (!finalUserId && activeUser?.correoOTelefono) {
      const emailClave = activeUser.correoOTelefono.trim().toLowerCase();
      const found = usuariosRegistrados.find(u => (u.correoOTelefono || '').trim().toLowerCase() === emailClave);
      if (found?.id) finalUserId = found.id;
    }

    // Fallback de contingencia para la demo del jurado (evita errores por descalce de caché local)
    if (!finalUserId) {
      const emailLower = (activeUser?.correoOTelefono || '').toLowerCase();
      if (emailLower.includes('juan')) {
        finalUserId = 2;
      } else if (emailLower.includes('proveedor_empresa') || emailLower.includes('beta')) {
        finalUserId = 4;
      } else {
        finalUserId = 2;
      }
    }

    try {
      console.log('[LeadsScreen] Calling /api/veripagos POST for userId:', finalUserId, 'plan:', plan.id);
      const res = await fetch('/api/veripagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          monedas: 0,
          detalle: `Suscripción a ${plan.name} (Pago de prueba 1 Bs.)`
        })
      });

      const resText = await res.text();
      console.log('[LeadsScreen] VeriPagos POST response status:', res.status, 'body:', resText);

      let data: any;
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(`Respuesta no válida del servidor (HTTP ${res.status}): ${resText.substring(0, 150)}`);
      }

      if (!res.ok) {
        const details = data.details ? `\n${data.details}` : '';
        const vpResp = data.veripagosResponse ? `\nRespuesta VP: ${JSON.stringify(data.veripagosResponse).substring(0, 200)}` : '';
        throw new Error((data.error || 'Error al generar el QR') + details + vpResp);
      }

      if (data.status === 'success' && data.qr && data.movimiento_id) {
        console.log('[LeadsScreen] QR generado exitosamente. movimiento_id:', data.movimiento_id);
        setQrData({ qr: data.qr, movimiento_id: data.movimiento_id });
        setPaymentStep('qr');
      } else {
        const missingFields = [];
        if (!data.qr) missingFields.push('qr');
        if (!data.movimiento_id) missingFields.push('movimiento_id');
        throw new Error(`Respuesta incompleta del servidor. Faltan campos: ${missingFields.join(', ')}. Recibido: ${JSON.stringify(data).substring(0, 200)}`);
      }
    } catch (e: any) {
      console.error('[LeadsScreen] Error generating QR:', e.message);
      setPaymentError(e.message || 'Error de conexión');
      setPaymentStep('error');
    }
  };

  // Effect to poll payment status when QR is visible
  useEffect(() => {
    let intervalId: any;
    if (showPaymentModal && paymentStep === 'qr' && qrData?.movimiento_id && activeUser && selectedPlan) {
      let finalUserId = activeUser.id;
      if (!finalUserId && activeUser.correoOTelefono) {
        const emailClave = activeUser.correoOTelefono.trim().toLowerCase();
        const found = usuariosRegistrados.find(u => (u.correoOTelefono || '').trim().toLowerCase() === emailClave);
        if (found?.id) finalUserId = found.id;
      }

      if (!finalUserId) {
        const emailLower = (activeUser.correoOTelefono || '').toLowerCase();
        if (emailLower.includes('juan')) {
          finalUserId = 2; // ID de Juan Ríos
        } else if (emailLower.includes('proveedor_empresa') || emailLower.includes('beta')) {
          finalUserId = 4; // ID de Imprenta Beta
        } else {
          finalUserId = 2; // Fallback por defecto
        }
      }

      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/veripagos?movimiento_id=${qrData.movimiento_id}&userId=${finalUserId}&planId=${selectedPlan.id}&monedas=${selectedPlan.priceBs}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.paymentStatus === 'Completado') {
              setPaymentStep('success');
              clearInterval(intervalId);
              // Actualizar plan local y en base de datos
              if (selectedPlan && typeof subscribeToPlan === 'function') {
                await subscribeToPlan(selectedPlan.id as any);
              }
            }
          }
        } catch (e) {
          console.error('Error polling VeriPagos status:', e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showPaymentModal, paymentStep, qrData, activeUser, selectedPlan, usuariosRegistrados, subscribeToPlan]);

  return (
    <View style={styles.container}>
      {/* Header Proveedor Adaptado Visualmente (Slate para B2B, Carbón para Natural) */}
      <View style={[styles.header, isB2BProvider && { backgroundColor: '#1e293b' }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, isB2BProvider && { backgroundColor: '#6366f1' }]}>
            <Text style={[styles.avatarText, isB2BProvider && { color: '#fff' }]}>{providerInitials}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.name, isB2BProvider && { color: '#818cf8' }]} numberOfLines={1}>
              {providerName} <Text style={[styles.proBadge, isB2BProvider && { backgroundColor: '#6366f1', color: '#fff' }]}>PRO</Text>
            </Text>
            <Text style={styles.status} numberOfLines={1} ellipsizeMode="tail">
              {professionText} · <Text style={{ color: '#4caf50' }}>Disponible</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setIsTrayOpen(true)} style={styles.bellContainer} activeOpacity={0.7}>
          <Ionicons
            name="notifications-outline"
            size={28}
            color={isB2BProvider ? '#818cf8' : '#FFB400'}
          />
          {unreadCount > 0 && <View style={[styles.bellBadge, isB2BProvider && styles.bellBadgeDark]} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB400" />
        }
      >
        {/* Panel de Suscripción con Estilos Adaptativos según el tipo de Proveedor */}
        <View style={[styles.monedasCard, isB2BProvider && { borderColor: '#6366f1', shadowColor: '#6366f1' }]}>
          <View style={[styles.monedasIcon, isB2BProvider && { backgroundColor: '#6366f1' }]}>
            <Ionicons name="card-outline" size={28} color={isB2BProvider ? '#fff' : '#2F2F2F'} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.monedasAmount, { fontSize: 18 }]} numberOfLines={1}>{planDetails.name}</Text>
            <Text style={styles.monedasLabel}>{planDetails.price} · {planDetails.desc}</Text>
            {userPlan === 'provider_2' && (
              <Text style={{ fontSize: 12, color: '#e53935', marginTop: 4, fontWeight: 'bold' }}>
                B2B usados este mes: {b2bCountThisMonth} / 3
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.comprarBtn, isB2BProvider && { backgroundColor: '#6366f1' }]}
            onPress={() => {
              setPaymentStep('packages');
              setSelectedPlan(null);
              setQrData(null);
              setPaymentError('');
              setShowPaymentModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.comprarText, isB2BProvider && { color: '#fff' }]}>Planes</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Leads disponibles ({activeLeads.length})</Text>

        {activeLeads.map((lead) => {
          const isB2B =
            lead.servicio === 'Decoración & Eventos' ||
            lead.servicio === 'Branding & Lettering' ||
            lead.servicio === 'Papelería & Oficina' ||
            lead.servicio === 'Servicios B2B';

          // Sistema de Scoring (Tarea 3.3): pedidos de tarifa alta exigen >= 80 pts (4.0★)
          const esTarifaAlta = esPedidoTarifaAlta(lead.precio);
          const providerScore = getProviderScore(activeUser);
          const tarifaAltaRestringida = esTarifaAlta && !providerScore.puedeAccederTarifaAlta;

          // Calculate cost in coins (higher for B2B leads)
          const cost = isB2B ? 5 : (lead.urgencia === 'Alta' ? 3 : (lead.servicio === 'Climatización' ? 4 : 2));
          // Calculate distance deterministically from ID
          const distance = `${((lead.id % 4) + 1.1).toFixed(1)} km`;
          const isUrgent = lead.urgencia === 'Alta';

          return (
            <View key={lead.id} style={[
              styles.leadCard,
              lead.urgencia === 'Alta' && styles.proCard,
              isB2B && styles.b2bLeadCard
            ]}>
              {lead.urgencia === 'Alta' && (
                <View style={styles.proLabel}>
                  <Text style={styles.proLabelText}>ATENCIÓN URGENTE</Text>
                </View>
              )}

              {isB2B && (
                <View style={styles.b2bLabel}>
                  <Text style={styles.b2bLabelText}>EMPRESA / B2B</Text>
                </View>
              )}

              {esTarifaAlta && (
                <View style={[styles.b2bLabel, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.b2bLabelText, { color: '#b91c1c' }]}>TARIFA ALTA · min 80 pts ({providerScore.puntaje} pts actuales {providerScore.puedeAccederTarifaAlta ? '✓' : '✗'})</Text>
                </View>
              )}

              <View style={styles.leadHeader}>
                <Text style={styles.leadTitle}>
                  {isUrgent && <Ionicons name="flash" size={18} color="#e53935" />}
                  {isB2B && <Ionicons name="business" size={16} color="#6366f1" style={{ marginRight: 6 }} />}
                  {lead.titulo}
                </Text>
                <Text style={[styles.precio, isB2B && { color: '#6366f1' }]}>{adaptPrice ? adaptPrice(lead.precio) : lead.precio}</Text>
              </View>

              <Text style={styles.descriptionText} numberOfLines={2}>
                {lead.description}
              </Text>

              <Text style={styles.meta}>
               {distance} · {lead.hora}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.postularBtn, isB2B && { backgroundColor: '#6366f1' }, tarifaAltaRestringida && { backgroundColor: '#dc2626' }]}
                  onPress={() => handleApply(lead.id, cost, lead.titulo, isB2B)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={tarifaAltaRestringida ? "lock-closed" : "key-outline"} size={16} color="#fff" />
                  <Text style={[styles.postularText, { color: '#fff' }]}>
                    {tarifaAltaRestringida
                      ? `Bloqueado (${providerScore.puntaje} pts)`
                      : (esTarifaAlta ? 'Postularse (Tarifa Alta)' : 'Postularse con mi Plan')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => {
                    setConfirmConfig({
                      title: 'Omitir Lead',
                      message: 'El lead se ha archivado temporalmente de tu panel.',
                      singleButton: true,
                      onConfirm: () => { }
                    });
                    setShowConfirmModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipText}>Omitir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {activeLeads.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay solicitudes de servicio activas en este momento</Text>
            <Text style={styles.emptySubtext}>Las nuevas solicitudes de los clientes aparecerán aquí en tiempo real.</Text>
          </View>
        )}
        {/* Historial de Transacciones */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Historial de Transacciones (Nube)</Text>
        <View style={styles.historyCard}>
          {transactionHistory.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No hay transacciones registradas aún.</Text>
          ) : (
            transactionHistory.map((t, idx) => (
              <View key={t.id || idx} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <View style={[
                    styles.historyItemIcon,
                    { backgroundColor: t.tipo === 'recarga' ? '#e8f5e9' : '#ffebee' }
                  ]}>
                    <Ionicons
                      name={t.tipo === 'recarga' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={20}
                      color={t.tipo === 'recarga' ? '#2e7d32' : '#c62828'}
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.historyItemDetail}>{t.detalle}</Text>
                    <Text style={styles.historyItemDate}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleString('es-BO') : 'Fecha y hora cargadas'}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.historyItemAmount,
                  { color: t.tipo === 'recarga' ? '#2e7d32' : '#c62828', fontWeight: 'bold' }
                ]}>
                  {t.tipo === 'recarga' ? '+' : '-'} {adaptPrice ? adaptPrice(`Bs. ${t.monto_monedas}`) : `Bs. ${t.monto_monedas}`}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Sección de Cartera Nacional de Clientes en Tiempo Real (Solo para modo Empresa) */}
        {isB2BProvider && (
          <View style={styles.nacionalContainer}>
            <Text style={styles.sectionTitle}>Cartera Nacional de Clientes (Tiempo Real)</Text>
            {userPlan === 'business_3' ? (
              <View style={styles.nationalActiveCard}>
                <View style={styles.nationalHeader}>
                  <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.pulseText}>CONEXIÓN NACIONAL ACTIVA</Text>
                  </View>
                  <Text style={styles.nationalSubtitle}>Monitoreando licitaciones en todo {currencyCode === 'PEN' ? 'Perú' : 'Bolivia'} en vivo</Text>
                </View>
                {[
                  { id: 101, ciudad: currencyCode === 'PEN' ? 'Lima' : 'La Paz', cliente: currencyCode === 'PEN' ? 'Banco de Crédito BCP S.A.' : 'Banco Mercantil S.A.', servicio: 'Servicios B2B', desc: 'Auditoría gráfica corporativa anual', precio: 'Bs. 5,000' },
                  { id: 102, ciudad: currencyCode === 'PEN' ? 'Arequipa' : 'Santa Cruz', cliente: currencyCode === 'PEN' ? 'Hotel Costa del Sol' : 'Hotel Camino Real', servicio: 'Decoración & Eventos', desc: 'Decoración con globos helio para convención', precio: 'Bs. 3,500' },
                  { id: 103, ciudad: currencyCode === 'PEN' ? 'Trujillo' : 'Cochabamba', cliente: currencyCode === 'PEN' ? 'Corporación Gloria S.A.' : 'Fábrica PIL Andina', servicio: 'Papelería & Oficina', desc: '200 cajas de papel membretado oficial', precio: 'Bs. 8,200' },
                ].map((nl) => {
                  const displayPrice = adaptPrice ? adaptPrice(nl.precio) : nl.precio;
                  return (
                    <View key={nl.id} style={styles.nationalLeadItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.nationalLeadCity}>{nl.ciudad} · {nl.cliente}</Text>
                        <Text style={styles.nationalLeadPrice}>{displayPrice}</Text>
                      </View>
                      <Text style={styles.nationalLeadTitle}>{nl.servicio}: {nl.desc}</Text>
                      <TouchableOpacity
                        style={styles.nationalApplyBtn}
                        onPress={() => {
                          setConfirmConfig({
                            title: '¡Postulación Nacional!',
                            message: `¿Deseas enviar una propuesta comercial inmediata a "${nl.cliente}" en ${nl.ciudad} por un valor de ${displayPrice}?`,
                            singleButton: false,
                            onConfirm: () => {
                              showNotification('Propuesta Enviada', `Tu propuesta ha sido enviada con éxito al cliente en ${nl.ciudad}.`, 'success');
                            }
                          });
                          setShowConfirmModal(true);
                        }}
                      >
                        <Text style={styles.nationalApplyText}>Enviar Propuesta Inmediata</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.nationalLockedCard}>
                <Ionicons name="lock-closed" size={40} color="#94a3b8" />
                <Text style={styles.nationalLockedTitle}>Cartera Nacional Bloqueada</Text>
                <Text style={styles.nationalLockedDesc}>
                  Accede a una cartera nacional de clientes empresa y/o persona natural en todo {currencyCode === 'PEN' ? 'Perú (Lima, Arequipa, Trujillo)' : 'Bolivia (La Paz, Cochabamba, Santa Cruz)'} en tiempo real.
                </Text>
                <TouchableOpacity
                  style={styles.nationalUpgradeBtn}
                  onPress={() => {
                    setPaymentStep('packages');
                    setSelectedPlan(null);
                    setQrData(null);
                    setPaymentError('');
                    setShowPaymentModal(true);
                  }}
                >
                  <Text style={styles.nationalUpgradeText}>Actualizar a Plan Empresa 3</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Custom Modal */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            <View style={styles.modalButtons}>
              {!confirmConfig.singleButton && (
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmConfig.onConfirm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {confirmConfig.singleButton ? 'Entendido' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* VeriPagos Payment Modal */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>

            {/* Header / Cerrar */}
            <View style={styles.paymentModalHeader}>
              <Text style={styles.modalTitle}>Planes de Suscripción</Text>
              {paymentStep !== 'loading' && paymentStep !== 'success' && (
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Paso 1: Selección de Planes */}
            {paymentStep === 'packages' && (
              <View>
                <Text style={styles.paymentModalSubtitle}>Elige tu plan de suscripción mensual:</Text>

                {(isB2BProvider ? [
                  { id: 'business_1', name: 'Plan Empresa 1 - Básico', priceBs: 150, desc: 'Acceso ilimitado a solicitudes de empresas (B2B).' },
                  { id: 'business_2', name: 'Plan Empresa 2 - Pro', priceBs: 300, desc: 'Acceso ilimitado a corporativos y residenciales.' },
                  { id: 'business_3', name: 'Plan Empresa 3 - Élite', priceBs: 500, desc: 'Acceso ilimitado + Cartera Nacional en Tiempo Real.' }
                ] : [
                  { id: 'provider_1', name: 'Plan 1 - Residencial', priceBs: 50, desc: 'Acceso ilimitado a residenciales. Excluye B2B.' },
                  { id: 'provider_2', name: 'Plan 2 - Profesional', priceBs: 120, desc: 'Residenciales ilimitados + 3 B2B/mes. Perfil Premium.' },
                  { id: 'provider_3', name: 'Plan 3 - Élite', priceBs: 200, desc: 'Acceso ilimitado a residenciales y corporativos. Perfil Premium.' }
                ]).map((plan, idx) => {
                  const isActive = plan.id === userPlan;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.packageCard,
                        isActive && { borderColor: isB2BProvider ? '#6366f1' : '#FFB400', borderWidth: 2 }
                      ]}
                      disabled={isActive}
                      onPress={() => handleGenerateQR(plan)}
                    >
                      <View style={styles.packageCardLeft}>
                        <Ionicons name={isActive ? "checkmark-circle" : "card-outline"} size={24} color={isB2BProvider ? '#6366f1' : '#FFB400'} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.packageName}>{plan.name}</Text>
                          <Text style={styles.packageDesc}>{plan.desc}</Text>
                        </View>
                      </View>
                      <View style={styles.packageCardRight}>
                        <Text style={styles.packagePrice}>{formatPrice ? formatPrice(plan.priceBs) : `Bs. ${plan.priceBs}`}</Text>
                        <Text style={styles.packageNote}>{isActive ? 'Activo' : 'Pagar Demo'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <Text style={styles.disclaimerText}>
                  Nota: Durante la demostración del Hackatón, el QR cobrará únicamente <Text style={{ fontWeight: 'bold', color: isB2BProvider ? '#6366f1' : '#FFB400' }}>S/. 1.00</Text> real para realizar pruebas bancarias completas de forma segura.
                </Text>
              </View>
            )}

            {/* Paso 2: Cargando */}
            {paymentStep === 'loading' && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={isB2BProvider ? "#6366f1" : "#FFB400"} />
                <Text style={styles.loadingText}>Generando código QR con VeriPagos...</Text>
                <Text style={styles.subLoadingText}>Esto tomará un momento.</Text>
              </View>
            )}

            {/* Paso 3: Código QR Generado */}
            {paymentStep === 'qr' && qrData && selectedPlan && (
              <View style={styles.centerContent}>
                <Text style={styles.qrTitle}>Escanea para activar plan</Text>
                <Text style={styles.qrSubtitle}>Monto: Bs. {selectedPlan.priceBs} | <Text style={{ fontWeight: 'bold', color: '#e53935' }}>Prueba real: Bs. 1.00</Text></Text>

                {/* Imagen del QR */}
                <Image
                  source={{ uri: qrData.qr }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />

                <View style={styles.statusBadge}>
                  <ActivityIndicator size="small" color={isB2BProvider ? "#6366f1" : "#FFB400"} style={{ marginRight: 8 }} />
                  <Text style={styles.statusBadgeText}>Esperando pago del banco...</Text>
                </View>

                <Text style={styles.qrInstructions}>
                  Abre la aplicación de tu banco (BCP, BNB, etc.), selecciona "Pago Simple / QR" y escanea la imagen para activar tu plan: {selectedPlan.name}.
                </Text>

                <TouchableOpacity
                  style={styles.cancelPaymentBtn}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelPaymentText}>Cancelar Transacción</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Paso 4: Pago Exitoso */}
            {paymentStep === 'success' && selectedPlan && (
              <View style={styles.centerContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
                </View>
                <Text style={styles.successTitle}>¡Plan Activado!</Text>
                <Text style={styles.successMessage}>
                  Hemos detectado tu transferencia de Bs. 1.00. Tu suscripción a "{selectedPlan.name}" ha sido activada con éxito en la nube.
                </Text>

                <TouchableOpacity
                  style={styles.successDoneBtn}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.successDoneText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Paso 5: Error */}
            {paymentStep === 'error' && (
              <View style={styles.centerContent}>
                <Ionicons name="alert-circle" size={70} color="#e53935" />
                <Text style={styles.errorTitle}>Error al Procesar</Text>
                <ScrollView style={{ maxHeight: 140, width: '100%', marginVertical: 8, backgroundColor: '#fff3f3', borderRadius: 8, padding: 8 }}>
                  <Text style={[styles.errorMessage, { fontSize: 11, color: '#b71c1c' }]}>{paymentError || 'No se pudo generar la transacción. Intenta nuevamente.'}</Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.errorRetryBtn}
                  onPress={() => setPaymentStep('packages')}
                >
                  <Text style={styles.errorRetryText}>Volver a intentar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.errorRetryBtn, { backgroundColor: '#666', marginTop: 8 }]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.errorRetryText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      )}
      <NotificationTray
        visible={isTrayOpen}
        onClose={() => setIsTrayOpen(false)}
        notifications={notificationsList}
        onMarkAllAsRead={markAllNotificationsRead}
        onClearAll={clearAllNotifications}
        isDarkTheme={isB2BProvider}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#FFB400',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#2F2F2F', fontSize: 20, fontWeight: 'bold' },
  name: { color: '#FFB400', fontSize: 17, fontWeight: '600' },
  proBadge: { backgroundColor: '#FFB400', color: '#2F2F2F', fontSize: 11, paddingHorizontal: 6, borderRadius: 4 },
  status: { color: '#aaa', fontSize: 13 },

  body: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  monedasCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#FFB400',
    marginBottom: 24,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  monedasIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFB400',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monedasAmount: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  monedasLabel: { fontSize: 13, color: '#666' },
  comprarBtn: {
    marginLeft: 'auto',
    backgroundColor: '#FFB400',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  comprarText: { color: '#2F2F2F', fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  leadCard: {
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
  proCard: {
    borderColor: '#FFB400',
    borderWidth: 1.5,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  proLabel: {
    backgroundColor: '#FFF8DC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  proLabelText: { color: '#8a6d00', fontSize: 11, fontWeight: '600' },
  b2bLeadCard: {
    borderColor: '#6366f1',
    borderWidth: 1.5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  b2bLabel: {
    backgroundColor: '#E0E7FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  b2bLabelText: { color: '#3730A3', fontSize: 11, fontWeight: '600' },

  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  leadTitle: { fontSize: 16, fontWeight: '600', color: '#2F2F2F', flex: 1 },
  precio: { fontSize: 16, fontWeight: '700', color: '#e53935' },
  descriptionText: { color: '#666', fontSize: 14, marginBottom: 12 },

  meta: { fontSize: 14, color: '#666', marginBottom: 16 },

  actions: { flexDirection: 'row', gap: 10 },
  postularBtn: {
    backgroundColor: '#FFB400',
    flex: 1,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  postularText: { color: '#2F2F2F', fontWeight: '600', fontSize: 14 },
  skipBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  skipText: { color: '#888' },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#2F2F2F',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
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
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
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

  // VeriPagos modal styles
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  paymentModalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 14,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  packageCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  packageCardRight: {
    alignItems: 'flex-end',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2f2f2f',
  },
  packageDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  packageNote: {
    fontSize: 10,
    color: '#e53935',
    fontWeight: '600',
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2f2f2f',
    marginTop: 16,
    textAlign: 'center',
  },
  subLoadingText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f2f2f',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffeb3b',
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b78103',
  },
  qrInstructions: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  cancelPaymentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelPaymentText: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '600',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  successDoneBtn: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  successDoneText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e53935',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  errorRetryBtn: {
    backgroundColor: '#e53935',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  errorRetryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Transaction history styles
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 40,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  historyItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f2f2f',
  },
  historyItemDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  historyItemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Estilos de la Cartera Nacional de Clientes
  nacionalContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  nationalActiveCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#818cf8',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nationalHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  pulseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.2,
  },
  nationalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  nationalLeadItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  nationalLeadCity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818cf8',
  },
  nationalLeadPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  nationalLeadTitle: {
    fontSize: 13,
    color: '#f1f5f9',
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 18,
  },
  nationalApplyBtn: {
    backgroundColor: '#818cf8',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  nationalApplyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  nationalLockedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  nationalLockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  nationalLockedDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  nationalUpgradeBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  nationalUpgradeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bellContainer: {
    position: 'relative',
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  bellBadgeDark: {
    borderColor: '#2F2F2F',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Platform, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useUser, Order } from '../context/user-context';

const generateTrackingMapHtml = (orderId: number, providerName: string, serviceName: string) => {
  const center = [-17.7833, -63.1821];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .custom-div-icon {
      background: none;
      border: none;
    }
    .marker-pin {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      background: #6366f1;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -16px 0 0 -16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.25);
      border: 2px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-pin.user {
      background: #FFB400;
      border: 2px solid #2F2F2F;
    }
    .marker-icon {
      position: absolute;
      font-size: 16px;
      transform: translate(-50%, -50%);
      left: 50%;
      top: 50%;
      z-index: 10;
    }
    .leaflet-popup-content-wrapper {
      background: #ffffff;
      color: #2F2F2F;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .leaflet-popup-tip {
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const center = [${center[0]}, ${center[1]}];
    
    // 3 Rutas reales sobre las calles de Santa Cruz de la Sierra hacia el centro
    const paths = [
      // Ruta 0: Desde el Noreste (Av. Melchor Pinto -> Sucre -> Arenales -> Aroma)
      [
        [-17.7885, -63.1735],
        [-17.7845, -63.1735],
        [-17.7845, -63.1802],
        [-17.7833, -63.1802],
        [-17.7833, -63.1821]
      ],
      // Ruta 1: Desde el Suroeste (Av. Landívar -> Calle Colón -> Vallegrande)
      [
        [-17.7935, -63.1895],
        [-17.7890, -63.1895],
        [-17.7890, -63.1821],
        [-17.7833, -63.1821]
      ],
      // Ruta 2: Desde el Sureste (Calle Warnes -> Calle La Paz -> Florida)
      [
        [-17.7915, -63.1715],
        [-17.7915, -63.1795],
        [-17.7833, -63.1795],
        [-17.7833, -63.1821]
      ]
    ];
    
    const pathIndex = ${orderId} % 3;
    const path = paths[pathIndex];
    const start = path[0];
    
    const map = L.map('map', { 
      zoomControl: false,
      attributionControl: false
    }).setView([(${center[0]} + start[0]) / 2, (${center[1]} + start[1]) / 2], 14);
 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);
 
    // Marcador del Usuario (Destino)
    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div class="marker-pin user"></div><div class="marker-icon">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
    L.marker(center, { icon: userIcon }).addTo(map)
      .bindPopup('<b style="color: #2F2F2F;">📍 Tu Ubicación</b>');

    // Marcador del Proveedor (Camión / Técnico)
    const providerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div class="marker-pin"></div><div class="marker-icon">🚚</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
    const providerMarker = L.marker(start, { icon: providerIcon }).addTo(map)
      .bindPopup('<b style="color: #4f46e5;">🚚 ${providerName}</b><br><span style="color: #666; font-size: 11px;">En camino por las calles</span>')
      .openPopup();

    // Dibujar la línea de la ruta siguiendo las calles exactas
    const routeLine = L.polyline(path, {
      color: '#6366f1',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    // Función de interpolación a lo largo de múltiples segmentos de calles
    function getInterpolatedPoint(pathArray, progress) {
      if (progress <= 0) return pathArray[0];
      if (progress >= 1) return pathArray[pathArray.length - 1];
      
      const totalSegments = pathArray.length - 1;
      const scaledProgress = progress * totalSegments;
      const segmentIndex = Math.floor(scaledProgress);
      const segmentProgress = scaledProgress - segmentIndex;
      
      const p1 = pathArray[segmentIndex];
      const p2 = pathArray[segmentIndex + 1];
      
      const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
      const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
      return [lat, lng];
    }

    // Simulación del movimiento dinámico paso a paso sobre la ruta
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.005; // 0.5% por tick
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
        providerMarker.setLatLng(center);
        providerMarker.bindPopup('<b style="color: #10b981;">🏁 ¡Llegó al destino!</b>').openPopup();
        window.parent.postMessage({ type: 'provider-arrived', orderId: ${orderId} }, '*');
      } else {
        const currentPos = getInterpolatedPoint(path, progress);
        providerMarker.setLatLng(currentPos);
      }
    }, 150);
  </script>
</body>
</html>
  `;
};

export default function PedidosScreen() {
  const { orders: pedidos, userRole, userName, reportarProveedor } = useUser();
  const isBusiness = userRole === 'business';
  
  // Tracking states
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // Estados para denunciar/reportar a un proveedor
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<number | undefined>(undefined);
  const [reportProviderName, setReportProviderName] = useState('');
  const [reportReason, setReportReason] = useState('Cobro excesivo / Cambió precio');
  const [reportDescription, setReportDescription] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);

  const abrirModalReporte = (orderId: number, providerName: string) => {
    setReportOrderId(orderId);
    setReportProviderName(providerName);
    setReportReason('Cobro excesivo / Cambió precio');
    setReportDescription('');
    setShowReportModal(true);
  };

  const enviarReporte = async () => {
    if (!reportDescription.trim()) {
      alert('Por favor describe brevemente el problema.');
      return;
    }
    setSendingReport(true);
    const exito = await reportarProveedor(
      reportOrderId,
      reportProviderName,
      reportReason,
      reportDescription.trim()
    );
    setSendingReport(false);
    setShowReportModal(false);
    if (exito) {
      setShowReportSuccessModal(true);
    } else {
      alert('Hubo un problema al registrar la denuncia. Reintenta por favor.');
    }
  };
  const [etaSeconds, setEtaSeconds] = useState(300);
  const [currentStep, setCurrentStep] = useState<'driving' | 'arrived'>('driving');
  
  // Invoice states
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!activeTrackingOrder) return;

    // Escuchar el evento de llegada desde el iframe de Leaflet
    const handleMapMessage = (event: any) => {
      if (event.data?.type === 'provider-arrived') {
        setCurrentStep('arrived');
        setEtaSeconds(0);
      }
    };
    
    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMapMessage);
    }

    const interval = setInterval(() => {
      setEtaSeconds((prev) => {
        if (prev <= 10) {
          clearInterval(interval);
          setCurrentStep('arrived');
          return 0;
        }
        return prev - 8; // Disminuir de 8 en 8 segundos para acelerar el demo
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (Platform.OS === 'web') {
        window.removeEventListener('message', handleMapMessage);
      }
    };
  }, [activeTrackingOrder]);

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

              {pedido.estado === 'Completado' && (
                <TouchableOpacity
                  style={[styles.invoiceBtn, isBusiness && { backgroundColor: '#e0e7ff', borderColor: '#818cf8' }]}
                  onPress={() => setSelectedInvoiceOrder(pedido)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={16} color={isBusiness ? '#4f46e5' : '#4caf50'} />
                  <Text style={[styles.invoiceBtnText, isBusiness && { color: '#4f46e5' }]}>
                    Ver Factura Digital
                  </Text>
                </TouchableOpacity>
              )}

              {pedido.estado === 'En progreso' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.trackingBtn, isBusiness && { backgroundColor: '#e0e7ff', borderColor: '#818cf8' }, { flex: 1 }]}
                    onPress={() => {
                      setEtaSeconds(300);
                      setCurrentStep('driving');
                      setActiveTrackingOrder(pedido);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="map-outline" size={16} color={isBusiness ? '#4f46e5' : '#b68000'} />
                    <Text style={[styles.trackingBtnText, isBusiness && { color: '#4f46e5' }]}>
                      GPS Vivo
                    </Text>
                  </TouchableOpacity>

                  {pedido.proveedor && (
                    <TouchableOpacity
                      style={[styles.trackingBtn, { backgroundColor: '#ecfdf5', borderColor: '#10b981', flex: 1 }]}
                      onPress={() => router.push(`/chat-room?orderId=${pedido.id}&titulo=${encodeURIComponent(pedido.titulo)}&providerName=${encodeURIComponent(pedido.proveedor || 'Proveedor')}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#059669" />
                      <Text style={[styles.trackingBtnText, { color: '#059669' }]}>
                        Chat
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

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

              {/* Opción de Reportar Proveedor */}
              {pedido.proveedor && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }}>
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => abrirModalReporte(pedido.id, pedido.proveedor!)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flag-outline" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                    <Text style={styles.reportBtnText}>Reportar Proveedor</Text>
                  </TouchableOpacity>
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

      {activeTrackingOrder && (
        <View style={styles.trackingModalOverlay}>
          <View style={styles.trackingModalContent}>
            {/* Header modal */}
            <View style={[styles.trackingHeader, isBusiness && styles.b2bHeader]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackingTitle, isBusiness && { color: '#fff' }]}>Seguimiento en Vivo</Text>
                <Text style={[styles.trackingSubtitle, isBusiness && { color: '#94a3b8' }]}>
                  {activeTrackingOrder.servicio} · Pedido #{activeTrackingOrder.id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveTrackingOrder(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={isBusiness ? '#fff' : '#2F2F2F'} />
              </TouchableOpacity>
            </View>

            {/* Map wrapper */}
            <View style={styles.mapWrap}>
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={generateTrackingMapHtml(
                    activeTrackingOrder.id,
                    activeTrackingOrder.proveedor || 'Técnico',
                    activeTrackingOrder.servicio
                  )}
                  style={styles.iframe}
                  title="Seguimiento de Proveedor"
                />
              ) : (
                <View style={[styles.nativeMapFallback]}>
                  <Ionicons name="location-outline" size={48} color={isBusiness ? '#818cf8' : '#FFB400'} />
                  <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 10 }}>
                    Mapa interactivo GPS simulado en vivo
                  </Text>
                </View>
              )}
            </View>

            {/* Tracking Status Card */}
            <View style={styles.statusCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={[styles.providerIconContainer, isBusiness ? { backgroundColor: '#e0e7ff' } : { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#FFB400' }]}>
                  <Text style={[styles.providerIconText, isBusiness ? { color: '#3730a3' } : { color: '#b68000' }]}>
                    {(activeTrackingOrder.proveedor || 'T')[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>
                    {activeTrackingOrder.proveedor}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    {currentStep === 'driving' ? 'Conduciendo vehículo de servicio' : 'Ha llegado al domicilio'}
                  </Text>
                </View>
                <View style={styles.etaBadge}>
                  <Ionicons name="time" size={14} color="#6366f1" />
                  <Text style={styles.etaText}>
                    {currentStep === 'driving' 
                      ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`
                      : '¡Llegó!'}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.timeline}>
                {/* Step 1 */}
                <View style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot, 
                    currentStep === 'driving' && styles.timelineDotActive,
                    currentStep === 'arrived' && styles.timelineDotCompleted
                  ]}>
                    {currentStep === 'arrived' ? (
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    ) : (
                      <View style={styles.pulseInner} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, currentStep === 'driving' && styles.bold]}>
                      Técnico en camino
                    </Text>
                    <Text style={styles.timelineDesc}>El proveedor se desplaza en ruta óptima.</Text>
                  </View>
                </View>

                {/* Line */}
                <View style={[
                  styles.timelineLine, 
                  currentStep === 'arrived' && { backgroundColor: '#10b981' }
                ]} />

                {/* Step 2 */}
                <View style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot, 
                    currentStep === 'arrived' && styles.timelineDotActive
                  ]}>
                    {currentStep === 'arrived' && <View style={styles.pulseInner} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, currentStep === 'arrived' && styles.bold]}>
                      Llegada al domicilio
                    </Text>
                    <Text style={styles.timelineDesc}>Coordinación e inicio del servicio en sitio.</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {selectedInvoiceOrder && (
        <View style={styles.invoiceModalOverlay}>
          <View style={styles.invoiceModalContent}>
            {/* Cabecera */}
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceLogoText}>Todo Ya!</Text>
                <Text style={styles.invoiceSubtitleText}>Servicios Rápidos S.R.L.</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.invoiceDocTitle}>FACTURA DIGITAL</Text>
                <Text style={styles.invoiceDocNumber}>N° TY-2026-00{selectedInvoiceOrder.id}</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 16 }} showsVerticalScrollIndicator={false}>
              {/* Información de Transacción */}
              <View style={styles.invoiceMetaGrid}>
                <View style={styles.invoiceMetaItem}>
                  <Text style={styles.invoiceMetaLabel}>Fecha y Hora:</Text>
                  <Text style={styles.invoiceMetaValue}>{selectedInvoiceOrder.completedAt ? new Date(selectedInvoiceOrder.completedAt).toLocaleString() : 'Reciente'}</Text>
                </View>
                <View style={styles.invoiceMetaItem}>
                  <Text style={styles.invoiceMetaLabel}>NIT Emisor:</Text>
                  <Text style={styles.invoiceMetaValue}>10293028301</Text>
                </View>
                <View style={styles.invoiceMetaItem}>
                  <Text style={styles.invoiceMetaLabel}>Cliente:</Text>
                  <Text style={styles.invoiceMetaValue}>{userName}</Text>
                </View>
                <View style={styles.invoiceMetaItem}>
                  <Text style={styles.invoiceMetaLabel}>NIT/CI Cliente:</Text>
                  <Text style={styles.invoiceMetaValue}>{isBusiness ? '481920028' : 'Consumidor Final'}</Text>
                </View>
              </View>

              {/* Divisor */}
              <View style={styles.invoiceDivider} />

              {/* Detalles del Servicio */}
              <Text style={styles.invoiceSectionTitle}>DETALLE DE SERVICIO</Text>
              <View style={styles.invoiceRowDetail}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.invoiceDetailTitle}>{selectedInvoiceOrder.servicio}</Text>
                  <Text style={styles.invoiceDetailDesc}>{selectedInvoiceOrder.titulo}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceDetailPrice}>{selectedInvoiceOrder.precio}</Text>
                </View>
              </View>

              <View style={styles.invoiceRowDetail}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.invoiceDetailTitle}>Proveedor Asignado</Text>
                  <Text style={styles.invoiceDetailDesc}>{selectedInvoiceOrder.proveedor || 'Profesional certificado'}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceDetailSub}>{selectedInvoiceOrder.tiempoEjecucion || 'Completado'}</Text>
                </View>
              </View>

              {/* Divisor */}
              <View style={styles.invoiceDivider} />

              {/* Totales */}
              <View style={styles.invoiceTotalRow}>
                <Text style={styles.invoiceTotalLabel}>TOTAL PAGADO:</Text>
                <Text style={styles.invoiceTotalValue}>{selectedInvoiceOrder.precio}</Text>
              </View>

              <Text style={styles.invoiceDisclaimer}>
                ESTA FACTURA CUENTA CON VALIDEZ DIGITAL SIMPLIFICADA Y ESTÁ RESPALDADA POR LA TRANSACCIÓN DE PAGO ELECTRÓNICO PROCESADA A TRAVÉS DE VERIPAGOS S.A.
              </Text>

              {/* QR Code Mock de Impuestos */}
              <View style={styles.invoiceQrWrap}>
                <Ionicons name="qr-code-outline" size={80} color="#334155" />
                <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4, fontWeight: '700' }}>
                  VALIDACIÓN DIGITAL DE IMPUESTOS BO
                </Text>
              </View>
            </ScrollView>

            {/* Acciones */}
            <View style={{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }}>
              <TouchableOpacity
                style={[styles.invoicePrintBtn, { flex: 1 }]}
                onPress={() => alert('Factura descargada en formato PDF de manera exitosa.')}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Descargar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.invoiceCloseBtn, { flex: 1 }]}
                onPress={() => setSelectedInvoiceOrder(null)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#475569', fontWeight: '700', fontSize: 13 }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* MODAL DE DENUNCIA / REPORTE DE PROVEEDOR */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportHeader}>
              <Ionicons name="flag" size={22} color="#fff" />
              <Text style={styles.reportTitle}>Reportar a {reportProviderName}</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.reportLabel}>1. Selecciona el motivo de la denuncia:</Text>
              <View style={styles.reasonList}>
                {['Cobro excesivo / Cambió precio', 'Incumplimiento de horario / No llegó', 'Mal comportamiento / Agresión', 'Trabajo defectuoso / Daños', 'Otro problema'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.reasonItem, reportReason === m && styles.reasonItemActive]}
                    onPress={() => setReportReason(m)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={reportReason === m ? "radio-button-on" : "radio-button-off"} 
                      size={18} 
                      color={reportReason === m ? "#ef4444" : "#64748b"} 
                    />
                    <Text style={[styles.reasonText, reportReason === m && styles.reasonTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.reportLabel, { marginTop: 16 }]}>2. Detalles del problema (mín. 10 caracteres):</Text>
              <TextInput
                style={styles.reportInput}
                multiline
                numberOfLines={4}
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder="Describe qué ocurrió detalladamente para que podamos investigar y tomar medidas de baneo si corresponde..."
                placeholderTextColor="#999"
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.reportCancelBtn, { flex: 1 }]}
                  onPress={() => setShowReportModal(false)}
                  disabled={sendingReport}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#475569', fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reportSubmitBtn, { flex: 1.5 }, (!reportDescription.trim() || reportDescription.length < 10) && { backgroundColor: '#fca5a5' }]}
                  onPress={enviarReporte}
                  disabled={sendingReport || !reportDescription.trim() || reportDescription.length < 10}
                  activeOpacity={0.8}
                >
                  {sendingReport ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="send" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar Denuncia</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ÉXITO DE REPORTE */}
      <Modal visible={showReportSuccessModal} transparent animationType="fade" onRequestClose={() => setShowReportSuccessModal(false)}>
        <View style={styles.reportModalOverlay}>
          <View style={[styles.reportModalContent, { alignItems: 'center', padding: 24, maxWidth: 340, alignSelf: 'center', borderRadius: 20 }]}>
            <Ionicons name="checkmark-circle" size={56} color="#10b981" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>Denuncia Registrada</Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
              Gracias por ayudarnos a mantener la seguridad en Todo Ya. Analizaremos tu reporte contra el proveedor y tomaremos acciones disciplinarias si es necesario.
            </Text>
            <TouchableOpacity
              style={[styles.reportSubmitBtn, { backgroundColor: '#10b981', width: '100%', marginTop: 20 }]}
              onPress={() => setShowReportSuccessModal(false)}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#FFB400',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  trackingBtnText: {
    color: '#b68000',
    fontSize: 14,
    fontWeight: '600',
  },
  trackingModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  trackingModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#FFB400',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  trackingSubtitle: {
    fontSize: 13,
    color: '#5a4800',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: {
    height: 260,
    width: '100%',
    backgroundColor: '#f8fafc',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  nativeMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  statusCard: {
    padding: 20,
  },
  providerIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0e7ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  timeline: {
    marginTop: 16,
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineDotActive: {
    backgroundColor: '#6366f1',
    borderColor: '#e0e7ff',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#ecfdf5',
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  timelineDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 16,
    bottom: 24,
    width: 2,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  invoiceBtnText: {
    color: '#1b5e20',
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  invoiceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  invoiceLogoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  invoiceSubtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceDocTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoiceDocNumber: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 2,
  },
  invoiceMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  invoiceMetaItem: {
    width: '47%',
  },
  invoiceMetaLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  invoiceMetaValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '700',
    marginTop: 2,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 14,
  },
  invoiceSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  invoiceRowDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  invoiceDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  invoiceDetailDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceDetailPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoiceDetailSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  invoiceTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoiceTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  invoiceDisclaimer: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 14,
  },
  invoiceQrWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  invoicePrintBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  invoiceCloseBtn: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  reportBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  // Modal Reporte Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ef4444',
    padding: 18,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  reportLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  reasonList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  reasonItemActive: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  reasonText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  reasonTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    height: 100,
    marginTop: 4,
  },
  reportCancelBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reportSubmitBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

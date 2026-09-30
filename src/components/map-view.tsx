import { Platform, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useUser } from '../context/user-context';

// Importación dinámica de react-native-maps en nativo para evitar crasheos en web
let MapViewNative: any = null;
let MarkerNative: any = null;
let CircleNative: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapViewNative = RNMaps.default;
    MarkerNative = RNMaps.Marker;
    CircleNative = RNMaps.Circle;
  } catch (e) {
    console.warn('No se pudo cargar react-native-maps:', e);
  }
}

export interface MapProvider {
  name: string;
  lat: number;
  lng: number;
  service: string;
  rating: string;
  price: string;
}

interface MapViewProps {
  providersList?: MapProvider[];
}

const defaultProviders: MapProvider[] = [
  { name: "Juan Ríos", lat: -17.7725, lng: -63.1930, service: "Plomero 🔧", rating: "4.9 ★", price: "Bs. 80" },
  { name: "Carlos Mamani", lat: -17.7950, lng: -63.1650, service: "Electricista ⚡", rating: "4.7 ★", price: "Bs. 60" },
  { name: "María López", lat: -17.7610, lng: -63.1720, service: "Pintora 🎨", rating: "4.8 ★", price: "Bs. 120" },
  { name: "Andrés Silva", lat: -17.7890, lng: -63.2050, service: "AC / Aire ❄️", rating: "4.9 ★", price: "Bs. 150" }
];

const generateMapHtml = (providers: MapProvider[], center: { lat: number; lng: number }) => {
  const markersScript = providers.map(p => {
    let emoji = "🔧";
    const serviceLower = p.service.toLowerCase();
    if (serviceLower.includes("electr")) emoji = "⚡";
    else if (serviceLower.includes("pint")) emoji = "🎨";
    else if (serviceLower.includes("clima") || serviceLower.includes("aire") || serviceLower.includes("ac")) emoji = "❄️";
    else if (serviceLower.includes("papel")) emoji = "📄";
    else if (serviceLower.includes("brand") || serviceLower.includes("letter") || serviceLower.includes("litering") || serviceLower.includes("letrero")) emoji = "✍️";
    else if (serviceLower.includes("decor") || serviceLower.includes("evento")) emoji = "🎈";
    else if (serviceLower.includes("insumo") || serviceLower.includes("servicio") || serviceLower.includes("b2b")) emoji = "🏢";

    return `
      (function() {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div class="marker-pin"></div><div class="marker-icon">${emoji}</div>',
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          popupAnchor: [0, -36]
        });

        L.marker([${p.lat}, ${p.lng}], { icon: customIcon }).addTo(map)
          .bindPopup(\`
            <div style="font-family: sans-serif; font-size: 13px; min-width: 130px;">
              <b style="font-size: 14px; color: #2F2F2F;">${p.name}</b><br>
              <span style="color: #555;">${p.service}</span><br>
              <span style="color: #FFD400; font-weight: bold;">${p.rating}</span> · <span style="color: #666;">${p.price}</span><br>
              <span style="color: #4caf50; font-size: 11px; font-weight: bold;">Disponible ahora</span>
            </div>
          \`);
      })();
    `;
  }).join("\n");

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
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #FFB400;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -14px 0 0 -14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      border: 2px solid #2F2F2F;
    }
    .marker-icon {
      position: absolute;
      font-size: 14px;
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
    const center = [${center.lat}, ${center.lng}];
    
    const map = L.map('map', { 
      zoomControl: false,
      attributionControl: false
    }).setView(center, 13);
 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
 
    const userMarker = L.marker(center).addTo(map)
      .bindPopup('<b style="font-size: 14px; color: #2F2F2F;">📍 Tu ubicación</b><br><span style="color: #666; font-size: 12px;">Coordenadas reales por GPS</span>')
      .openPopup();
 
    const circle = L.circle(center, {
      color: '#FFB400',
      fillColor: '#FFB400',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5',
      radius: 5000
    }).addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        if (pos && pos.coords) {
          const realLat = pos.coords.latitude;
          const realLng = pos.coords.longitude;
          const realCenter = [realLat, realLng];
          map.setView(realCenter, 14);
          userMarker.setLatLng(realCenter);
          circle.setLatLng(realCenter);
        }
      }, function(err) {
        console.log('GPS positioning fallback:', err);
      }, { enableHighAccuracy: true, timeout: 8000 });
    }

    ${markersScript}
  </script>
</body>
</html>
  `;
};

export default function MapView({ providersList }: MapViewProps) {
  const { adaptPrice, lastKnownCity } = useUser();
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          if (loc?.coords?.latitude && loc?.coords?.longitude) {
            setGpsLocation({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude
            });
          }
        }
      } catch (err) {
        console.warn('[MapView] Error al obtener GPS en tiempo real:', err);
      }
    })();
  }, []);

  const getCityCenter = () => {
    const cityLower = (lastKnownCity || '').toLowerCase();
    if (cityLower.includes('arequipa')) {
      return { lat: -16.4090, lng: -71.5375 };
    }
    if (cityLower.includes('lima') || cityLower.includes('callao') || cityLower.includes('peru') || cityLower.includes('perú')) {
      return { lat: -12.0464, lng: -77.0428 };
    }
    return { lat: -17.7833, lng: -63.1821 }; // Santa Cruz de la Sierra
  };

  const center = gpsLocation || getCityCenter();

  const getDynamicDefaultProviders = (centerCoords: { lat: number; lng: number }): MapProvider[] => [
    { name: "Juan Ríos", lat: centerCoords.lat + 0.008, lng: centerCoords.lng - 0.009, service: "Plomero 🔧", rating: "4.9 ★", price: "Bs. 80" },
    { name: "Carlos Mamani", lat: centerCoords.lat - 0.011, lng: centerCoords.lng + 0.014, service: "Electricista ⚡", rating: "4.7 ★", price: "Bs. 60" },
    { name: "María López", lat: centerCoords.lat + 0.015, lng: centerCoords.lng + 0.008, service: "Pintora 🎨", rating: "4.8 ★", price: "Bs. 120" },
    { name: "Andrés Silva", lat: centerCoords.lat - 0.006, lng: centerCoords.lng - 0.018, service: "AC / Aire ❄️", rating: "4.9 ★", price: "Bs. 150" }
  ];

  const rawList = providersList || getDynamicDefaultProviders(center);
  const activeList = rawList.map(p => ({
    ...p,
    price: adaptPrice ? adaptPrice(p.price) : p.price
  }));

  if (Platform.OS === ('web' as any)) {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={generateMapHtml(activeList, center)}
          style={styles.iframe}
          title="Mapa de Proveedores"
          allow="geolocation"
        />
      </View>
    );
  }

  // Renderizar react-native-maps en nativo si está cargado
  if (Platform.OS !== ('web' as any) && MapViewNative) {
    return (
      <View style={styles.container}>
        <MapViewNative
          style={styles.map}
          initialRegion={{
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {/* Marcador del cliente/usuario */}
          <MarkerNative
            coordinate={{ latitude: center.lat, longitude: center.lng }}
            title="📍 Tu ubicación"
            description="Ubicación GPS en tiempo real"
            pinColor="#FFB400"
          />

          {/* Radio de cobertura de 5 km */}
          <CircleNative
            center={{ latitude: center.lat, longitude: center.lng }}
            radius={5000}
            strokeWidth={2}
            strokeColor="#FFB400"
            fillColor="rgba(255, 180, 0, 0.12)"
          />

          {/* Renderizar proveedores en el mapa nativo */}
          {activeList.map((p, idx) => (
            <MarkerNative
              key={idx}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              title={p.name}
              description={`${p.service} · ${p.rating} · ${p.price}`}
            />
          ))}
        </MapViewNative>
      </View>
    );
  }

  // Fallback nativo: simula un radar para evitar crasheos si la librería fallara
  return (
    <View style={[styles.container, styles.nativeFallback]}>
      <Text style={styles.fallbackTitle}>🗺️ Mapa de Proveedores Cercanos</Text>
      <Text style={styles.fallbackSubtitle}>Buscando en un radio de 5.0 km</Text>
      <View style={styles.radarCircle}>
        <View style={styles.radarPing} />
      </View>
      <Text style={styles.fallbackFooter}>{activeList.length} proveedores disponibles a tu alrededor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  map: {
    width: '100%',
    height: '100%',
  },
  nativeFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fffde7',
    borderWidth: 2,
    borderColor: '#ffb400ff',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 4,
  },
  fallbackSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  radarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFB400',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  radarPing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2F2F2F',
  },
  fallbackFooter: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});

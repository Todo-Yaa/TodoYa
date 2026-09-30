import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import Storage from '../utils/storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { uploadImage } from '../utils/image-uploader';
import { esPedidoTarifaAlta, getProviderScore } from '../services/scoring';
import { getCurrencyConfig, formatPriceForLocation, adaptPriceText } from '../utils/currency-utils';

// Definición de roles de usuario disponibles: cliente, proveedor o empresa (B2B)
export type UserRole = 'client' | 'provider' | 'business';

// Representación de un usuario registrado en la aplicación (en español)
export interface UsuarioRegistrado {
  id?: number;
  nombre: string;
  correoOTelefono: string;
  rol: UserRole;
  contrasena?: string;
  tipoProveedor: 'google' | 'linkedin' | 'normal';
  tipoEntidad: 'natural' | 'empresa';
  nit?: string;
  correoFacturacion?: string;
  rubro?: string;
  ofreceB2B?: boolean;
  proveedorConfigurado?: boolean;
  serviciosOfrecidos?: string[];
  anosExperiencia?: string;
  descripcionProveedor?: string;
  coberturaB2B?: string;
  planId?: 'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3' | null;
  monedas?: number;
  celular?: string;
  codigoPais?: string;
  kycVerificado?: boolean;
  kycDetalles?: string;
  baneado?: boolean;
  fotoPerfil?: string | null;
  fechaUltimaModificacionFoto?: string | null;
  fechaUltimaModificacionDatos?: string | null;
  b2bTrialStartDate?: string | Date | null;
  createdAt?: string | Date | null;
  // Sistema de Scoring (Tarea 3.3): 100 pts = 5.0★. Cada cancelación injustificada resta 10 pts.
  puntaje?: number;
  cancelacionesInjustificadas?: number;
  fechaUltimaPenalizacion?: string | Date | null;
}

// Interfaz para representar un pedido dentro de la aplicación
export interface Order {
  id: number;
  titulo: string;
  proveedor: string | null; // Nombre del proveedor asignado (null si está buscando)
  servicio: string;        // Categoría (Plomería, Electricidad, etc.)
  description: string;     // Detalle del problema
  estado: 'Buscando proveedor' | 'En progreso' | 'Completado' | 'Cancelado';
  progreso: number;        // Porcentaje visual (25%, 65%, 100%)
  hora: string;            // Fecha o indicador de tiempo del pedido
  color: string;           // Color del tag según el estado
  precio: string;          // Rango de precio estimado
  urgencia: string;        // Nivel de prioridad
  calificado?: boolean;
  calificacionEstrellas?: number;
  calificacionEtiquetas?: string[];
  acceptedAt?: Date | string | null;
  completedAt?: Date | string | null;
  tiempoEjecucion?: string | null;
}

// Estructura del Contexto Global del Usuario (en español)
interface UserContextType {
  userRole: UserRole;      // Rol actual ('client', 'provider' o 'business')
  toggleRole: () => void;  // Cambia rápidamente entre cliente y proveedor
  setRole: (role: UserRole) => void; // Define un rol específico
  coins: number;           // Monedas del proveedor (usadas para postularse)
  planId: 'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3' | null;
  subscribeToPlan: (planId: 'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3') => Promise<boolean>;
  orders: Order[];         // Lista global de pedidos (compartida localmente)
  addOrder: (titulo: string, servicio: string, description: string, precio: string, urgencia: string, proveedor?: string | null) => void; // Crea un pedido
  applyToLead: (orderId: number, coinsCost: number, providerName: string) => boolean; // Aplica a un trabajo (descuenta monedas)
  completeJob: (orderId: number) => void; // Finaliza un trabajo
  cancelOrder: (orderId: number, justificada: boolean, motivo?: string) => boolean; // Cancela un trabajo y penaliza el scoring
  resetData: () => void;   // Resetea todos los estados al valor inicial
  isAuthenticated: boolean; // Estado de sesión del usuario
  userName: string;        // Nombre personalizado del usuario activo
  login: (correoOTelefono: string, contrasena: string, forceRole?: UserRole) => Promise<boolean>; // Inicia sesión
  logout: () => void;      // Cierra sesión y limpia la memoria
  deleteAccount: () => Promise<boolean>; // Elimina la cuenta permanentemente
  usuariosRegistrados: UsuarioRegistrado[]; // Lista de todos los usuarios de la base de datos local
  registrarEIniciarSesion: (nombre: string, correoOTelefono: string, rol: UserRole, tipoProveedor: 'google' | 'linkedin' | 'normal', extraData?: Partial<UsuarioRegistrado>) => Promise<void>; // Registro social
  registrarUsuario: (nombre: string, correoOTelefono: string, rol: UserRole, contrasena: string, tipoEntidad?: 'natural' | 'empresa', nit?: string, correoFacturacion?: string, rubro?: string, ofreceB2B?: boolean, celular?: string, codigoPais?: string) => Promise<boolean>; // Registro manual
  activeUser: UsuarioRegistrado | null; // Usuario activo logueado
  configurarProveedor: (servicios: string[], experiencia: string, descripcion: string, cobertura?: string) => Promise<void>;
  actualizarKyc: (kycVerificado: boolean, kycDetalles: string) => Promise<void>;
  rateOrder: (orderId: number, estrellas: number, etiquetas: string[]) => void;
  isSwitchingRole: boolean; // Indica si se está realizando una transición de rol
  syncOrders: () => Promise<void>; // Fuerza la sincronización de pedidos con la DB
  addCoins: (amount: number, detail: string) => Promise<void>; // Agrega o quita monedas en DB
  notification: { title: string; message: string; type: 'info' | 'success' | 'warning' } | null;
  showNotification: (title: string, message: string, type: 'info' | 'success' | 'warning') => void;
  clearNotification: () => void;
  isDbOnline: boolean;       // ¿Está conectado a Neon?
  isSyncing: boolean;        // ¿Sincronizando datos offline → Neon?
  triggerSync: () => Promise<void>; // Fuerza sincronización manual
  notificationsList: any[];
  activeToast: any | null;
  addTrayNotification: (title: string, message: string, type: 'chat' | 'application' | 'system' | 'wallet') => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
  dismissToast: () => void;
  reportarProveedor: (pedidoId: number | undefined, reportadoNombre: string, motivo: string, descripcion: string) => Promise<boolean>;
  banearProveedor: (correoOTelefono: string, baneado: boolean) => Promise<boolean>;
  lastKnownCity: string | null;
  setLastKnownCity: (city: string | null) => void;
  detectedCity: string | null;
  detectedCountry: string | null;
  currencySymbol: string;
  currencyCode: string;
  currencyName: string;
  formatPrice: (baseAmountBob: number, prefix?: string) => string;
  adaptPrice: (text: string) => string;
  showLocationChangeModal: boolean;
  locationChangeFrom: string | null;
  locationChangeTo: string | null;
  triggerLocationCheck: (forceShow?: boolean) => Promise<void>;
  confirmCityChange: () => void;
  declineCityChange: () => void;
  simulationState: 'client' | 'provider' | null;
  simulationStep: number;
  setSimulationStep: (step: number) => void;
  startClientSimulation: () => Promise<void>;
  startProviderSimulation: () => Promise<void>;
  nextSimulationStep: () => Promise<void>;
  stopSimulation: () => void;
  actualizarFotoPerfil: (foto: string | null) => Promise<boolean>;
  actualizarDatosPersonales: (nuevosDatos: { nombre?: string; correoOTelefono?: string; celular?: string }) => Promise<{ success: boolean; message?: string; diasRestantes?: number }>;
  getB2BTrialStatus: (userTarget?: UsuarioRegistrado | null) => { active: boolean; daysLeft: number; totalDays: number };
  actualizarKYC: (detalles: string) => Promise<void>;
  activeTenantId: string | null;
  seleccionarTenant: (tenantId: string) => void;
}

// Creación del React Context
const UserContext = React.createContext<UserContextType | undefined>(undefined);

// Datos semilla iniciales para dar vida a la interfaz en el primer uso
const initialSeedOrders: Order[] = [
  {
    id: 1,
    titulo: "Fuga en lavabo",
    proveedor: "Juan Ríos",
    servicio: "Plomería",
    description: "Tengo una fuga debajo del lavabo del baño, sale mucha agua.",
    estado: "En progreso",
    progreso: 65,
    hora: "Hoy 10:30",
    color: "#FFB400",
    precio: "S/. 80–150",
    urgencia: "Normal"
  },
  {
    id: 2,
    titulo: "Instalación de AC",
    proveedor: null,
    servicio: "Climatización",
    description: "Necesito instalar un aire acondicionado split de 12000 BTU en el dormitorio.",
    estado: "Buscando proveedor",
    progreso: 25,
    hora: "Hace 45 min",
    color: "#FFB400",
    precio: "S/. 150–400",
    urgencia: "Normal"
  },
  {
    id: 3,
    titulo: "Pintura sala",
    proveedor: "María López",
    servicio: "Pintura",
    description: "Pintar la sala de estar completa, paredes y techo.",
    estado: "Completado",
    progreso: 100,
    hora: "12 Jun 2026",
    color: "#4caf50",
    precio: "S/. 120–300",
    urgencia: "Normal"
  },
  {
    id: 4,
    titulo: "Papelería e Insumos",
    proveedor: null,
    servicio: "Papelería & Oficina",
    description: "Requerimos 20 resmas de papel bond tamaño carta, carpetas membretadas y bolígrafos para uso corporativo.",
    estado: "Buscando proveedor",
    progreso: 25,
    hora: "Hace 2 horas",
    color: "#6366F1",
    precio: "S/. 300–600",
    urgencia: "Normal"
  }
];

// Semillas iniciales para la base de datos local de usuarios (en español)
const initialSeedUsers: UsuarioRegistrado[] = [
  { nombre: 'Luis Alberto M.', correoOTelefono: 'luis@todoya.com', rol: 'client', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural' },
  { nombre: 'Juan Ríos', correoOTelefono: 'juan.rios@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural', proveedorConfigurado: true, serviciosOfrecidos: ['Plomería'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Plomero certificado con 5 años de experiencia residencial.' },
  { nombre: 'Corporación Alfa S.A.', correoOTelefono: 'empresa@todoya.com', rol: 'business', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '481920028', correoFacturacion: 'facturas@alfa.corp.bo', rubro: 'Papelería', b2bTrialStartDate: new Date().toISOString() },
  { nombre: 'Imprenta y Gráfica Beta', correoOTelefono: 'proveedor_empresa@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '839201992', correoFacturacion: 'facturas@beta.bo', rubro: 'Branding & Lettering', ofreceB2B: true, proveedorConfigurado: true, serviciosOfrecidos: ['Branding & Lettering'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Ofrecemos soluciones gráficas y branding corporativo de alta calidad.', b2bTrialStartDate: new Date().toISOString() }
];

/**
 * Proveedor de Contexto (UserProvider):
 * Envuelve toda la aplicación para proveer estados dinámicos y funciones reactivas
 * que persisten localmente a través de nuestro módulo `Storage`.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [coins, setCoins] = useState<number>(24);
  const [planId, setPlanId] = useState<'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3' | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Luis Alberto M.');
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<UsuarioRegistrado[]>([]);
  const [activeUser, setActiveUser] = useState<UsuarioRegistrado | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isDbOnline, setIsDbOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const lastMaxMsgIdRef = useRef(0);
  const wasOnlineRef = useRef(false); // Rastrear estado previo para detectar reconexión

  // Estados para ubicación real y detección de cambio de ciudad
  const [lastKnownCity, setLastKnownCity] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [showLocationChangeModal, setShowLocationChangeModal] = useState<boolean>(false);
  const [locationChangeFrom, setLocationChangeFrom] = useState<string | null>(null);
  const [locationChangeTo, setLocationChangeTo] = useState<string | null>(null);
  const [declinedCity, setDeclinedCity] = useState<string | null>(null);

  const confirmCityChange = () => {
    if (detectedCity) {
      setLastKnownCity(detectedCity);
      Storage.setItem('todo_ya_last_known_city', detectedCity).catch(() => {});
    }
    setShowLocationChangeModal(false);
  };

  const declineCityChange = () => {
    if (detectedCity) {
      setDeclinedCity(detectedCity);
    }
    setShowLocationChangeModal(false);
  };

  const triggerLocationCheck = async (forceShow?: boolean) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Location] Permisos de ubicación denegados.');
        return;
      }

      // Obtener ubicación real
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Obtener nombre de la ciudad
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      let city = '';
      let country = '';
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        city = item.city || item.subregion || item.region || item.district || '';
        country = item.country || '';
      }
      if (country) {
        setDetectedCountry(country);
      }

      // Normalización e identificación de la ciudad
      if (city) {
        const cityLower = city.toLowerCase();
        if (cityLower.includes('arequipa')) {
          city = 'Arequipa';
        } else if (cityLower.includes('lima') || cityLower.includes('callao')) {
          city = 'Lima';
        } else if (cityLower.includes('santa cruz')) {
          city = 'Santa Cruz de la Sierra';
        }
      } else {
        // Fallback geográfico estricto por coordenadas en caso de que reverseGeocodeAsync no devuelva nombre (ej: en Web)
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        // Distancias aproximadas a las ciudades conocidas
        const targets = [
          { name: 'Arequipa', lat: -16.4090, lng: -71.5375 },
          { name: 'Lima', lat: -12.0464, lng: -77.0428 },
          { name: 'Santa Cruz de la Sierra', lat: -17.7833, lng: -63.1821 }
        ];
        let closest = targets[0];
        let minDist = Infinity;
        for (const t of targets) {
          const dx = lat - t.lat;
          const dy = lng - t.lng;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            minDist = d;
            closest = t;
          }
        }
        city = closest.name;
      }

      setDetectedCity(city);

      // Cargar la última ciudad conocida de storage si no la tenemos en estado
      let prevCity = lastKnownCity;
      if (!prevCity) {
        const saved = await Storage.getItem('todo_ya_last_known_city');
        if (saved) {
          prevCity = saved;
          setLastKnownCity(saved);
        }
      }

      if (!prevCity) {
        // Es la primera vez que se detecta ubicación, guardar silenciosamente sin alertar
        setLastKnownCity(city);
        await Storage.setItem('todo_ya_last_known_city', city);
      } else if (prevCity !== city) {
        // Detectamos cambio de ciudad
        if (declinedCity !== city || forceShow) {
          setLocationChangeFrom(prevCity);
          setLocationChangeTo(city);
          setShowLocationChangeModal(true);
        }
      }
    } catch (err) {
      console.warn('[Location] Error al obtener/verificar la ubicación:', err);
    }
  };

  const seleccionarTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    Storage.setItem('todo_ya_active_tenant', tenantId).catch(() => {});
  };

  const showNotification = (title: string, message: string, type: 'info' | 'success' | 'warning') => {
    setNotification({ title, message, type });
    // También disparar el toast premium e insertarlo en el tray
    const mappedType = type === 'success' ? 'application' : (type === 'info' ? 'chat' : 'system');
    addTrayNotification(title, message, mappedType);
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const addTrayNotification = (title: string, message: string, type: 'chat' | 'application' | 'system' | 'wallet') => {
    const newNotif = {
      id: String(Date.now()),
      title,
      message,
      type,
      read: false,
      timestamp: 'Ahora'
    };
    setNotificationsList(prev => {
      const updated = [newNotif, ...prev];
      Storage.setItem('todo_ya_notifications', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setActiveToast({ id: newNotif.id, title, message, type });
  };

  const markAllNotificationsRead = () => {
    setNotificationsList(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      Storage.setItem('todo_ya_notifications', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotificationsList([]);
    Storage.setItem('todo_ya_notifications', JSON.stringify([])).catch(() => {});
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Sincronización bidireccional: local_db.json → Neon cuando vuelve el internet
  // ─────────────────────────────────────────────────────────────────────────────
  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Primero sembrar Neon con datos demo si está vacío
      await fetch('/api/seed', { method: 'POST' });

      // 2. Sincronizar datos creados offline hacia Neon
      const syncRes = await fetch('/api/sync', { method: 'POST' });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        const total = syncData.synced 
          ? Object.values(syncData.synced as Record<string, number>).reduce((a, b) => a + b, 0)
          : 0;
        if (total > 0) {
          showNotification(
            'Sincronización completada',
            `${total} registros locales subidos a Neon.db exitosamente.`,
            'success'
          );
        } else {
          console.log('[Sync] Todo ya estaba sincronizado en Neon.');
        }
      }

      // 3. Recargar datos frescos desde Neon
      const [ordRes, usrRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/users')
      ]);
      if (ordRes.ok) {
        const d = await ordRes.json();
        if (d.status === 'success') setOrders(d.data);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        if (d.status === 'success') setUsuariosRegistrados(d.data);
      }
    } catch (err) {
      console.warn('[Sync] Error durante sincronización:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Polling de reconexión: cada 30 segundos verifica si el internet volvió
  useEffect(() => {
    const checkReconnection = async () => {
      if (isDbOnline) return; // Ya está online, no es necesario
      try {
        const res = await fetch('/api/db-status');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && data.database === 'connected') {
            console.log('[UserContext] Internet restaurado — reconectando con Neon...');
            setIsDbOnline(true);
            showNotification(
              'Conexión restaurada',
              'Sincronizando datos locales con Neon.db...',
              'info'
            );
            // Pequeña pausa para que el usuario vea la notificación
            setTimeout(() => triggerSync(), 1500);
          }
        }
      } catch (_) {
        // Sigue sin internet, silencioso
      }
    };

    if (!isDbOnline) {
      const reconnectInterval = setInterval(checkReconnection, 30000); // Cada 30 segundos
      return () => clearInterval(reconnectInterval);
    }
  }, [isDbOnline]);

  // Efecto inicial: Carga los datos guardados en la memoria persistente al iniciar la app
  useEffect(() => {
    async function loadData() {
      // 1. Verificar si el servidor está respondiendo (Neon.db u offline local_db.json)
      let online = false;
      try {
        const response = await fetch('/api/db-status');
        if (response.ok) {
          const statusData = await response.json();
          if (statusData.status === 'ok') {
            online = true;
            setIsDbOnline(true);
            wasOnlineRef.current = true;
            console.log(`[UserContext] Conexión establecida con el servidor (Base de datos: ${statusData.database})`);
            // Si acabamos de conectar con Neon, sembrar si está vacío
            if (statusData.database === 'connected') {
              fetch('/api/seed', { method: 'POST' }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('[UserContext] Ejecutándose en modo local de dispositivo (offline).');
      }

      // Cargar otros valores locales del dispositivo que son fijos de la sesión
      const savedNotifs = await Storage.getItem('todo_ya_notifications');
      if (savedNotifs) {
        try { setNotificationsList(JSON.parse(savedNotifs)); } catch(_) {}
      }

      const savedRole = await Storage.getItem('todo_ya_role');
      if (savedRole) setUserRole(savedRole as UserRole);

      const savedCoins = await Storage.getItem('todo_ya_coins');
      if (savedCoins !== null) setCoins(Number(savedCoins));

      const savedPlan = await Storage.getItem('todo_ya_plan_id');
      if (savedPlan) setPlanId(savedPlan as any);

      const savedName = await Storage.getItem('todo_ya_username');
      if (savedName) setUserName(savedName);

      const savedCity = await Storage.getItem('todo_ya_last_known_city');
      if (savedCity) {
        setLastKnownCity(savedCity);
      }

      const savedAuth = await Storage.getItem('todo_ya_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
        // Verificar ubicación en tiempo real al iniciar sesión de forma diferida
        setTimeout(() => {
          triggerLocationCheck().catch(() => {});
        }, 1200);
      }

      const savedActiveUser = await Storage.getItem('todo_ya_active_user');
      if (savedActiveUser) {
        try {
          const usuarioActivoParseado = JSON.parse(savedActiveUser);
          // CORRECCIÓN: Nos aseguramos de sanitizar el rol y el tipo de entidad de la sesión activa
          // en base a su correo electrónico o datos fiscales para evitar que persista como 'natural' por error.
          const esEmpresaActiva = usuarioActivoParseado.tipoEntidad === 'empresa' || 
                                 (usuarioActivoParseado.correoOTelefono || '').toLowerCase().includes('empresa') || 
                                 !!usuarioActivoParseado.nit;
          usuarioActivoParseado.tipoEntidad = esEmpresaActiva ? 'empresa' : 'natural';
          
          if (!usuarioActivoParseado.planId) {
            usuarioActivoParseado.planId = esEmpresaActiva ? 'business_1' : 'provider_1';
          }
          setPlanId(usuarioActivoParseado.planId);
          setActiveUser(usuarioActivoParseado);
        } catch(e) {}
      }

      // Si la BD está online, sincronizar listas desde el servidor. Si no, usar localStorage
      if (online) {
        try {
          // Obtener pedidos de Neon.db
          const ordRes = await fetch('/api/orders');
          if (ordRes.ok) {
            const ordData = await ordRes.json();
            if (ordData.status === 'success') {
              setOrders(ordData.data);
            }
          }
          
          // Obtener usuarios de Neon.db
          const usrRes = await fetch('/api/users');
          if (usrRes.ok) {
            const usrData = await usrRes.json();
            if (usrData.status === 'success') {
              setUsuariosRegistrados(usrData.data);
              
              // Migración automática del usuario activo a Neon DB
              if (savedActiveUser) {
                let parsedUser: UsuarioRegistrado | null = null;
                try { parsedUser = JSON.parse(savedActiveUser); } catch(e) {}
                
                if (parsedUser && !parsedUser.id) {
                   const regRes = await fetch('/api/users', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(parsedUser)
                   });
                   if (regRes.ok) {
                     const regData = await regRes.json();
                     if (regData.status === 'success' && regData.user) {
                       parsedUser.id = regData.user.id;
                       setActiveUser(parsedUser);
                       await Storage.setItem('todo_ya_active_user', JSON.stringify(parsedUser));
                       
                       // Refrescar billetera tras crear
                       const wRes = await fetch(`/api/wallet?userId=${parsedUser.id}`);
                       if (wRes.ok) {
                         const wData = await wRes.json();
                         if (wData.status === 'success') setCoins(wData.coins);
                       }
                     }
                   }
                }
              }
            }
          }
        } catch (e) {
          console.error('[UserContext] Error al sincronizar con Neon.db:', e);
        }
      } else {
        // Carga de historial de pedidos local (Offline)
        const savedOrders = await Storage.getItem('todo_ya_orders');
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        } else {
          setOrders(initialSeedOrders);
        }

        // Carga de usuarios registrados locales (Offline)
        const savedUsers = await Storage.getItem('todo_ya_registered_users');
        if (savedUsers) {
          try {
            const usuariosParseados = JSON.parse(savedUsers);
            if (Array.isArray(usuariosParseados)) {
              const usuariosSaneados: UsuarioRegistrado[] = usuariosParseados.map((u: any) => ({
                nombre: u.nombre || u.name || 'Usuario',
                correoOTelefono: u.correoOTelefono || u.emailOrPhone || '',
                rol: u.rol || u.role || 'client',
                contrasena: u.contrasena || u.password || 'demo1234',
                tipoProveedor: u.tipoProveedor || u.providerType || 'normal',
                tipoEntidad: u.tipoEntidad || 'natural',
                nit: u.nit,
                correoFacturacion: u.correoFacturacion,
                rubro: u.rubro,
                ofreceB2B: u.ofreceB2B,
                proveedorConfigurado: u.proveedorConfigurado,
                serviciosOfrecidos: u.serviciosOfrecidos,
                anosExperiencia: u.anosExperiencia,
                descripcionProveedor: u.descripcionProveedor,
                coberturaB2B: u.coberturaB2B,
                planId: u.planId || (u.tipoEntidad === 'empresa' ? 'business_1' : 'provider_1')
              }));
              setUsuariosRegistrados(usuariosSaneados);
            } else {
              setUsuariosRegistrados(initialSeedUsers);
            }
          } catch (e) {
            setUsuariosRegistrados(initialSeedUsers);
          }
        } else {
          setUsuariosRegistrados(initialSeedUsers);
          await Storage.setItem('todo_ya_registered_users', JSON.stringify(initialSeedUsers));
        }
      }
    }
    loadData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH REAL (Captura de tokens redireccionados en Web)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebOAuth = async () => {
        const hash = window.location.hash;
        const search = window.location.search;
        
        // 1. Google OAuth (Implicit Flow returns access_token in URL hash)
        if (hash && hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            
            try {
              const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
              if (res.ok) {
                const profile = await res.json();
                const email = profile.email;
                const name = profile.name || email.split('@')[0];
                
                showNotification('Conexión Google', `Autenticado con éxito como ${name}.`, 'success');
                await registrarEIniciarSesion(name, email, 'client', 'google');
                router.replace('/');
              }
            } catch (err) {
              console.error('Error al obtener perfil de Google:', err);
            }
          }
        }
        
        // 2. LinkedIn OAuth (Code Flow returns auth code in URL query)
        if (search && search.includes('code=')) {
          const params = new URLSearchParams(search);
          const code = params.get('code');
          if (code) {
            window.history.replaceState(null, '', window.location.pathname);
            
            try {
              const res = await fetch('/api/auth-linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri: window.location.origin })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.status === 'success') {
                  showNotification('Conexión LinkedIn', `Autenticado con éxito como ${data.name}.`, 'success');
                  await registrarEIniciarSesion(data.name, data.email, 'client', 'linkedin');
                  router.replace('/');
                } else {
                  console.warn('Fallo en LinkedIn Auth:', data.message);
                }
              }
            } catch (err) {
              console.error('Error al intercambiar código de LinkedIn:', err);
            }
          }
        }
      };
      
      handleWebOAuth();
    }
  }, [usuariosRegistrados]);

  // Polling para Notificaciones Reales sobre Neon DB
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastMaxId = 0;
    
    // Inicializar el ID máximo al arrancar
    if (orders.length > 0) {
      lastMaxId = Math.max(...orders.map(o => o.id));
    }

    const checkUpdates = async () => {
      if (!isDbOnline) return;

      try {
        const res = await fetch('/api/orders');
        if (!res.ok) return;

        const data = await res.json();
        if (data.status !== 'success') return;

        const remoteOrders: Order[] = data.data;

        // 1. Detección para Proveedores: Nuevas solicitudes publicadas
        if (userRole === 'provider') {
          const newOrders = remoteOrders.filter(o => o.id > lastMaxId && o.estado === 'Buscando proveedor');
          
          if (newOrders.length > 0) {
            // Filtrar si el proveedor configuró servicios
            const providerServices = activeUser?.serviciosOfrecidos || [];
            
            for (const order of newOrders) {
              const matchesService = providerServices.length === 0 || providerServices.includes(order.servicio);
              if (matchesService) {
                showNotification(
                  "¡Nuevo Lead Disponible!",
                  `${order.titulo} en la categoría ${order.servicio}. Presupuesto: ${order.precio}`,
                  "info"
                );
              }
            }
            lastMaxId = Math.max(...remoteOrders.map(o => o.id));
          }
        }

        // 2. Detección para Clientes: Proveedor acepta solicitud
        if (userRole === 'client' || userRole === 'business') {
          // Buscar transiciones de 'Buscando proveedor' a 'En progreso'
          orders.forEach(localOrder => {
            if (localOrder.estado === 'Buscando proveedor') {
              const remoteMatch = remoteOrders.find(ro => ro.id === localOrder.id);
              if (remoteMatch && remoteMatch.estado === 'En progreso' && remoteMatch.proveedor) {
                showNotification(
                  "¡Proveedor Asignado!",
                  `Tu solicitud "${localOrder.titulo}" fue aceptada por ${remoteMatch.proveedor}. Va en camino.`,
                  "success"
                );
              }
            }
          });
        }

        // Actualizar la lista local de pedidos en segundo plano para reflejar los cambios
        setOrders(remoteOrders);

        // 3. Polling global de mensajes de chat para notificaciones in-app
        try {
          const chatRes = await fetch('/api/chat?all=true');
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            if (chatData.status === 'success' && Array.isArray(chatData.data)) {
              const allMessages = chatData.data;
              if (lastMaxMsgIdRef.current === 0) {
                lastMaxMsgIdRef.current = allMessages.reduce((max: number, m: any) => Math.max(max, m.id || 0), 0);
              } else {
                const newMessages = allMessages.filter((m: any) => (m.id || 0) > lastMaxMsgIdRef.current);
                if (newMessages.length > 0) {
                  for (const msg of newMessages) {
                    const msgOrder = remoteOrders.find(o => o.id === msg.orderId);
                    if (msgOrder) {
                      const isParticipant = 
                        (userRole === 'provider' && msgOrder.proveedor === userName) || 
                        (userRole !== 'provider' && msgOrder.estado === 'En progreso');
                      
                      if (isParticipant && msg.senderName !== userName && msg.senderName !== 'Tú') {
                        showNotification(
                          `${msg.senderName}:`,
                          msg.messageText,
                          'info'
                        );
                      }
                    }
                  }
                  lastMaxMsgIdRef.current = allMessages.reduce((max: number, m: any) => Math.max(max, m.id || 0), 0);
                }
              }
            }
          }
        } catch (chatErr) {
          console.warn('Error en polling de mensajes de chat:', chatErr);
        }
      } catch (err) {
        console.warn('Error en polling de notificaciones:', err);
      }
    };

    // Ejecutar la primera revisión y luego programar el intervalo
    const interval = setInterval(checkUpdates, 6000); // Cada 6 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, userRole, orders, activeUser, isDbOnline]);

  /**
   * Alterna de rol de usuario (Cliente <-> Proveedor) y guarda la selección.
   */
  const toggleRole = () => {
    setIsSwitchingRole(true);
    setTimeout(() => {
      let nextRole: UserRole = 'client';
      const isEmpresa = activeUser?.tipoEntidad === 'empresa' || userRole === 'business';
      
      if (isEmpresa) {
        nextRole = userRole === 'business' ? 'provider' : 'business';
      } else {
        nextRole = userRole === 'client' ? 'provider' : 'client';
      }

      setUserRole(nextRole);
      Storage.setItem('todo_ya_role', nextRole);
      if (activeUser) {
        const updatedUser: UsuarioRegistrado = { ...activeUser, rol: nextRole };
        setActiveUser(updatedUser);
        Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
      }

      if (nextRole === 'provider') {
        triggerLocationCheck().catch(() => {});
      }
      
      setTimeout(() => {
        setIsSwitchingRole(false);
      }, 500);
    }, 100);
  };

  /**
   * Define un rol específico (Cliente o Proveedor) y guarda la selección.
   */
  const setRole = (role: UserRole) => {
    setIsSwitchingRole(true);
    setTimeout(() => {
      setUserRole(role);
      Storage.setItem('todo_ya_role', role);
      if (activeUser) {
        const updatedUser: UsuarioRegistrado = { ...activeUser, rol: role };
        setActiveUser(updatedUser);
        Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
      }
      if (role === 'provider') {
        triggerLocationCheck().catch(() => {});
      }
      setTimeout(() => {
        setIsSwitchingRole(false);
      }, 500);
    }, 100);
  };

  /**
   * Añade un nuevo pedido a la lista local. El rol es de Cliente.
   */
  const addOrder = async (
    titulo: string, 
    servicio: string, 
    description: string, 
    precio: string, 
    urgencia: string, 
    proveedor: string | null = null
  ) => {
    // Si se especificó un proveedor (se aceptó el servicio residencial), cobrar comisión según plan
    if (proveedor) {
      try {
        const providerUser = usuariosRegistrados.find(u => u.nombre === proveedor);
        if (providerUser) {
          let feeValue = 10;
          if (precio.includes('15')) feeValue = 15;
          else if (precio.includes('20')) feeValue = 20;

          const userPlan = providerUser.planId || 'provider_1';
          let commissionRate = 0.20; // Plan 1: 20%
          if (userPlan === 'provider_2') {
            commissionRate = 0.10; // Plan 2: 10%
          } else if (userPlan === 'provider_3') {
            commissionRate = 0.00; // Plan 3: 0%
          }

          const debitCoins = Math.round(feeValue * commissionRate);

          if (debitCoins > 0) {
            const currentCoins = providerUser.monedas !== undefined ? providerUser.monedas : 24;
            const newCoins = Math.max(0, currentCoins - debitCoins);

            // Actualizar localmente la lista de usuarios
            const updatedUsers = usuariosRegistrados.map(u => 
              u.nombre === proveedor ? { ...u, monedas: newCoins } : u
            );
            setUsuariosRegistrados(updatedUsers);
            await Storage.setItem('todo_ya_registered_users', JSON.stringify(updatedUsers));

            // Si el proveedor activo es quien fue seleccionado, actualizar su estado
            if (activeUser && activeUser.nombre === proveedor) {
              setCoins(newCoins);
              setActiveUser({ ...activeUser, monedas: newCoins });
              await Storage.setItem('todo_ya_coins', newCoins.toString());
              await Storage.setItem('todo_ya_active_user', JSON.stringify({ ...activeUser, monedas: newCoins }));
            }

            // Registrar transacción en base de datos si está online
            if (isDbOnline && providerUser.id) {
              try {
                await fetch('/api/wallet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: providerUser.id,
                    monto: debitCoins,
                    tipo: 'gasto',
                    detalle: `Comisión Consulta Técnica (${precio}) - Suscripción: ${userPlan === 'provider_1' ? 'Plan 1' : 'Plan 2'}`
                  })
                });
              } catch (walletErr) {
                console.warn('[addOrder] Error debitando monedas en BD remota:', walletErr);
              }
            }
          }
        }
      } catch (coinErr) {
        console.warn('[addOrder] Error al procesar comisiones del proveedor:', coinErr);
      }
    }

    const newOrder: Order = {
      id: Date.now(),
      titulo,
      proveedor,
      servicio,
      description,
      estado: proveedor ? 'En progreso' : 'Buscando proveedor',
      progreso: proveedor ? 65 : 25,
      hora: 'Ahora mismo',
      color: '#FFB400',
      precio,
      urgencia,
      acceptedAt: proveedor ? new Date().toISOString() : null,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo, 
          servicio, 
          description, 
          precio, 
          urgencia, 
          proveedor,
          clienteId: activeUser?.id || null, //  FK real al cliente que crea el pedido
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const syncedOrder: Order = {
            id: data.order.id,
            titulo: data.order.titulo,
            proveedor: data.order.proveedor,
            servicio: data.order.servicio,
            description: data.order.descripcion,
            estado: data.order.estado,
            progreso: data.order.progreso,
            hora: data.order.hora,
            color: data.order.color,
            precio: data.order.precio,
            urgencia: data.order.urgencia,
            acceptedAt: data.order.acceptedAt,
            completedAt: data.order.completedAt,
            tiempoEjecucion: data.order.tiempoEjecucion
          };
          setOrders(prev => [syncedOrder, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.warn('[addOrder] Error al guardar pedido en servidor, recurriendo a local:', err);
    }

    const updated = [newOrder, ...orders];
    setOrders(updated);
    Storage.setItem('todo_ya_orders', JSON.stringify(updated));
  };

  /**
   * Postulación de un Proveedor a un Pedido/Lead de Cliente
   */
  const applyToLead = (orderId: number, coinsCost: number, providerName: string): boolean => {
    // 1. Encontrar la orden para evaluar su servicio
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return false;

    // 2. Determinar si el servicio es de tipo B2B
    const isOrderB2B = 
      targetOrder.servicio === 'Decoración & Eventos' || 
      targetOrder.servicio === 'Branding & Lettering' || 
      targetOrder.servicio === 'Papelería & Oficina' || 
      targetOrder.servicio === 'Servicios B2B';

    const currentEntidad = activeUser?.tipoEntidad || 'natural';
    const userPlan = planId || activeUser?.planId || (currentEntidad === 'empresa' ? 'business_1' : 'provider_1');

    // 3. Aplicar reglas de acceso basadas en la suscripción
    if (currentEntidad === 'natural') {
      if (isOrderB2B) {
        if (userPlan === 'provider_1') {
          showNotification('Acceso Denegado', 'Tu Plan 1 no te permite acceder a solicitudes de empresas.', 'warning');
          return false;
        } else if (userPlan === 'provider_2') {
          // Límite de 3 postulaciones de empresas al mes
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

          if (b2bCountThisMonth >= 3) {
            showNotification('Límite Alcanzado', 'Has alcanzado el límite mensual de 3 solicitudes de empresas con tu Plan 2.', 'warning');
            return false;
          }
        }
      }
    } else if (currentEntidad === 'empresa') {
      if (userPlan === 'business_1') {
        if (!isOrderB2B) {
          showNotification('Acceso Denegado', 'El Plan Empresa 1 solo permite acceder a solicitudes de empresas.', 'warning');
          return false;
        }
      }
    }

    let finalUserId = activeUser?.id;
    if (!finalUserId && activeUser?.correoOTelefono) {
       const found = usuariosRegistrados.find(u => u.correoOTelefono === activeUser.correoOTelefono);
       if (found?.id) finalUserId = found.id;
    }

    // 3.5 Sistema de Scoring (Tarea 3.3): bloquear pedidos de tarifa alta
    //    si el proveedor tiene menos de 80 puntos (4.0 estrellas).
    const score = getProviderScore(activeUser);
    if (esPedidoTarifaAlta(targetOrder.precio) && !score.puedeAccederTarifaAlta) {
      showNotification(
        'Tarifa Alta restringida',
        `Necesitas al menos 80 pts (4.0★) para acceder a pedidos de tarifa alta. Tu puntaje actual es ${score.puntaje} pts (${score.estrellas}★).`,
        'warning'
      );
      return false;
    }

    if (isDbOnline && finalUserId && coinsCost > 0) {
      fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: finalUserId, tipo: 'gasto', monto: coinsCost, detalle: `Postulación a pedido #${orderId}` })
      }).catch(err => console.warn('[applyToLead] Error al descontar monedas en backend:', err));
    }

    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: orderId, 
        action: 'apply', 
        providerName,
        proveedorId: finalUserId || null, //  FK real del proveedor
      })
    }).catch(err => console.warn('[applyToLead] Error al sincronizar postulación en backend:', err));

    //  Registrar la postulación en la tabla applications (historial relacional)
    if (finalUserId) {
      fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          proveedorId: finalUserId, 
          monedasGastadas: coinsCost,
          notaPersonal: null
        })
      }).catch(err => console.warn('[applyToLead] Error al registrar postulación:', err));
    }

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          proveedor: providerName,
          estado: 'En progreso' as const,
          progreso: 65,
          hora: 'Hace un momento',
          acceptedAt: new Date().toISOString()
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    Storage.setItem('todo_ya_orders', JSON.stringify(updatedOrders));
    return true;
  };

  /**
   * Marca un trabajo/pedido como 'Completado' y eleva el progreso al 100%.
   */
  const completeJob = (orderId: number) => {
    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, action: 'complete' })
    }).catch(err => console.warn('[completeJob] Error al completar trabajo en backend:', err));

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const now = new Date();
        let tiempoEjecucionText = 'Tiempo desconocido';
        if (order.acceptedAt) {
          const diffMs = now.getTime() - new Date(order.acceptedAt).getTime();
          const diffMins = Math.round(diffMs / 60000);
          tiempoEjecucionText = diffMins > 60 ? `${Math.round(diffMins / 60)} horas` : `${diffMins} minutos`;
        }

        return {
          ...order,
          estado: 'Completado' as const,
          progreso: 100,
          color: '#4caf50',
          hora: 'Terminado recientemente',
          completedAt: now.toISOString(),
          tiempoEjecucion: tiempoEjecucionText
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    Storage.setItem('todo_ya_orders', JSON.stringify(updatedOrders));
  };

  /**
   * Cancela un trabajo asignado al proveedor activo y aplica el Sistema de
   * Scoring (Tarea 3.3):
   * - Cancelación injustificada: resta 10 puntos (100 pts = 5.0★).
   * - Cancelación justificada: no afecta el puntaje.
   * Actualiza el puntaje del proveedor activo y el estado del pedido.
   */
  const cancelOrder = (orderId: number, justificada: boolean, motivo?: string): boolean => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return false;
    if (targetOrder.estado !== 'En progreso') {
      showNotification('No se puede cancelar', 'Solo puedes cancelar un trabajo en progreso.', 'warning');
      return false;
    }

    const finalUserId = activeUser?.id;

    const scoringBody = {
      id: orderId,
      action: 'cancel',
      justificada,
      motivo: motivo || null,
      proveedorId: finalUserId || null,
    };

    if (isDbOnline) {
      fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoringBody)
      })
        .then(res => res.json())
        .then(data => {
          if (data?.scoring?.puntaje !== undefined && activeUser) {
            const updatedUser = {
              ...activeUser,
              puntaje: data.scoring.puntaje,
              cancelacionesInjustificadas: (activeUser.cancelacionesInjustificadas ?? 0) + (justificada ? 0 : 1),
              fechaUltimaPenalizacion: justificada ? activeUser.fechaUltimaPenalizacion : new Date().toISOString(),
            };
            setActiveUser(updatedUser);
            Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
            if (justificada) {
              showNotification('Trabajo cancelado', 'Cancelación registrada como justificada. No pierdes puntos.', 'info');
            } else {
              showNotification('Trabajo cancelado', `Cancelación injustificada: perdiste 10 puntos. Nuevo puntaje: ${data.scoring.puntaje} pts.`, 'warning');
            }
          }
        })
        .catch(err => console.warn('[cancelOrder] Error al cancelar en backend:', err));
    }

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          estado: 'Cancelado' as const,
          color: '#ef4444',
          hora: 'Cancelado recientemente',
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    Storage.setItem('todo_ya_orders', JSON.stringify(updatedOrders));

    // Modo local (sin Neon): aplicar la penalización en localDb vía API
    if (!isDbOnline && finalUserId) {
      fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoringBody)
      })
        .then(res => res.json())
        .then(data => {
          if (data?.scoring?.puntaje !== undefined && activeUser) {
            const updatedUser = {
              ...activeUser,
              puntaje: data.scoring.puntaje,
              cancelacionesInjustificadas: (activeUser.cancelacionesInjustificadas ?? 0) + (justificada ? 0 : 1),
            };
            setActiveUser(updatedUser);
            Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
          }
        })
        .catch(err => console.warn('[cancelOrder] Error al cancelar en localDb:', err));
    }

    return true;
  };
  const login = async (telefonoOCorreo: string, contrasena: string, forceRole?: UserRole): Promise<boolean> => {
    if (!telefonoOCorreo.trim() || !contrasena.trim()) {
      return false;
    }

    const claveCorreo = telefonoOCorreo.trim().toLowerCase();

    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const resData = await response.json();
        if (resData.status === 'success') {
          const dbUsers: UsuarioRegistrado[] = resData.data;
          const usuarioEncontrado = dbUsers.find(u => {
            const correoRegistrado = (u.correoOTelefono || '').toLowerCase();
            const celularRegistrado = u.celular || '';
            const celularCompleto = `+${u.codigoPais || ''} ${u.celular || ''}`.trim().toLowerCase();
            return correoRegistrado === claveCorreo || celularRegistrado === claveCorreo || celularCompleto === claveCorreo;
          });
          
          if (usuarioEncontrado) {
            if (usuarioEncontrado.baneado) {
              showNotification('Cuenta Suspendida', 'Tu acceso ha sido bloqueado debido a reportes de comportamiento. Escríbenos a soporte@todoya.com', 'warning');
              return false;
            }
            if (usuarioEncontrado.contrasena && usuarioEncontrado.contrasena !== contrasena) {
              return false;
            }
            setActiveUser(usuarioEncontrado);
            setIsAuthenticated(true);
            setUserName(usuarioEncontrado.nombre);
            setUserRole(usuarioEncontrado.rol);
            await Storage.setItem('todo_ya_auth', 'true');
            await Storage.setItem('todo_ya_username', usuarioEncontrado.nombre);
            await Storage.setItem('todo_ya_role', usuarioEncontrado.rol);
            await Storage.setItem('todo_ya_active_user', JSON.stringify(usuarioEncontrado));
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[login] Error en autenticación con servidor, reintentando local:', err);
    }

    const usuarioEncontrado = usuariosRegistrados.find(u => {
      const correoRegistrado = (u.correoOTelefono || '').toLowerCase();
      const celularRegistrado = u.celular || '';
      const celularCompleto = `+${u.codigoPais || ''} ${u.celular || ''}`.trim().toLowerCase();
      return correoRegistrado === claveCorreo || celularRegistrado === claveCorreo || celularCompleto === claveCorreo;
    });

    let nombre = '';
    let rol: UserRole = 'client';

    if (usuarioEncontrado) {
      if (usuarioEncontrado.baneado) {
        showNotification('Cuenta Suspendida', 'Tu acceso ha sido bloqueado debido a reportes de comportamiento. Escríbenos a soporte@todoya.com', 'warning');
        return false;
      }
      if (usuarioEncontrado.contrasena && usuarioEncontrado.contrasena !== contrasena) {
        return false;
      }
      nombre = usuarioEncontrado.nombre;
      rol = forceRole || usuarioEncontrado.rol; // Forzar el rol si viene de los botones de prueba de acceso rápido
      
      const updatedUser = { ...usuarioEncontrado, rol };
      setActiveUser(updatedUser);
      await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
      
      // Actualizar también en la lista de usuarios registrados para mantener la consistencia al cambiar de rol en la BD local
      const listaActualizada = usuariosRegistrados.map(u => 
        (u.correoOTelefono || '').toLowerCase() === claveCorreo ? updatedUser : u
      );
      setUsuariosRegistrados(listaActualizada);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
    } else {
      if (telefonoOCorreo.includes('@')) {
        const partes = telefonoOCorreo.split('@')[0];
        nombre = partes.charAt(0).toUpperCase() + partes.slice(1);
      } else if (telefonoOCorreo.length >= 8) {
        nombre = `Usuario +591 ${telefonoOCorreo.substring(telefonoOCorreo.length - 8)}`;
      }
      nombre = nombre || 'Usuario';
      
      // CORRECCIÓN: Detectamos de manera inteligente si el correo de prueba contiene la palabra 'empresa'
      // para auto-registrarlo como entidad 'empresa' (con rol 'business') en lugar de 'natural' (con rol 'client').
      const esEmpresaEmail = telefonoOCorreo.trim().toLowerCase().includes('empresa');
      const rolDefault: UserRole = esEmpresaEmail ? 'business' : 'client';
      rol = forceRole || rolDefault;
      
      const nuevoUsuario: UsuarioRegistrado = {
        nombre,
        correoOTelefono: telefonoOCorreo.trim(),
        rol,
        tipoProveedor: 'normal',
        contrasena: contrasena,
        tipoEntidad: esEmpresaEmail ? 'empresa' : 'natural',
        planId: esEmpresaEmail ? 'business_1' : 'provider_1'
      };
      
      const listaActualizada = [...usuariosRegistrados, nuevoUsuario];
      setUsuariosRegistrados(listaActualizada);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
      setActiveUser(nuevoUsuario);
      await Storage.setItem('todo_ya_active_user', JSON.stringify(nuevoUsuario));

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      }).catch(err => console.warn('[login] Error al registrar usuario nuevo en servidor:', err));
    }

    setIsAuthenticated(true);
    setUserName(usuarioEncontrado ? usuarioEncontrado.nombre : nombre);
    
    // CORRECCIÓN: Usamos la variable 'rol' que ya fue procesada con 'forceRole' en lugar del rol persistido 'usuarioEncontrado.rol'.
    // Esto previene que al usar los botones de acceso rápido de prueba (que fuerzan un rol) se termine cargando el rol de proveedor
    // guardado previamente en el almacenamiento persistente del usuario.
    const rolFinal = rol;
    setUserRole(rolFinal);

    await Storage.setItem('todo_ya_auth', 'true');
    await Storage.setItem('todo_ya_username', usuarioEncontrado ? usuarioEncontrado.nombre : nombre);
    await Storage.setItem('todo_ya_role', rolFinal);
    return true;
  };

  /**
   * Registro y Login Social por Google o LinkedIn
   */
  const registrarEIniciarSesion = async (
    nombre: string,
    correoOTelefono: string,
    rol: UserRole,
    tipoProveedor: 'google' | 'linkedin' | 'normal',
    extraData?: Partial<UsuarioRegistrado>
  ): Promise<void> => {
    const claveCorreo = correoOTelefono.trim().toLowerCase();

    const esEmpresaEmail = correoOTelefono.trim().toLowerCase().includes('empresa');
    let usuarioFinal: UsuarioRegistrado = {
      nombre,
      correoOTelefono: correoOTelefono.trim(),
      rol,
      tipoProveedor,
      contrasena: 'demo1234',
      tipoEntidad: extraData?.tipoEntidad || (esEmpresaEmail ? 'empresa' : 'natural'),
      nit: extraData?.nit,
      correoFacturacion: extraData?.correoFacturacion,
      rubro: extraData?.rubro,
      ofreceB2B: extraData?.ofreceB2B || (esEmpresaEmail ? true : undefined),
      celular: extraData?.celular,
      codigoPais: extraData?.codigoPais,
      kycVerificado: extraData?.kycVerificado || false,
      kycDetalles: extraData?.kycDetalles || ''
    };

    if (isDbOnline) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(usuarioFinal)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            usuarioFinal = data.user;
          }
        }
      } catch (err) {
        console.error('Error registrando login social en Neon.db:', err);
      }
    }

    const usuarioExistente = usuariosRegistrados.find(u => {
      const correoRegistrado = (u.correoOTelefono || '').toLowerCase();
      return correoRegistrado === claveCorreo;
    });
    
    let listaActualizada = [...usuariosRegistrados];
    if (!usuarioExistente) {
      listaActualizada = [...usuariosRegistrados, usuarioFinal];
      setUsuariosRegistrados(listaActualizada);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
    } else {
      usuarioFinal = {
        ...usuarioExistente,
        ...extraData
      };
      listaActualizada = usuariosRegistrados.map(u => 
        (u.correoOTelefono || '').toLowerCase() === claveCorreo ? usuarioFinal : u
      );
      setUsuariosRegistrados(listaActualizada);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
    }

    setIsAuthenticated(true);
    setUserName(usuarioFinal.nombre);
    setUserRole(usuarioFinal.rol);
    setActiveUser(usuarioFinal);

    // Sincronizar billetera al loguear
    if (isDbOnline && usuarioFinal.id) {
      try {
        const walletRes = await fetch(`/api/wallet?userId=${usuarioFinal.id}`);
        if (walletRes.ok) {
          const wData = await walletRes.json();
          if (wData.status === 'success') {
            setCoins(wData.coins);
            await Storage.setItem('todo_ya_coins', String(wData.coins));
          }
        }
      } catch (err) {
        console.error('Error sincronizando billetera:', err);
      }
    }

    await Storage.setItem('todo_ya_auth', 'true');
    await Storage.setItem('todo_ya_username', usuarioFinal.nombre);
    await Storage.setItem('todo_ya_role', usuarioFinal.rol);
    await Storage.setItem('todo_ya_active_user', JSON.stringify(usuarioFinal));
  };

  /**
   * Registro manual completo para nuevos usuarios
   */
  const registrarUsuario = async (
    nombre: string,
    correoOTelefono: string,
    rol: UserRole,
    contrasena: string,
    tipoEntidad: 'natural' | 'empresa' = 'natural',
    nit?: string,
    correoFacturacion?: string,
    rubro?: string,
    ofreceB2B?: boolean,
    celular?: string,
    codigoPais?: string
  ): Promise<boolean> => {
    const claveCorreo = correoOTelefono.trim().toLowerCase();
    
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const resData = await response.json();
        if (resData.status === 'success') {
          const dbUsers: UsuarioRegistrado[] = resData.data;
          const usuarioExistente = dbUsers.find(u => (u.correoOTelefono || '').toLowerCase() === claveCorreo);
          if (usuarioExistente) return false;
        }
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correoOTelefono, rol, contrasena, tipoEntidad, nit, correoFacturacion, rubro, ofreceB2B, celular, codigoPais })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const registeredUser = data.user;
          setIsAuthenticated(true);
          setUserName(nombre);
          setUserRole(rol);
          setActiveUser(registeredUser);
          await Storage.setItem('todo_ya_auth', 'true');
          await Storage.setItem('todo_ya_username', nombre);
          await Storage.setItem('todo_ya_role', rol);
          await Storage.setItem('todo_ya_active_user', JSON.stringify(registeredUser));

          // Sincronizar la lista local y el storage
          const nuevoUsuarioConClave = { ...registeredUser, contrasena };
          const listaActualizada = [...usuariosRegistrados, nuevoUsuarioConClave];
          setUsuariosRegistrados(listaActualizada);
          await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));

          return true;
        }
      }
    } catch (err) {
      console.warn('[registrarUsuario] Error registrando en servidor, recurriendo a local:', err);
    }

    const usuarioExistente = usuariosRegistrados.find(u => 
      (u.correoOTelefono || '').toLowerCase() === claveCorreo
    );

    if (usuarioExistente) {
      return false;
    }

    const nuevoUsuario: UsuarioRegistrado = {
      nombre,
      correoOTelefono: correoOTelefono.trim(),
      rol,
      contrasena,
      tipoProveedor: 'normal',
      tipoEntidad,
      nit,
      correoFacturacion,
      rubro,
      ofreceB2B,
      celular,
      codigoPais,
      kycVerificado: false,
      kycDetalles: ''
    };

    const listaActualizada = [...usuariosRegistrados, nuevoUsuario];
    setUsuariosRegistrados(listaActualizada);
    await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));

    setIsAuthenticated(true);
    setUserName(nombre);
    setUserRole(rol);
    setActiveUser(nuevoUsuario);

    await Storage.setItem('todo_ya_auth', 'true');
    await Storage.setItem('todo_ya_username', nombre);
    await Storage.setItem('todo_ya_role', rol);
    await Storage.setItem('todo_ya_active_user', JSON.stringify(nuevoUsuario));
    return true;
  };

  /**
   * Cierre de sesión
   */
  const logout = () => {
    setIsAuthenticated(false);
    setUserRole('client');
    setActiveUser(null);
    Storage.setItem('todo_ya_role', 'client');
    Storage.removeItem('todo_ya_auth');
    Storage.removeItem('todo_ya_username');
    Storage.removeItem('todo_ya_active_user');
  };

  /**
   * Eliminación de cuenta permanente
   */
  const deleteAccount = async (): Promise<boolean> => {
    if (!activeUser?.correoOTelefono) return false;
    const correoOTelefono = activeUser.correoOTelefono;
    
    // 1. Llamar a la API para borrar de la base de datos
    try {
      await fetch(`/api/users?correoOTelefono=${encodeURIComponent(correoOTelefono)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[deleteAccount] Falló la eliminación en servidor:', err);
    }

    // 2. Limpiar localmente en la lista de usuarios registrados del contexto
    const claveCorreo = correoOTelefono.toLowerCase();
    const listaActualizada = usuariosRegistrados.filter(u => 
      (u.correoOTelefono || '').toLowerCase() !== claveCorreo
    );
    setUsuariosRegistrados(listaActualizada);
    await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));

    // 3. Ejecutar logout para limpiar sesión y storage
    logout();
    return true;
  };

  /**
   * Configura al usuario activo como Proveedor tras responder el onboarding.
   */
  const configurarProveedor = async (
    servicios: string[],
    experiencia: string,
    descripcion: string,
    cobertura?: string
  ) => {
    if (!activeUser) return;

    const updatedUser: UsuarioRegistrado = {
      ...activeUser,
      rol: 'provider',
      proveedorConfigurado: true,
      serviciosOfrecidos: servicios,
      anosExperiencia: experiencia,
      descripcionProveedor: descripcion,
      coberturaB2B: cobertura,
      ofreceB2B: activeUser.tipoEntidad === 'empresa' ? true : false
    };

    if (isDbOnline) {
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correoOTelefono: activeUser.correoOTelefono,
            serviciosOfrecidos: servicios,
            anosExperiencia: experiencia,
            descripcionProveedor: descripcion,
            coberturaB2B: cobertura
          })
        });
      } catch (err) {
        console.error('Error al sincronizar perfil de proveedor en Neon.db:', err);
      }
    }

    setActiveUser(updatedUser);
    setUserRole('provider');
    await Storage.setItem('todo_ya_role', 'provider');
    await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));

    const claveCorreo = (activeUser.correoOTelefono || '').toLowerCase();
    const listaActualizada = usuariosRegistrados.map(u => 
      (u.correoOTelefono || '').toLowerCase() === claveCorreo ? updatedUser : u
    );
    setUsuariosRegistrados(listaActualizada);
    await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
  };

  /**
   * Actualiza el estado de verificación de identidad KYC para el usuario activo
   */
  const actualizarKyc = async (kycVerificado: boolean, kycDetalles: string) => {
    if (!activeUser) return;

    const updatedUser: UsuarioRegistrado = {
      ...activeUser,
      kycVerificado,
      kycDetalles
    };

    if (isDbOnline) {
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correoOTelefono: activeUser.correoOTelefono,
            kycVerificado,
            kycDetalles
          })
        });
      } catch (err) {
        console.error('Error al sincronizar verificación KYC en Neon.db:', err);
      }
    }

    setActiveUser(updatedUser);
    await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));

    const claveCorreo = (activeUser.correoOTelefono || '').toLowerCase();
    const listaActualizada = usuariosRegistrados.map(u => 
      (u.correoOTelefono || '').toLowerCase() === claveCorreo ? updatedUser : u
    );
    setUsuariosRegistrados(listaActualizada);
    await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
  };

  /**
   * Registra un reporte o denuncia contra un proveedor.
   */
  const reportarProveedor = async (
    pedidoId: number | undefined,
    reportadoNombre: string,
    motivo: string,
    descripcion: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId,
          reportanteId: activeUser?.id,
          reportadoNombre,
          motivo,
          descripcion
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.status === 'success';
      }
      return false;
    } catch (err) {
      console.error('Error al registrar reporte de proveedor:', err);
      return false;
    }
  };

  /**
   * Banear/suspender o reactivar la cuenta de un proveedor.
   */
  const banearProveedor = async (
    correoOTelefono: string,
    baneado: boolean
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correoOTelefono,
          baneado
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          // Si el proveedor baneado es el usuario activo, actualizarlo localmente
          if (activeUser && activeUser.correoOTelefono.toLowerCase() === correoOTelefono.toLowerCase()) {
            const updatedUser = { ...activeUser, baneado };
            setActiveUser(updatedUser);
            await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
          }

          // Actualizar la lista local de registrados
          const listaActualizada = usuariosRegistrados.map(u => 
            (u.correoOTelefono || '').toLowerCase() === correoOTelefono.toLowerCase()
              ? { ...u, baneado }
              : u
          );
          setUsuariosRegistrados(listaActualizada);
          await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error al banear proveedor:', err);
      return false;
    }
  };

  /**
   * Registra la calificación dada por el cliente a un pedido completado.
   */
  const rateOrder = (orderId: number, estrellas: number, etiquetas: string[]) => {
    if (isDbOnline) {
      fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'rate', estrellas, etiquetas })
      }).catch(err => console.error('Error al calificar trabajo en Neon.db:', err));
    }

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          calificado: true,
          calificacionEstrellas: estrellas,
          calificacionEtiquetas: etiquetas
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    Storage.setItem('todo_ya_orders', JSON.stringify(updatedOrders));
  };

  /**
   * Cambia el plan de suscripción del proveedor
   */
  const subscribeToPlan = async (newPlanId: 'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3'): Promise<boolean> => {
    setPlanId(newPlanId);
    await Storage.setItem('todo_ya_plan_id', newPlanId);

    const updatedUser = activeUser ? { ...activeUser, planId: newPlanId } : null;
    if (updatedUser) {
      setActiveUser(updatedUser);
      await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));

      // Sincronizar en la lista local de registrados
      const updatedList = usuariosRegistrados.map(u => 
        (u.correoOTelefono || '').toLowerCase() === (updatedUser.correoOTelefono || '').toLowerCase()
          ? updatedUser
          : u
      );
      setUsuariosRegistrados(updatedList);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(updatedList));
    }

    if (isDbOnline && activeUser) {
      try {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correoOTelefono: activeUser.correoOTelefono,
            planId: newPlanId
          })
        });
        if (response.ok) {
          console.log('[UserContext] Plan de suscripción actualizado en base de datos');
        }
      } catch (err) {
        console.error('Error al actualizar plan en la BD:', err);
      }
    }
    return true;
  };

  /**
   * Restablece completamente los datos locales de la aplicación a su estado inicial.
   */
  const resetData = () => {
    setUserRole('client');
    setCoins(24);
    setPlanId(null);
    setOrders(initialSeedOrders);
    setIsAuthenticated(false);
    setUserName('Luis Alberto M.');
    setUsuariosRegistrados(initialSeedUsers);
    setActiveUser(null);
    
    Storage.removeItem('todo_ya_role');
    Storage.removeItem('todo_ya_coins');
    Storage.removeItem('todo_ya_plan_id');
    Storage.removeItem('todo_ya_orders');
    Storage.removeItem('todo_ya_auth');
    Storage.removeItem('todo_ya_username');
    Storage.removeItem('todo_ya_active_user');
    Storage.setItem('todo_ya_registered_users', JSON.stringify(initialSeedUsers));
  };

  /**
   * Agrega monedas a la billetera local y a la base de datos
   */
  const addCoins = async (amount: number, detail: string) => {
    const updatedCoins = coins + amount;
    setCoins(updatedCoins);
    await Storage.setItem('todo_ya_coins', String(updatedCoins));

    let finalUserId = activeUser?.id;
    if (!finalUserId && activeUser?.correoOTelefono) {
       const found = usuariosRegistrados.find(u => u.correoOTelefono === activeUser.correoOTelefono);
       if (found?.id) finalUserId = found.id;
    }

    if (isDbOnline && finalUserId) {
       try {
         await fetch('/api/wallet', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userId: finalUserId, tipo: 'recarga', monto: amount, detalle: detail })
         });
       } catch (e) {
         console.error('Error al agregar monedas:', e);
       }
    }
  };

  /**
   * Fuerza la recarga de pedidos (Leads) desde la base de datos o el almacenamiento local
   */
  const syncOrders = async () => {
    if (isDbOnline) {
      try {
        const ordRes = await fetch('/api/orders');
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          if (ordData.status === 'success') {
            setOrders(ordData.data);
          }
        }
        
        // También sincronizamos la billetera
        if (activeUser?.id) {
          const walletRes = await fetch(`/api/wallet?userId=${activeUser.id}`);
          if (walletRes.ok) {
            const wData = await walletRes.json();
            if (wData.status === 'success') {
              setCoins(wData.coins);
              await Storage.setItem('todo_ya_coins', String(wData.coins));
            }
          }
        }
      } catch (e) {
        console.error('Error forzando sincronización:', e);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LÓGICA DE SIMULACIÓN EN VIVO (Demo Guiada)
  // ─────────────────────────────────────────────────────────────────────────────
  const [simulationState, setSimulationState] = useState<'client' | 'provider' | null>(null);
  const [simulationStep, setSimulationStep] = useState<number>(0);

  const startClientSimulation = async () => {
    const correoSimulado = 'cliente_demo@todoya.com';
    const nombreSimulado = 'Carlos Cliente (Simulación)';
    
    let user = usuariosRegistrados.find(u => u.correoOTelefono === correoSimulado);
    if (!user) {
      await registrarUsuario(
        nombreSimulado,
        correoSimulado,
        'client',
        'demo1234',
        'natural',
        undefined,
        undefined,
        undefined,
        false,
        '70001111',
        '591'
      );
      const newU = {
        nombre: nombreSimulado,
        correoOTelefono: correoSimulado,
        rol: 'client' as const,
        contrasena: 'demo1234',
        tipoProveedor: 'normal' as const,
        tipoEntidad: 'natural' as const,
        celular: '70001111',
        codigoPais: '591'
      };
      setUsuariosRegistrados(prev => [...prev, newU]);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify([...usuariosRegistrados, newU]));
    }
    
    const exito = await login(correoSimulado, 'demo1234', 'client');
    if (exito) {
      setSimulationState('client');
      setSimulationStep(1);
      setOrders(prev => prev.filter(o => o.id <= 4)); 
      router.replace('/');
    }
  };

  const startProviderSimulation = async () => {
    const correoSimulado = 'pedro_demo@todoya.com';
    const nombreSimulado = 'Pedro Proveedor (Simulación)';
    
    let user = usuariosRegistrados.find(u => u.correoOTelefono === correoSimulado);
    if (!user) {
      await registrarUsuario(
        nombreSimulado,
        correoSimulado,
        'provider',
        'demo1234',
        'natural',
        undefined,
        undefined,
        undefined,
        false,
        '70002222',
        '591'
      );
    }
    
    const updatedUsers = usuariosRegistrados.map(u => 
      u.correoOTelefono === correoSimulado 
        ? { ...u, proveedorConfigurado: true, serviciosOfrecidos: ['Plomería'], planId: 'provider_2' as const, monedas: 24 }
        : u
    );
    const exists = updatedUsers.find(u => u.correoOTelefono === correoSimulado);
    const finalUsers = exists ? updatedUsers : [...updatedUsers, {
      nombre: nombreSimulado,
      correoOTelefono: correoSimulado,
      rol: 'provider' as const,
      contrasena: 'demo1234',
      tipoProveedor: 'normal' as const,
      tipoEntidad: 'natural' as const,
      celular: '70002222',
      codigoPais: '591',
      proveedorConfigurado: true,
      serviciosOfrecidos: ['Plomería'],
      planId: 'provider_2' as const,
      monedas: 24
    }];
    setUsuariosRegistrados(finalUsers);
    await Storage.setItem('todo_ya_registered_users', JSON.stringify(finalUsers));

    const exito = await login(correoSimulado, 'demo1234', 'provider');
    if (exito) {
      setCoins(24);
      setPlanId('provider_2');
      setSimulationState('provider');
      setSimulationStep(1);
      const testOrder: Order = {
        id: 999,
        titulo: 'Arreglar grifo cocina goteando',
        proveedor: null,
        servicio: 'Plomería',
        description: 'Tengo un grifo de la cocina goteando constantemente y hace ruido molesto.',
        estado: 'Buscando proveedor',
        progreso: 25,
        hora: 'Hace un momento',
        color: '#FFB400',
        precio: 'S/. 15',
        urgencia: 'Normal'
      };
      setOrders(prev => [testOrder, ...prev.filter(o => o.id !== 999)]);
      router.replace('/leads');
    }
  };

  const nextSimulationStep = async () => {
    if (simulationState === 'client') {
      if (simulationStep === 1) {
        setSimulationStep(2);
        router.replace('/solicitar');
      } else if (simulationStep === 2) {
        setSimulationStep(3);
      } else if (simulationStep === 3) {
        setSimulationStep(4);
      } else if (simulationStep === 4) {
        setSimulationStep(5);
        router.replace('/chat-room');
      } else if (simulationStep === 5) {
        const simOrder = orders.find(o => o.description.includes('cortocircuito'));
        if (simOrder) {
          completeJob(simOrder.id);
        }
        setSimulationState(null);
        setSimulationStep(0);
        router.replace('/pedidos');
      }
    } else if (simulationState === 'provider') {
      if (simulationStep === 1) {
        setSimulationStep(2);
        router.replace('/leads');
      } else if (simulationStep === 2) {
        const targetOrder = orders.find(o => o.id === 999);
        if (targetOrder) {
          applyToLead(999, 2, 'Pedro Proveedor (Simulación)');
        }
        setSimulationStep(3);
        router.replace('/trabajos');
      } else if (simulationStep === 3) {
        setSimulationStep(4);
        router.replace('/chat-room');
      } else if (simulationStep === 4) {
        setSimulationStep(5);
        router.replace('/trabajos');
      } else if (simulationStep === 5) {
        completeJob(999);
        setCoins(22);
        setSimulationState(null);
        setSimulationStep(0);
        router.replace('/pperfil');
      }
    }
  };

  const stopSimulation = () => {
    setSimulationState(null);
    setSimulationStep(0);
    logout();
  };

  const actualizarFotoPerfil = async (foto: string | null): Promise<boolean> => {
    if (!activeUser) return false;
    
    let finalPhotoUrl = foto;
    if (foto && (foto.startsWith('data:') || foto.startsWith('file:'))) {
      try {
        const uploadRes = await uploadImage(foto, `avatar_${activeUser.id || Date.now()}.jpg`);
        if (uploadRes.success && uploadRes.url) {
          finalPhotoUrl = uploadRes.url;
        }
      } catch (e) {
        console.warn('[uploadImage Exception]:', e);
      }
    }

    const nowTimestamp = new Date().toISOString();
    const updatedUser = {
      ...activeUser,
      fotoPerfil: finalPhotoUrl,
      fechaUltimaModificacionFoto: nowTimestamp
    };
    
    setUsuariosRegistrados(prev => prev.map(u => 
      u.correoOTelefono.trim().toLowerCase() === activeUser.correoOTelefono.trim().toLowerCase() 
        ? { ...u, fotoPerfil: finalPhotoUrl, fechaUltimaModificacionFoto: nowTimestamp } 
        : u
    ));
    
    setActiveUser(updatedUser as any);
    await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
    
    const savedUsers = await Storage.getItem('todo_ya_registered_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      const updatedList = parsed.map((u: any) => 
        u.correoOTelefono.trim().toLowerCase() === activeUser.correoOTelefono.trim().toLowerCase() 
          ? { ...u, fotoPerfil: finalPhotoUrl, fechaUltimaModificacionFoto: nowTimestamp } 
          : u
      );
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(updatedList));
    }
    
    if (isDbOnline) {
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correoOTelefono: activeUser.correoOTelefono,
            fotoPerfil: finalPhotoUrl,
            fechaUltimaModificacionFoto: nowTimestamp
          })
        });
      } catch (e) {
        console.error('Error sincronizando foto con Neon:', e);
      }
    }
    
    showNotification('Foto de Perfil', finalPhotoUrl ? 'Foto subida a CDN con éxito.' : 'Foto de perfil eliminada.', 'success');
    return true;
  };

  /**
   * Actualiza el Nombre, Correo o Celular del usuario con un candado estricto de 30 Días.
   */
  const actualizarDatosPersonales = async (nuevosDatos: { nombre?: string; correoOTelefono?: string; celular?: string }): Promise<{ success: boolean; message?: string; diasRestantes?: number }> => {
    if (!activeUser) return { success: false, message: 'No hay usuario activo.' };

    const ultimaFecha = activeUser.fechaUltimaModificacionDatos;
    if (ultimaFecha) {
      const fechaUltima = new Date(ultimaFecha);
      const diffMs = Date.now() - fechaUltima.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDias < 30) {
        const diasRestantes = 30 - diffDias;
        return {
          success: false,
          message: `Solo puedes cambiar tu información personal (Nombre, Correo o Celular) una vez cada 30 días. Podrás realizar cambios nuevamente en ${diasRestantes} días.`,
          diasRestantes
        };
      }
    }

    const nowTimestamp = new Date().toISOString();
    const updatedUser: UsuarioRegistrado = {
      ...activeUser,
      nombre: nuevosDatos.nombre !== undefined ? nuevosDatos.nombre : activeUser.nombre,
      correoOTelefono: nuevosDatos.correoOTelefono !== undefined ? nuevosDatos.correoOTelefono : activeUser.correoOTelefono,
      celular: nuevosDatos.celular !== undefined ? nuevosDatos.celular : activeUser.celular,
      fechaUltimaModificacionDatos: nowTimestamp
    };

    setUsuariosRegistrados(prev => prev.map(u => 
      (u.correoOTelefono || '').trim().toLowerCase() === (activeUser.correoOTelefono || '').trim().toLowerCase() 
        ? updatedUser
        : u
    ));
    
    setActiveUser(updatedUser);
    setUserName(updatedUser.nombre);
    await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
    
    const savedUsers = await Storage.getItem('todo_ya_registered_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      const updatedList = parsed.map((u: any) => 
        (u.correoOTelefono || '').trim().toLowerCase() === (activeUser.correoOTelefono || '').trim().toLowerCase() 
          ? updatedUser
          : u
      );
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(updatedList));
    }
    
    if (isDbOnline) {
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correoOTelefono: activeUser.correoOTelefono,
            nombre: nuevosDatos.nombre,
            nuevoCorreoOTelefono: nuevosDatos.correoOTelefono,
            celular: nuevosDatos.celular,
            fechaUltimaModificacionDatos: nowTimestamp
          })
        });
      } catch (e) {
        console.error('Error sincronizando datos personales con Neon:', e);
      }
    }
    
    showNotification('Perfil Actualizado', 'Tus datos personales fueron modificados correctamente.', 'success');
    return { success: true };
  };

  /**
   * Calcula el estado del Período de Prueba Gratis de 3 Meses (90 Días) para Empresas B2B
   */
  const getB2BTrialStatus = (userTarget?: UsuarioRegistrado | null) => {
    const u = userTarget !== undefined ? userTarget : activeUser;
    if (!u || u.tipoEntidad !== 'empresa') {
      return { active: false, daysLeft: 0, totalDays: 90 };
    }
    const startDateStr = u.b2bTrialStartDate || u.createdAt;
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const diffMs = Date.now() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalDays = 90; // 3 meses gratis
    const daysLeft = Math.max(0, totalDays - diffDays);
    return {
      active: daysLeft > 0,
      daysLeft,
      totalDays
    };
  };

  // ===== KYC: Actualizar verificación de identidad en contexto y Neon DB =====
  const actualizarKYC = async (detalles: string) => {
    if (!activeUser?.id) return;
    // 1. Actualizar estado local inmediatamente (UX sin esperar red)
    setActiveUser(prev => prev ? { ...prev, kycVerificado: true, kycDetalles: detalles } : prev);
    // 2. Persistir en Neon DB via endpoint
    try {
      await fetch('/api/kyc-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, kycVerificado: true, kycDetalles: detalles }),
      });
    } catch (e) {
      console.warn('[KYC] No se pudo sincronizar con Neon, se guardará en la próxima sincronización.');
    }
  };

  return (
    <UserContext.Provider value={{ 
      userRole, 
      toggleRole, 
      setRole, 
      coins, 
      planId,
      subscribeToPlan,
      orders, 
      addOrder, 
      applyToLead, 
      completeJob,
      cancelOrder,
      resetData,
      isAuthenticated,
      userName,
      login,
      logout,
      deleteAccount,
      usuariosRegistrados,
      registrarEIniciarSesion,
      registrarUsuario,
      activeUser,
      configurarProveedor,
      actualizarKyc,
      rateOrder,
      isSwitchingRole,
      syncOrders,
      addCoins,
      notification,
      showNotification,
      clearNotification,
      isDbOnline,        //  Estado de conexión a Neon
      isSyncing,         //  Indicador de sync en progreso
      triggerSync,       //  Sincronización manual forzada
      notificationsList,
      activeToast,
      addTrayNotification,
      markAllNotificationsRead,
      clearAllNotifications,
      dismissToast,
      reportarProveedor,
      banearProveedor,
      lastKnownCity,
      setLastKnownCity,
      detectedCity,
      detectedCountry,
      currencySymbol: getCurrencyConfig(lastKnownCity || detectedCity, detectedCountry, activeUser?.codigoPais).symbol,
      currencyCode: getCurrencyConfig(lastKnownCity || detectedCity, detectedCountry, activeUser?.codigoPais).code,
      currencyName: getCurrencyConfig(lastKnownCity || detectedCity, detectedCountry, activeUser?.codigoPais).name,
      formatPrice: (baseAmountBob: number, prefix: string = '') => formatPriceForLocation(baseAmountBob, lastKnownCity || detectedCity || detectedCountry, prefix),
      adaptPrice: (text: string) => adaptPriceText(text, lastKnownCity || detectedCity || detectedCountry),
      showLocationChangeModal,
      locationChangeFrom,
      locationChangeTo,
      triggerLocationCheck,
      confirmCityChange,
      declineCityChange,
      simulationState,
      simulationStep,
      setSimulationStep,
      startClientSimulation,
      startProviderSimulation,
      nextSimulationStep,
      stopSimulation,
      actualizarFotoPerfil,
      actualizarDatosPersonales,
      getB2BTrialStatus,
      actualizarKYC,
      activeTenantId,
      seleccionarTenant,
    }}>

      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook personalizado para acceder fácilmente a los datos globales del usuario
 * desde cualquier componente de la aplicación.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}

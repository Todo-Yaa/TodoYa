import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import Storage from '../utils/storage';
import { validPeruRuc } from '../services/auth/ruc';
import { supabase } from '../services/auth/supabase';
import { listTrades, saveProfessionalSettings } from '../services/auth/professional-profile';
import { bootstrapAuthenticatedUser, type ServerIdentity } from '../services/auth/identity';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Platform } from 'react-native';

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
}

// Interfaz para representar un pedido dentro de la aplicación
export interface Order {
  id: number;
  titulo: string;
  proveedor: string | null; // Nombre del proveedor asignado (null si está buscando)
  servicio: string;        // Categoría (Plomería, Electricidad, etc.)
  description: string;     // Detalle del problema
  estado: 'Buscando proveedor' | 'En progreso' | 'Completado';
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
  resetData: () => void;   // Resetea todos los estados al valor inicial
  isAuthenticated: boolean; // Estado de sesión del usuario
  authReady: boolean; // Restauración inicial de Supabase concluida
  userName: string;        // Nombre personalizado del usuario activo
  login: (telefonoOCorreo: string, contrasena: string, forceRole?: UserRole, expectedMode?: 'PERSON' | 'BUSINESS') => Promise<boolean>; // Inicia sesión
  logout: () => void;      // Cierra sesión y limpia la memoria
  deleteAccount: () => Promise<boolean>; // Elimina la cuenta permanentemente
  usuariosRegistrados: UsuarioRegistrado[]; // Lista de todos los usuarios de la base de datos local
  registrarEIniciarSesion: (nombre: string, correoOTelefono: string, rol: UserRole, tipoProveedor: 'google' | 'linkedin' | 'normal', extraData?: Partial<UsuarioRegistrado>) => Promise<void>; // Registro social
  registrarUsuario: (nombre: string, correoOTelefono: string, rol: UserRole, contrasena: string, tipoEntidad: 'natural' | 'empresa', nit?: string, correoFacturacion?: string, rubro?: string, ofreceB2B?: boolean, celular?: string, codigoPais?: string) => Promise<boolean>; // Registro manual
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
  detectedCity: string | null;
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
    precio: "Bs. 80–150",
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
    precio: "Bs. 150–400",
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
    precio: "Bs. 120–300",
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
    precio: "Bs. 300–600",
    urgencia: "Normal"
  }
];

// Semillas iniciales para la base de datos local de usuarios (en español)
const initialSeedUsers: UsuarioRegistrado[] = [
  { nombre: 'Luis Alberto M.', correoOTelefono: 'luis@todoya.com', rol: 'client', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural' },
  { nombre: 'Juan Ríos', correoOTelefono: 'juan.rios@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural', proveedorConfigurado: true, serviciosOfrecidos: ['Plomería'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Plomero certificado con 5 años de experiencia residencial.' },
  { nombre: 'Corporación Alfa S.A.', correoOTelefono: 'empresa@todoya.com', rol: 'business', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '481920028', correoFacturacion: 'facturas@alfa.corp.bo', rubro: 'Papelería' },
  { nombre: 'Imprenta y Gráfica Beta', correoOTelefono: 'proveedor_empresa@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '839201992', correoFacturacion: 'facturas@beta.bo', rubro: 'Branding & Lettering', ofreceB2B: true, proveedorConfigurado: true, serviciosOfrecidos: ['Branding & Lettering'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Ofrecemos soluciones gráficas y branding corporativo de alta calidad.' }
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
  const [authReady, setAuthReady] = useState(false);
  const [userName, setUserName] = useState<string>('Luis Alberto M.');
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<UsuarioRegistrado[]>([]);
  const [activeUser, setActiveUser] = useState<UsuarioRegistrado | null>(null);
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
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        city = item.city || item.subregion || item.region || item.district || '';
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
            '☁️ Sincronización completada',
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
            console.log('[UserContext] 🌐 Internet restaurado — reconectando con Neon...');
            setIsDbOnline(true);
            showNotification(
              '🌐 Conexión restaurada',
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

  // La sesión anterior (todo_ya_auth) nunca concede autenticación.
  // Solo Supabase + el bootstrap verificado por NestJS permiten abrir la aplicación.
  const applyAuthenticatedIdentity = async (result: ServerIdentity) => {
    const identity = result.identity;
    const name = [identity.givenNames, identity.paternalSurname].filter(Boolean).join(' ') || identity.email || 'Usuario';
    const company = result.mode === 'BUSINESS';
    const perfil: UsuarioRegistrado = {
      nombre: name,
      correoOTelefono: identity.email ?? '',
      rol: company ? 'business' : 'client',
      tipoProveedor: 'normal',
      tipoEntidad: company ? 'empresa' : 'natural',
    };
    setActiveUser(perfil);
    setUserName(name);
    setUserRole(company ? 'business' : 'client');
    setIsAuthenticated(true);
  };
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        // Clear old insecure/local account material, never restore it.
        await Promise.all([
          Storage.removeItem('todo_ya_auth'),
          Storage.removeItem('todo_ya_active_user'),
          Storage.removeItem('todo_ya_registered_users'),
        ]);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error || !session) {
          setIsAuthenticated(false);
          setActiveUser(null);
          return;
        }
        const user = await bootstrapAuthenticatedUser();
        if (active) await applyAuthenticatedIdentity(user);
      } catch (error) {
        // Network/backend failure must not create a fake authenticated session.
        if (active) { setIsAuthenticated(false); setActiveUser(null); }
        console.warn('[Auth] No se pudo restaurar la sesión verificada', error);
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  // Social OAuth antiguo inhabilitado: se integrará con PKCE verificado de Supabase.

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
                  "💼 ¡Nuevo Lead Disponible!",
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
                  "✅ ¡Proveedor Asignado!",
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
                          `💬 ${msg.senderName}:`,
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
          clienteId: activeUser?.id || null, // ✅ FK real al cliente que crea el pedido
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
        proveedorId: finalUserId || null, // ✅ FK real del proveedor
      })
    }).catch(err => console.warn('[applyToLead] Error al sincronizar postulación en backend:', err));

    // ✅ Registrar la postulación en la tabla applications (historial relacional)
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

  /** Login real. Nunca consulta /api/users ni compara contraseñas locales. */
  const login = async (email: string, password: string, _forceRole?: UserRole, expectedMode?: 'PERSON' | 'BUSINESS'): Promise<boolean> => {
    if (!email.trim().includes('@') || !password) return false;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return false;
      const verified = await bootstrapAuthenticatedUser(expectedMode);
      const hasBusinessAccess = verified.identity.ownedContexts.some(c => c.type === 'BUSINESS') || verified.identity.businessMemberships.length > 0;
      if ((expectedMode && verified.mode !== expectedMode) || (expectedMode === 'BUSINESS' && (!hasBusinessAccess || !verified.availableModes?.includes('BUSINESS')))) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setActiveUser(null);
        return false;
      }
      await applyAuthenticatedIdentity(verified);
      return true;
    } catch (error) {
      console.warn('[Auth] Login no completado', error);
      return false;
    }
  };

  /** Nunca usar un acceso social simulado para crear sesiones válidas. */
  const registrarEIniciarSesion = async (
    _name: string, _email: string, _role: UserRole,
    _provider: 'google' | 'linkedin' | 'normal', _extra?: Partial<UsuarioRegistrado>
  ): Promise<void> => {
    throw new Error('OAuth pendiente de integración segura con Supabase');
  };

  /** Registro real: Supabase envía correo de confirmación; NO activa sesión local. */
  const registrarUsuario = async (
    nombre: string, correo: string, _rol: UserRole, contrasena: string,
    tipoEntidad: 'natural' | 'empresa', nit?: string, correoFacturacion?: string,
    _rubro?: string, _ofreceB2B?: boolean, celular?: string, codigoPais?: string
  ): Promise<boolean> => {
    if (!correo.trim().includes('@') || contrasena.length < 8) return false;
    const phone = codigoPais === '51' && /^9\d{8}$/.test(celular ?? '') ? `+51${celular}` : undefined;
    if (tipoEntidad === 'empresa' && nit?.trim() && !validPeruRuc(nit.trim())) return false;
    try {
      const { error } = await supabase.auth.signUp({
        email: correo.trim().toLowerCase(), password: contrasena,
        options: { data: {
          registration_mode: tipoEntidad === 'empresa' ? 'BUSINESS' : 'PERSON',
          full_name: nombre.trim(), phone,
          ...(tipoEntidad === 'empresa' ? { business_name: nombre.trim(), ...(nit?.trim() ? { ruc: nit.trim() } : {}), ...(correoFacturacion?.trim() ? { billing_email: correoFacturacion.trim() } : {}) } : {}),
        } },
      });
      if (error) { console.warn('[Auth] Supabase rechazó registro', error.message); return false; }
      // No bootstrap until email confirmation and authenticated login.
      return true;
    } catch (error) {
      console.warn('[Auth] Registro no completado', error);
      return false;
    }
  };

  /**
   * Cierre de sesión
   */
  const logout = () => {
    void supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole('client');
    setActiveUser(null);
    void Storage.removeItem('todo_ya_auth');
    void Storage.removeItem('todo_ya_active_user');
    void Storage.removeItem('todo_ya_registered_users');
  };

  /**
   * Eliminación de cuenta permanente
   */
  const deleteAccount = async (): Promise<boolean> => {
    // No authenticated server deletion endpoint has been implemented yet.
    return false;
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
    if (!activeUser) throw new Error('Inicia sesión para configurar tu perfil');
    if (activeUser.tipoEntidad === 'natural') {
      const catalog = await listTrades();

      const selected = servicios.map(value =>
        catalog.find(t => t.id === value)
      );

      if (selected.some(t => !t)) {
        throw new Error(
          'Una especialidad seleccionada ya no está disponible. Recarga el catálogo.'
        );
      }
      const level = experiencia === 'Menos de 1 año' ? 'LESS_THAN_ONE_YEAR' : experiencia === 'Más de 3 años' ? 'MORE_THAN_THREE_YEARS' : 'ONE_TO_THREE_YEARS';
      const saved = await saveProfessionalSettings({bio: descripcion, experienceLevel: level, tradeIds: selected.map(t => t!.id)});
      // No marcar ACTIVE si el servidor exige identidad y consentimiento legal pendientes.
      if (saved.status !== 'ACTIVE' && __DEV__ !== true) {
        throw new Error(
          'Debes completar la activación profesional antes de acceder.'
        );
      }
      const updated: UsuarioRegistrado = {...activeUser, rol: 'provider', proveedorConfigurado: true, serviciosOfrecidos: saved.trades.map(t => t.name), anosExperiencia: experiencia, descripcionProveedor: saved.bio};
      setActiveUser(updated);
      setUserRole('provider');
      return;
    }

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
    void supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserName('Usuario');
    setUsuariosRegistrados([]);
    setActiveUser(null);

    Storage.removeItem('todo_ya_role');
    Storage.removeItem('todo_ya_coins');
    Storage.removeItem('todo_ya_plan_id');
    Storage.removeItem('todo_ya_orders');
    Storage.removeItem('todo_ya_auth');
    Storage.removeItem('todo_ya_username');
    Storage.removeItem('todo_ya_active_user');
    Storage.removeItem('todo_ya_registered_users');
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
      resetData,
      isAuthenticated,
      authReady,
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
      isDbOnline,        // ✅ Estado de conexión a Neon
      isSyncing,         // ✅ Indicador de sync en progreso
      triggerSync,       // ✅ Sincronización manual forzada
      notificationsList,
      activeToast,
      addTrayNotification,
      markAllNotificationsRead,
      clearAllNotifications,
      dismissToast,
      reportarProveedor,
      banearProveedor,
      lastKnownCity,
      detectedCity,
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

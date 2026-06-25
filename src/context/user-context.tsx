import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import Storage from '../utils/storage';

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
  orders: Order[];         // Lista global de pedidos (compartida localmente)
  addOrder: (titulo: string, servicio: string, description: string, precio: string, urgencia: string, proveedor?: string | null) => void; // Crea un pedido
  applyToLead: (orderId: number, coinsCost: number, providerName: string) => boolean; // Aplica a un trabajo (descuenta monedas)
  completeJob: (orderId: number) => void; // Finaliza un trabajo
  resetData: () => void;   // Resetea todos los estados al valor inicial
  isAuthenticated: boolean; // Estado de sesión del usuario
  userName: string;        // Nombre personalizado del usuario activo
  login: (telefonoOCorreo: string, contrasena: string, forceRole?: UserRole) => Promise<boolean>; // Inicia sesión
  logout: () => void;      // Cierra sesión y limpia la memoria
  usuariosRegistrados: UsuarioRegistrado[]; // Lista de todos los usuarios de la base de datos local
  registrarEIniciarSesion: (nombre: string, correoOTelefono: string, rol: UserRole, tipoProveedor: 'google' | 'linkedin' | 'normal', extraData?: Partial<UsuarioRegistrado>) => Promise<void>; // Registro social
  registrarUsuario: (nombre: string, correoOTelefono: string, rol: UserRole, contrasena: string, tipoEntidad: 'natural' | 'empresa', nit?: string, correoFacturacion?: string, rubro?: string, ofreceB2B?: boolean) => Promise<boolean>; // Registro manual
  activeUser: UsuarioRegistrado | null; // Usuario activo logueado
  configurarProveedor: (servicios: string[], experiencia: string, descripcion: string, cobertura?: string) => Promise<void>;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Luis Alberto M.');
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<UsuarioRegistrado[]>([]);
  const [activeUser, setActiveUser] = useState<UsuarioRegistrado | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isDbOnline, setIsDbOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const lastMaxMsgIdRef = useRef(0);
  const wasOnlineRef = useRef(false); // Rastrear estado previo para detectar reconexión

  const showNotification = (title: string, message: string, type: 'info' | 'success' | 'warning') => {
    setNotification({ title, message, type });
  };

  const clearNotification = () => {
    setNotification(null);
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
      const savedRole = await Storage.getItem('todo_ya_role');
      if (savedRole) setUserRole(savedRole as UserRole);

      const savedCoins = await Storage.getItem('todo_ya_coins');
      if (savedCoins !== null) setCoins(Number(savedCoins));

      const savedAuth = await Storage.getItem('todo_ya_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }

      const savedName = await Storage.getItem('todo_ya_username');
      if (savedName) setUserName(savedName);

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
                coberturaB2B: u.coberturaB2B
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
    if (coins < coinsCost) return false;
    
    const updatedCoins = coins - coinsCost;
    setCoins(updatedCoins);
    Storage.setItem('todo_ya_coins', String(updatedCoins));

    let finalUserId = activeUser?.id;
    if (!finalUserId && activeUser?.correoOTelefono) {
       const found = usuariosRegistrados.find(u => u.correoOTelefono === activeUser.correoOTelefono);
       if (found?.id) finalUserId = found.id;
    }

    if (finalUserId) {
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

  /**
   * Proceso de Inicio de Sesión
   */
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
          const usuarioEncontrado = dbUsers.find(u => (u.correoOTelefono || '').toLowerCase() === claveCorreo);
          
          if (usuarioEncontrado) {
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
      return correoRegistrado === claveCorreo;
    });

    let nombre = '';
    let rol: UserRole = 'client';

    if (usuarioEncontrado) {
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
        tipoEntidad: esEmpresaEmail ? 'empresa' : 'natural'
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
      ofreceB2B: extraData?.ofreceB2B || (esEmpresaEmail ? true : undefined)
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
    tipoEntidad: 'natural' | 'empresa',
    nit?: string,
    correoFacturacion?: string,
    rubro?: string,
    ofreceB2B?: boolean
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
        body: JSON.stringify({ nombre, correoOTelefono, rol, contrasena, tipoEntidad, nit, correoFacturacion, rubro, ofreceB2B })
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
      ofreceB2B
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
   * Restablece completamente los datos locales de la aplicación a su estado inicial.
   */
  const resetData = () => {
    setUserRole('client');
    setCoins(24);
    setOrders(initialSeedOrders);
    setIsAuthenticated(false);
    setUserName('Luis Alberto M.');
    setUsuariosRegistrados(initialSeedUsers);
    setActiveUser(null);
    
    Storage.removeItem('todo_ya_role');
    Storage.removeItem('todo_ya_coins');
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
    } else {
      const savedOrders = await Storage.getItem('todo_ya_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    }
  };

  return (
    <UserContext.Provider value={{ 
      userRole, 
      toggleRole, 
      setRole, 
      coins, 
      orders, 
      addOrder, 
      applyToLead, 
      completeJob,
      resetData,
      isAuthenticated,
      userName,
      login,
      logout,
      usuariosRegistrados,
      registrarEIniciarSesion,
      registrarUsuario,
      activeUser,
      configurarProveedor,
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

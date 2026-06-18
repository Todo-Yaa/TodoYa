import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Storage from '../utils/storage';

// Definición de roles de usuario disponibles: cliente, proveedor o empresa (B2B)
export type UserRole = 'client' | 'provider' | 'business';

// Representación de un usuario registrado en la aplicación (en español)
export interface UsuarioRegistrado {
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
  login: (telefonoOCorreo: string, contrasena: string) => Promise<boolean>; // Inicia sesión
  logout: () => void;      // Cierra sesión y limpia la memoria
  usuariosRegistrados: UsuarioRegistrado[]; // Lista de todos los usuarios de la base de datos local
  registrarEIniciarSesion: (nombre: string, correoOTelefono: string, rol: UserRole, tipoProveedor: 'google' | 'linkedin' | 'normal', extraData?: Partial<UsuarioRegistrado>) => Promise<void>; // Registro social
  registrarUsuario: (nombre: string, correoOTelefono: string, rol: UserRole, contrasena: string, tipoEntidad: 'natural' | 'empresa', nit?: string, correoFacturacion?: string, rubro?: string, ofreceB2B?: boolean) => Promise<boolean>; // Registro manual
  activeUser: UsuarioRegistrado | null; // Usuario activo logueado
  configurarProveedor: (servicios: string[], experiencia: string, descripcion: string, cobertura?: string) => Promise<void>;
  rateOrder: (orderId: number, estrellas: number, etiquetas: string[]) => void;
}

// Creación del React Context
const UserContext = createContext<UserContextType | undefined>(undefined);

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

  // Efecto inicial: Carga los datos guardados en la memoria persistente al iniciar la app
  useEffect(() => {
    async function loadData() {
      // Carga de rol seleccionado anteriormente
      const savedRole = await Storage.getItem('todo_ya_role');
      if (savedRole) setUserRole(savedRole as UserRole);

      // Carga de monedas del proveedor
      const savedCoins = await Storage.getItem('todo_ya_coins');
      if (savedCoins !== null) setCoins(Number(savedCoins));

      // Carga de historial de pedidos local
      const savedOrders = await Storage.getItem('todo_ya_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders(initialSeedOrders); // Semilla por defecto
      }

      // Carga de estado de sesión
      const savedAuth = await Storage.getItem('todo_ya_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }

      // Carga de nombre de usuario personalizado
      const savedName = await Storage.getItem('todo_ya_username');
      if (savedName) setUserName(savedName);

      // Carga de usuario activo logueado
      const savedActiveUser = await Storage.getItem('todo_ya_active_user');
      if (savedActiveUser) {
        try {
          setActiveUser(JSON.parse(savedActiveUser));
        } catch(e) {}
      }

      // Carga de la base de datos local de usuarios y sanitización de datos (compatibilidad hacia atrás con campos en inglés)
      const savedUsers = await Storage.getItem('todo_ya_registered_users');
      if (savedUsers) {
        try {
          const usuariosParseados = JSON.parse(savedUsers);
          if (Array.isArray(usuariosParseados)) {
            // Mapeamos propiedades en inglés (antiguas) a español para evitar errores de undefined
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
              ofreceB2B: u.ofreceB2B
            }));
            setUsuariosRegistrados(usuariosSaneados);
            // Guardamos de vuelta los usuarios saneados en el almacenamiento local
            await Storage.setItem('todo_ya_registered_users', JSON.stringify(usuariosSaneados));
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
    loadData();
  }, []);

  /**
   * Alterna de rol de usuario (Cliente <-> Proveedor) y guarda la selección.
   */
  const toggleRole = () => {
    const nextRole: UserRole = userRole === 'client' ? 'provider' : 'client';
    setUserRole(nextRole);
    Storage.setItem('todo_ya_role', nextRole);
    if (activeUser) {
      const updatedUser: UsuarioRegistrado = { ...activeUser, rol: nextRole };
      setActiveUser(updatedUser);
      Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
    }
  };

  /**
   * Define un rol específico (Cliente o Proveedor) y guarda la selección.
   */
  const setRole = (role: UserRole) => {
    setUserRole(role);
    Storage.setItem('todo_ya_role', role);
    if (activeUser) {
      const updatedUser: UsuarioRegistrado = { ...activeUser, rol: role };
      setActiveUser(updatedUser);
      Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));
    }
  };

  /**
   * Añade un nuevo pedido a la lista local. El rol es de Cliente.
   */
  const addOrder = (titulo: string, servicio: string, description: string, precio: string, urgencia: string, proveedor: string | null = null) => {
    const newOrder: Order = {
      id: Date.now(), // ID único usando timestamp
      titulo,
      proveedor,
      servicio,
      description,
      estado: proveedor ? 'En progreso' : 'Buscando proveedor',
      progreso: proveedor ? 65 : 25,
      hora: 'Ahora mismo',
      color: '#FFB400',
      precio,
      urgencia
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    Storage.setItem('todo_ya_orders', JSON.stringify(updated));
  };

  /**
   * Postulación de un Proveedor a un Pedido/Lead de Cliente:
   * - Verifica si el proveedor tiene suficientes monedas para postularse.
   * - Descuenta las monedas correspondientes.
   * - Asigna el nombre del proveedor al pedido y cambia el estado a 'En progreso'.
   */
  const applyToLead = (orderId: number, coinsCost: number, providerName: string): boolean => {
    if (coins < coinsCost) return false; // Monedas insuficientes
    
    const updatedCoins = coins - coinsCost;
    setCoins(updatedCoins);
    Storage.setItem('todo_ya_coins', String(updatedCoins));

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          proveedor: providerName,
          estado: 'En progreso' as const,
          progreso: 65,
          hora: 'Hace un momento'
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
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          estado: 'Completado' as const,
          progreso: 100,
          color: '#4caf50',
          hora: 'Terminado recientemente'
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    Storage.setItem('todo_ya_orders', JSON.stringify(updatedOrders));
  };

  /**
   * Proceso de Inicio de Sesión Normal (variables en español):
   * - Comprueba la base de datos local para verificar si el usuario ya existe y validar su rol.
   * - Si no existe, lo registra dinámicamente como Cliente para asegurar la flexibilidad de uso.
   */
  const login = async (telefonoOCorreo: string, contrasena: string): Promise<boolean> => {
    if (!telefonoOCorreo.trim() || !contrasena.trim()) {
      return false; // Campos vacíos
    }

    const claveCorreo = telefonoOCorreo.trim().toLowerCase();
    const usuarioEncontrado = usuariosRegistrados.find(u => {
      const correoRegistrado = (u.correoOTelefono || '').toLowerCase();
      return correoRegistrado === claveCorreo;
    });

    let nombre = '';
    let rol: UserRole = 'client';

    if (usuarioEncontrado) {
      if (usuarioEncontrado.contrasena && usuarioEncontrado.contrasena !== contrasena) {
        return false; // Contraseña incorrecta
      }
      nombre = usuarioEncontrado.nombre;
      rol = usuarioEncontrado.rol;
      setActiveUser(usuarioEncontrado);
      await Storage.setItem('todo_ya_active_user', JSON.stringify(usuarioEncontrado));
    } else {
      // Registrar al vuelo (auto-registro de prueba si es nuevo)
      if (telefonoOCorreo.includes('@')) {
        const partes = telefonoOCorreo.split('@')[0];
        nombre = partes.charAt(0).toUpperCase() + partes.slice(1);
      } else if (telefonoOCorreo.length >= 8) {
        nombre = `Usuario +591 ${telefonoOCorreo.substring(telefonoOCorreo.length - 8)}`;
      }
      nombre = nombre || 'Usuario';
      
      const nuevoUsuario: UsuarioRegistrado = {
        nombre,
        correoOTelefono: telefonoOCorreo.trim(),
        rol: 'client',
        tipoProveedor: 'normal',
        contrasena: contrasena,
        tipoEntidad: 'natural'
      };
      
      const listaActualizada = [...usuariosRegistrados, nuevoUsuario];
      setUsuariosRegistrados(listaActualizada);
      await Storage.setItem('todo_ya_registered_users', JSON.stringify(listaActualizada));
      setActiveUser(nuevoUsuario);
      await Storage.setItem('todo_ya_active_user', JSON.stringify(nuevoUsuario));
    }

    setIsAuthenticated(true);
    setUserName(usuarioEncontrado ? usuarioEncontrado.nombre : nombre);
    const rolFinal = usuarioEncontrado ? usuarioEncontrado.rol : rol;
    setUserRole(rolFinal);

    await Storage.setItem('todo_ya_auth', 'true');
    await Storage.setItem('todo_ya_username', usuarioEncontrado ? usuarioEncontrado.nombre : nombre);
    await Storage.setItem('todo_ya_role', rolFinal);
    return true;
  };

  /**
   * Registro y Login Social por Google o LinkedIn (variables y parámetros en español):
   * - Agrega el nuevo usuario a la lista local si no existe previamente.
   * - Autentica al usuario asignándole el rol seleccionado.
   */
  const registrarEIniciarSesion = async (
    nombre: string,
    correoOTelefono: string,
    rol: UserRole,
    tipoProveedor: 'google' | 'linkedin' | 'normal',
    extraData?: Partial<UsuarioRegistrado>
  ): Promise<void> => {
    const claveCorreo = correoOTelefono.trim().toLowerCase();
    const usuarioExistente = usuariosRegistrados.find(u => {
      const correoRegistrado = (u.correoOTelefono || '').toLowerCase();
      return correoRegistrado === claveCorreo;
    });
    
    let usuarioFinal: UsuarioRegistrado;
    let listaActualizada = [...usuariosRegistrados];
    if (!usuarioExistente) {
      usuarioFinal = {
        nombre,
        correoOTelefono: correoOTelefono.trim(),
        rol,
        tipoProveedor,
        contrasena: 'demo1234',
        tipoEntidad: extraData?.tipoEntidad || 'natural',
        nit: extraData?.nit,
        correoFacturacion: extraData?.correoFacturacion,
        rubro: extraData?.rubro,
        ofreceB2B: extraData?.ofreceB2B
      };
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
    const usuarioExistente = usuariosRegistrados.find(u => 
      (u.correoOTelefono || '').toLowerCase() === claveCorreo
    );

    if (usuarioExistente) {
      return false; // Ya existe
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
   * Cierre de sesión:
   * - Limpia el estado de autenticación, restablece rol por defecto y borra cookies/storage locales.
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
   * Configura al usuario activo como Proveedor (Natural o Empresa B2B) tras responder el onboarding.
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

    setActiveUser(updatedUser);
    setUserRole('provider');
    await Storage.setItem('todo_ya_role', 'provider');
    await Storage.setItem('todo_ya_active_user', JSON.stringify(updatedUser));

    // Actualizar en la lista local de usuarios registrados
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
      rateOrder
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

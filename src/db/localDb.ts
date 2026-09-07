import fs from 'fs';
import path from 'path';

// Ruta al archivo JSON local en la raíz del proyecto
const DB_FILE_PATH = path.resolve(process.cwd(), 'local_db.json');

export interface LocalDbSchema {
  tenants: any[];
  users: any[];
  orders: any[];
  messages: any[];
  transactions: any[];
  ratings: any[];
  applications: any[];
  reports: any[];
  provider_cancelaciones: any[];
}

const DEFAULT_TENANT_ID = 1;

const initialSeedTenants = [
  { id: 1, nombre: 'Todo Ya', slug: 'todoya', createdAt: new Date().toISOString() }
];

const initialSeedUsers = [
  { id: 1, tenantId: DEFAULT_TENANT_ID, nombre: 'Luis Alberto M.', correoOTelefono: 'luis@todoya.com', rol: 'client', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural', monedas: 24, kycVerificado: false, kycDetalles: '', createdAt: new Date().toISOString() },
  { id: 2, tenantId: DEFAULT_TENANT_ID, nombre: 'Juan Ríos', correoOTelefono: 'juan.rios@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural', proveedorConfigurado: true, serviciosOfrecidos: ['Plomería'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Plomero certificado con 5 años de experiencia residencial.', monedas: 24, kycVerificado: true, kycDetalles: 'Documento verificado', puntaje: 100, cancelacionesInjustificadas: 0, createdAt: new Date().toISOString() },
  { id: 3, tenantId: DEFAULT_TENANT_ID, nombre: 'Corporación Alfa S.A.', correoOTelefono: 'empresa@todoya.com', rol: 'business', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '481920028', correoFacturacion: 'facturas@alfa.corp.bo', rubro: 'Papelería', monedas: 24, kycVerificado: true, kycDetalles: 'NIT e identidad B2B verificados', createdAt: new Date().toISOString() },
  { id: 4, tenantId: DEFAULT_TENANT_ID, nombre: 'Imprenta y Gráfica Beta', correoOTelefono: 'proveedor_empresa@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '839201992', correoFacturacion: 'facturas@beta.bo', rubro: 'Branding & Lettering', ofreceB2B: true, proveedorConfigurado: true, serviciosOfrecidos: ['Branding & Lettering'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Ofrecemos soluciones gráficas y branding corporativo de alta calidad.', monedas: 24, kycVerificado: true, kycDetalles: 'NIT e identidad B2B verificados', puntaje: 100, cancelacionesInjustificadas: 0, createdAt: new Date().toISOString() }
];

const initialSeedOrders = [
  {
    id: 1,
    tenantId: DEFAULT_TENANT_ID,
    titulo: "Fuga en lavabo",
    clienteId: 1,      // Luis Alberto M.
    proveedorId: 2,    // Juan Ríos
    proveedor: "Juan Ríos",
    servicio: "Plomería",
    descripcion: "Tengo una fuga debajo del lavabo del baño, sale mucha agua.",
    estado: "En progreso",
    progreso: 65,
    hora: "Hoy 10:30",
    color: "#FFB400",
    precio: "S/. 80–150",
    urgencia: "Normal",
    acceptedAt: new Date().toISOString(),
    completedAt: null,
    tiempoEjecucion: null,
    calificado: false,
    calificacionEstrellas: null,
    calificacionEtiquetas: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    tenantId: DEFAULT_TENANT_ID,
    titulo: "Instalación de AC",
    clienteId: 1,
    proveedorId: null,
    proveedor: null,
    servicio: "Climatización",
    descripcion: "Necesito instalar un aire acondicionado split de 12000 BTU en el dormitorio.",
    estado: "Buscando proveedor",
    progreso: 25,
    hora: "Hace 45 min",
    color: "#FFB400",
    precio: "S/. 150–400",
    urgencia: "Normal",
    acceptedAt: null,
    completedAt: null,
    tiempoEjecucion: null,
    calificado: false,
    calificacionEstrellas: null,
    calificacionEtiquetas: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    tenantId: DEFAULT_TENANT_ID,
    titulo: "Pintura sala",
    clienteId: 1,
    proveedorId: null,
    proveedor: "María López",
    servicio: "Pintura",
    descripcion: "Pintar la sala de estar completa, paredes y techo.",
    estado: "Completado",
    progreso: 100,
    hora: "12 Jun 2026",
    color: "#4caf50",
    precio: "S/. 120–300",
    urgencia: "Normal",
    acceptedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: new Date().toISOString(),
    tiempoEjecucion: "2 horas",
    calificado: true,
    calificacionEstrellas: 5,
    calificacionEtiquetas: ["Puntual", "Limpio"],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 4,
    tenantId: DEFAULT_TENANT_ID,
    titulo: "Papelería e Insumos",
    clienteId: 3,    // Corporación Alfa S.A.
    proveedorId: null,
    proveedor: null,
    servicio: "Papelería & Oficina",
    descripcion: "Requerimos 20 resmas de papel bond tamaño carta, carpetas membretadas y bolígrafos para uso corporativo.",
    estado: "Buscando proveedor",
    progreso: 25,
    hora: "Hace 2 horas",
    color: "#6366F1",
    precio: "S/. 300–600",
    urgencia: "Normal",
    acceptedAt: null,
    completedAt: null,
    tiempoEjecucion: null,
    calificado: false,
    calificacionEstrellas: null,
    calificacionEtiquetas: null,
    createdAt: new Date().toISOString()
  }
];

const initialSeedRatings = [
  {
    id: 1,
    orderId: 3,         // Pintura sala
    calificadorId: 1,   // Luis Alberto (cliente)
    calificadoId: null, // María López (proveedor sin ID registrado)
    estrellas: 5,
    etiquetas: ["Puntual", "Limpio"],
    comentario: "Excelente trabajo, muy profesional.",
    createdAt: new Date().toISOString()
  }
];

class LocalDb {
  private read(): LocalDbSchema {
    try {
      if (!fs.existsSync(DB_FILE_PATH)) {
        this.write({
          tenants: initialSeedTenants,
          users: initialSeedUsers,
          orders: initialSeedOrders,
          messages: [],
          transactions: [],
          ratings: initialSeedRatings,
          applications: [],
          reports: [],
          provider_cancelaciones: []
        });
      }
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      // Migración automática: asegurar que las tablas nuevas existan en DB viejas
      if (!Array.isArray(parsed.tenants) || parsed.tenants.length === 0) parsed.tenants = initialSeedTenants;
      if (!parsed.ratings) parsed.ratings = initialSeedRatings;
      if (!parsed.applications) parsed.applications = [];
      if (!parsed.reports) parsed.reports = [];
      if (!parsed.provider_cancelaciones) parsed.provider_cancelaciones = [];
      // Migración automática: rellenar tenantId faltante en registros antiguos
      (parsed.users || []).forEach((u: any) => { if (!u.tenantId) u.tenantId = DEFAULT_TENANT_ID; });
      (parsed.orders || []).forEach((o: any) => { if (!o.tenantId) o.tenantId = DEFAULT_TENANT_ID; });
      (parsed.messages || []).forEach((m: any) => { if (!m.tenantId) m.tenantId = DEFAULT_TENANT_ID; });
      return parsed;
    } catch (e) {
      console.error('Error reading local JSON database:', e);
      return { tenants: initialSeedTenants, users: [], orders: [], messages: [], transactions: [], ratings: [], applications: [], reports: [], provider_cancelaciones: [] };
    }
  }

  private write(data: LocalDbSchema) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing local JSON database:', e);
    }
  }

  // --- TENANTS ---
  getTenants() {
    return this.read().tenants;
  }

  getTenantById(id: number) {
    return this.read().tenants.find(t => t.id === id);
  }

  insertTenant(tenant: any) {
    const dbData = this.read();
    const newId = dbData.tenants.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
    const newTenant = {
      ...tenant,
      id: newId,
      slug: tenant.slug || `tenant-${newId}`,
      createdAt: new Date().toISOString()
    };
    dbData.tenants.push(newTenant);
    this.write(dbData);
    return newTenant;
  }

  // --- USERS ---
  getUsers() {
    return this.read().users;
  }

  getUsersByTenant(tenantId: number) {
    return this.read().users.filter(u => (u.tenantId ?? DEFAULT_TENANT_ID) === tenantId);
  }

  getUserById(id: number) {
    return this.read().users.find(u => u.id === id);
  }

  getUserByEmailOrPhone(val: string) {
    const clean = val.trim().toLowerCase();
    return this.read().users.find(u => (u.correoOTelefono || '').trim().toLowerCase() === clean);
  }

  insertUser(user: any) {
    const dbData = this.read();
    const newId = dbData.users.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
    const newUser = {
      ...user,
      id: newId,
      tenantId: user.tenantId || DEFAULT_TENANT_ID,
      monedas: user.monedas !== undefined ? user.monedas : 24,
      kycVerificado: user.kycVerificado || false,
      // Sistema de Scoring: todo proveedor inicia con 100 pts = 5.0 estrellas
      puntaje: user.puntaje !== undefined ? user.puntaje : 100,
      cancelacionesInjustificadas: user.cancelacionesInjustificadas !== undefined ? user.cancelacionesInjustificadas : 0,
      createdAt: new Date().toISOString()
    };
    dbData.users.push(newUser);
    this.write(dbData);
    return newUser;
  }

  updateUser(correoOTelefono: string, updates: any) {
    const dbData = this.read();
    const clean = correoOTelefono.trim().toLowerCase();
    const index = dbData.users.findIndex(u => (u.correoOTelefono || '').trim().toLowerCase() === clean);
    if (index !== -1) {
      dbData.users[index] = { ...dbData.users[index], ...updates };
      this.write(dbData);
      return dbData.users[index];
    }
    return null;
  }

  updateUserById(id: number, updates: any) {
    const dbData = this.read();
    const index = dbData.users.findIndex(u => u.id === id);
    if (index !== -1) {
      dbData.users[index] = { ...dbData.users[index], ...updates };
      this.write(dbData);
      return dbData.users[index];
    }
    return null;
  }

  deleteUser(correoOTelefono: string) {
    const dbData = this.read();
    const clean = correoOTelefono.trim().toLowerCase();
    const filtered = dbData.users.filter(u => (u.correoOTelefono || '').trim().toLowerCase() !== clean);
    dbData.users = filtered;
    this.write(dbData);
    return true;
  }

  // --- ORDERS ---
  getOrders() {
    return this.read().orders;
  }

  getOrdersByTenant(tenantId: number) {
    return this.read().orders.filter(o => (o.tenantId ?? DEFAULT_TENANT_ID) === tenantId);
  }

  getOrdersByClienteId(clienteId: number) {
    return this.read().orders.filter(o => o.clienteId === clienteId);
  }

  getOrdersByProveedorId(proveedorId: number) {
    return this.read().orders.filter(o => o.proveedorId === proveedorId);
  }

  getOrderById(id: number) {
    return this.read().orders.find(o => o.id === id);
  }

  insertOrder(order: any) {
    const dbData = this.read();
    const newId = dbData.orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;
    const newOrder = {
      ...order,
      id: newId,
      tenantId: order.tenantId || DEFAULT_TENANT_ID,
      estado: order.estado || 'Buscando proveedor',
      progreso: order.progreso !== undefined ? order.progreso : 25,
      color: order.color || '#FFB400',
      hora: order.hora || 'Ahora mismo',
      calificado: order.calificado || false,
      clienteId: order.clienteId || null,
      proveedorId: order.proveedorId || null,
      createdAt: new Date().toISOString(),
      acceptedAt: order.acceptedAt || null,
      completedAt: null,
      tiempoEjecucion: null
    };
    dbData.orders.push(newOrder);
    this.write(dbData);
    return newOrder;
  }

  updateOrder(id: number, updates: any) {
    const dbData = this.read();
    const index = dbData.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      dbData.orders[index] = { ...dbData.orders[index], ...updates };
      this.write(dbData);
      return dbData.orders[index];
    }
    return null;
  }

  // --- MESSAGES (CHAT) ---
  getMessages(orderId?: number) {
    const msgs = this.read().messages;
    if (orderId !== undefined) {
      return msgs.filter(m => m.orderId === orderId);
    }
    return msgs;
  }

  insertMessage(msg: any) {
    const dbData = this.read();
    const newId = dbData.messages.reduce((max, m) => Math.max(max, m.id || 0), 0) + 1;
    const newMsg = {
      ...msg,
      id: newId,
      tenantId: msg.tenantId || DEFAULT_TENANT_ID,
      senderId: msg.senderId || null,    //  FK al usuario
      createdAt: new Date().toISOString()
    };
    dbData.messages.push(newMsg);
    this.write(dbData);
    return newMsg;
  }

  // --- TRANSACTIONS ---
  getTransactions(userId?: number) {
    const txs = this.read().transactions;
    if (userId !== undefined) {
      return txs.filter(t => t.usuario_id === userId);
    }
    return txs;
  }

  insertTransaction(tx: any) {
    const dbData = this.read();
    const newId = dbData.transactions.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
    const newTx = {
      ...tx,
      id: newId,
      createdAt: new Date().toISOString()
    };
    dbData.transactions.push(newTx);
    this.write(dbData);
    return newTx;
  }

  // --- RATINGS (NUEVA TABLA) ---
  getRatings(orderId?: number) {
    const rtgs = this.read().ratings;
    if (orderId !== undefined) {
      return rtgs.filter(r => r.orderId === orderId);
    }
    return rtgs;
  }

  getRatingsByCalificado(calificadoId: number) {
    return this.read().ratings.filter(r => r.calificadoId === calificadoId);
  }

  insertRating(rating: any) {
    const dbData = this.read();
    const newId = dbData.ratings.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
    const newRating = {
      ...rating,
      id: newId,
      createdAt: new Date().toISOString()
    };
    dbData.ratings.push(newRating);
    this.write(dbData);
    return newRating;
  }

  // --- APPLICATIONS (NUEVA TABLA) ---
  getApplications(orderId?: number) {
    const apps = this.read().applications;
    if (orderId !== undefined) {
      return apps.filter(a => a.orderId === orderId);
    }
    return apps;
  }

  getApplicationsByProveedor(proveedorId: number) {
    return this.read().applications.filter(a => a.proveedorId === proveedorId);
  }

  getApplicationExistente(orderId: number, proveedorId: number) {
    return this.read().applications.find(a => a.orderId === orderId && a.proveedorId === proveedorId);
  }

  insertApplication(app: any) {
    const dbData = this.read();
    const newId = dbData.applications.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const newApp = {
      ...app,
      id: newId,
      estado: app.estado || 'pendiente',
      createdAt: new Date().toISOString()
    };
    dbData.applications.push(newApp);
    this.write(dbData);
    return newApp;
  }

  updateApplication(id: number, updates: any) {
    const dbData = this.read();
    const index = dbData.applications.findIndex(a => a.id === id);
    if (index !== -1) {
      dbData.applications[index] = { ...dbData.applications[index], ...updates };
      this.write(dbData);
      return dbData.applications[index];
    }
    return null;
  }

  /**
   * Promedio de calificaciones de un proveedor específico + scoring (Tarea 3.3)
   */
  getProveedorStats(proveedorId: number) {
    const ratingsList = this.getRatingsByCalificado(proveedorId);
    const totalJobs = this.getOrdersByProveedorId(proveedorId).filter(o => o.estado === 'Completado').length;
    const promedio = ratingsList.length > 0
      ? ratingsList.reduce((sum, r) => sum + (r.estrellas || 0), 0) / ratingsList.length
      : 0;
    const proveedor = this.getUserById(proveedorId);
    const puntaje = proveedor?.puntaje !== undefined ? proveedor.puntaje : 100;
    const cancelaciones = proveedor?.cancelacionesInjustificadas !== undefined ? proveedor.cancelacionesInjustificadas : 0;
    return {
      totalCalificaciones: ratingsList.length,
      promedioEstrellas: Math.round(promedio * 10) / 10,
      totalTrabajosCompletados: totalJobs,
      puntaje,
      estrellasScoring: Math.round((puntaje / 20) * 10) / 10,
      cancelacionesInjustificadas: cancelaciones,
    };
  }

  // --- PROVIDER_CANCELACIONES (Sistema de Scoring) ---
  getProviderCancelaciones(proveedorId?: number, orderId?: number) {
    const list = this.read().provider_cancelaciones || [];
    const filtered = proveedorId !== undefined
      ? list.filter(c => c.proveedorId === proveedorId)
      : list;
    return orderId !== undefined ? filtered.filter(c => c.orderId === orderId) : filtered;
  }

  insertProviderCancelacion(cancelacion: any) {
    const dbData = this.read();
    if (!dbData.provider_cancelaciones) dbData.provider_cancelaciones = [];
    const newId = dbData.provider_cancelaciones.reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;
    const newCancelacion = {
      ...cancelacion,
      id: newId,
      tenantId: cancelacion.tenantId || DEFAULT_TENANT_ID,
      justificada: cancelacion.justificada || false,
      puntosPenalizados: cancelacion.puntosPenalizados || 0,
      createdAt: new Date().toISOString()
    };
    dbData.provider_cancelaciones.push(newCancelacion);
    this.write(dbData);
    return newCancelacion;
  }

  /**
   * Aplica la penalización (o no) por una cancelación de servicio al proveedor.
   * - Cancelación injustificada: resta 10 puntos e incrementa el contador.
   * - Cancelación justificada: no afecta el puntaje.
   * Devuelve el proveedor actualizado y el registro de cancelación.
   */
  registrarCancelacionProveedor(orderId: number, proveedorId: number, justificada: boolean, motivo: string | null) {
    const proveedor = this.getUserById(proveedorId);
    if (!proveedor) return null;

    const puntosPenalizados = justificada ? 0 : 10;
    const puntosActuales = proveedor.puntaje !== undefined ? proveedor.puntaje : 100;
    const cancelacionesPrevias = proveedor.cancelacionesInjustificadas !== undefined ? proveedor.cancelacionesInjustificadas : 0;

    const proveedorActualizado = this.updateUserById(proveedorId, {
      puntaje: justificada ? puntosActuales : Math.max(0, puntosActuales - puntosPenalizados),
      cancelacionesInjustificadas: justificada ? cancelacionesPrevias : cancelacionesPrevias + 1,
      fechaUltimaPenalizacion: justificada ? proveedor.fechaUltimaPenalizacion : new Date().toISOString(),
    });

    const cancelacion = this.insertProviderCancelacion({
      orderId,
      proveedorId,
      justificada,
      motivo,
      puntosPenalizados,
    });

    return { proveedor: proveedorActualizado, cancelacion, puntosPenalizados, puntosActuales: proveedorActualizado.puntaje };
  }

  // --- REPORTS (NUEVA TABLA) ---
  getReports(pedidoId?: number) {
    const rps = this.read().reports || [];
    if (pedidoId !== undefined) {
      return rps.filter(r => r.pedidoId === pedidoId);
    }
    return rps;
  }

  insertReport(report: any) {
    const dbData = this.read();
    if (!dbData.reports) dbData.reports = [];
    const newId = dbData.reports.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
    const newReport = {
      ...report,
      id: newId,
      estado: report.estado || 'pendiente',
      createdAt: new Date().toISOString()
    };
    dbData.reports.push(newReport);
    this.write(dbData);
    return newReport;
  }
}

export const localDb = new LocalDb();

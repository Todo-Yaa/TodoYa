import { pgTable, serial, text, varchar, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

// Tabla de Usuarios (Clientes residenciales, Empresas B2B y Proveedores)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 256 }).notNull(),
  correoOTelefono: varchar('correo_o_telefono', { length: 256 }).notNull().unique(),
  rol: varchar('rol', { length: 50 }).$type<'client' | 'provider' | 'business'>().notNull().default('client'),
  contrasena: text('contrasena'),
  
  // Configuración de Proveedor OAuth o Registro Normal
  tipoProveedor: varchar('tipo_proveedor', { length: 50 }).$type<'google' | 'linkedin' | 'normal'>().default('normal'),
  tipoEntidad: varchar('tipo_entidad', { length: 50 }).$type<'natural' | 'empresa'>().default('natural'),
  
  // Celular y Código de País (doble verificación y soporte regional)
  celular: varchar('celular', { length: 50 }),
  codigoPais: varchar('codigo_pais', { length: 20 }),
  
  // Campos específicos B2B / Empresa
  nit: varchar('nit', { length: 50 }),
  correoFacturacion: varchar('correo_facturacion', { length: 256 }),
  rubro: varchar('rubro', { length: 256 }),
  ofreceB2B: boolean('ofrece_b2b').default(false),

  // Configuración del perfil de Proveedor (Onboarding)
  proveedorConfigurado: boolean('proveedor_configurado').default(false),
  serviciosOfrecidos: jsonb('servicios_ofrecidos').$type<string[]>(), // Guardado como JSONB para compatibilidad de arrays
  anosExperiencia: varchar('anos_experiencia', { length: 50 }),
  descripcionProveedor: text('descripcion_provider'),
  coberturaB2B: varchar('cobertura_b2b', { length: 100 }), // Local o Nacional
  monedas: integer('monedas').default(24), // Sistema de billetera (saldo de monedas)
  planId: varchar('plan_id', { length: 50 }).$type<'provider_1' | 'provider_2' | 'provider_3' | 'business_1' | 'business_2' | 'business_3'>().default('provider_1'),
  
  // Token para notificaciones push de Expo
  pushToken: text('push_token'),

  // Verificación de Identidad KYC (Powered by Claude Sonnet 4.5 via decouple-services)
  kycVerificado: boolean('kyc_verificado').default(false),
  kycDetalles: text('kyc_detalles'), // Resultado de Claude: descripción del documento analizado

  // Estado de baneo/suspensión del usuario por denuncias
  baneado: boolean('baneado').default(false),
  fotoPerfil: text('foto_perfil'),
  fechaUltimaModificacionFoto: varchar('fecha_ultima_modificacion_foto', { length: 100 }),
  fechaUltimaModificacionDatos: varchar('fecha_ultima_modificacion_datos', { length: 100 }),
  b2bTrialStartDate: timestamp('b2b_trial_start_date'),

  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla de Pedidos / Solicitudes de servicio
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  
  // ✅ RELACIONAL: FKs al cliente y proveedor por ID
  clienteId: integer('cliente_id').references(() => users.id, { onDelete: 'set null' }), // Quién solicita el servicio
  proveedorId: integer('proveedor_id').references(() => users.id, { onDelete: 'set null' }), // Quién ejecuta el servicio

  // Campos de display rápido (mantenidos para compatibilidad y UI)
  proveedor: varchar('proveedor', { length: 256 }), // Nombre del proveedor (display)
  servicio: varchar('servicio', { length: 256 }).notNull(), // Categoría (Plomería, Electricidad, etc.)
  descripcion: text('descripcion').notNull(),
  estado: varchar('estado', { length: 50 }).$type<'Buscando proveedor' | 'En progreso' | 'Completado'>().default('Buscando proveedor').notNull(),
  progreso: integer('progreso').default(0).notNull(), // 0%, 25%, 50%, 100%
  hora: varchar('hora', { length: 100 }).notNull(), // Fecha/Hora formateada de creación
  color: varchar('color', { length: 50 }).default('#FFB400'), // Color de la tarjeta/tag
  precio: varchar('precio', { length: 100 }).notNull(), // Ej: "150 Bs." o "Presupuesto: 500 Bs."
  urgencia: varchar('urgencia', { length: 50 }).$type<'Normal' | 'Alta'>().default('Normal').notNull(),
  
  // Calificación del servicio (Bloqueo Estilo Jango — mantenido para queries rápidos)
  calificado: boolean('calificado').default(false),
  calificacionEstrellas: integer('calificacion_estrellas'),
  calificacionEtiquetas: jsonb('calificacion_etiquetas').$type<string[]>(),
  
  // Tiempos de ejecución
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  tiempoEjecucion: varchar('tiempo_ejecucion', { length: 100 }), // Ej: "45 minutos"
}, (table) => ({
  clienteIdx: index('orders_cliente_idx').on(table.clienteId),
  proveedorIdx: index('orders_proveedor_idx').on(table.proveedorId),
}));

// Tabla de Mensajes de Chat en Tiempo Real (por orden)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(), // ✅ FK al pedido
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }),          // ✅ FK al usuario remitente
  senderName: varchar('sender_name', { length: 256 }).notNull(),      // Display rápido
  messageText: text('message_text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdx: index('messages_order_idx').on(table.orderId),
  senderIdx: index('messages_sender_idx').on(table.senderId),
}));

// Tabla de Historial de Transacciones (Billetera)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  usuario_id: integer('usuario_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // ✅ FK al usuario
  tipo: varchar('tipo', { length: 50 }).$type<'recarga' | 'gasto'>().notNull(),
  monto_monedas: integer('monto_monedas').notNull(),
  detalle: varchar('detalle', { length: 256 }).notNull(), // Ej: "Recarga de monedas (Prueba)" o "Postulación a lead #23"
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  usuarioIdx: index('transactions_usuario_idx').on(table.usuario_id),
}));

// ✅ NUEVA TABLA: Calificaciones (Separadas del pedido para mayor flexibilidad)
export const ratings = pgTable('ratings', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),       // ✅ FK al pedido calificado
  calificadorId: integer('calificador_id').references(() => users.id, { onDelete: 'cascade' }),      // ✅ Quién califica
  calificadoId: integer('calificado_id').references(() => users.id, { onDelete: 'cascade' }),        // ✅ A quién se califica
  estrellas: integer('estrellas').notNull(),                                 // 1 a 5 estrellas
  etiquetas: jsonb('etiquetas').$type<string[]>(),                           // ["Puntual", "Limpio", "Profesional"]
  comentario: text('comentario'),                                            // Comentario libre (opcional)
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdx: index('ratings_order_idx').on(table.orderId),
  calificadorIdx: index('ratings_calificador_idx').on(table.calificadorId),
  calificadoIdx: index('ratings_calificado_idx').on(table.calificadoId),
}));

// ✅ NUEVA TABLA: Postulaciones de Proveedores a Pedidos (Historial completo)
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),       // ✅ FK al pedido
  proveedorId: integer('proveedor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // ✅ FK al proveedor
  estado: varchar('estado', { length: 50 })
    .$type<'pendiente' | 'aceptado' | 'rechazado'>()
    .default('pendiente')
    .notNull(),
  monedasGastadas: integer('monedas_gastadas').notNull(),                    // Costo de la postulación
  notaPersonal: text('nota_personal'),                                       // Mensaje del proveedor al cliente
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdx: index('applications_order_idx').on(table.orderId),
  proveedorIdx: index('applications_proveedor_idx').on(table.proveedorId),
}));

// Tabla de Reportes / Denuncias a Proveedores
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id').references(() => orders.id, { onDelete: 'cascade' }), // Pedido donde ocurrió el problema (opcional)
  reportanteId: integer('reportante_id').references(() => users.id, { onDelete: 'cascade' }), // Quién denuncia
  reportadoNombre: varchar('reportado_nombre', { length: 256 }).notNull(), // Nombre del proveedor reportado
  motivo: varchar('motivo', { length: 256 }).notNull(), // Motivo de la denuncia
  descripcion: text('descripcion').notNull(), // Detalles del problema
  estado: varchar('estado', { length: 50 }).$type<'pendiente' | 'revisado' | 'baneado' | 'descartado'>().default('pendiente'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pedidoIdx: index('reports_pedido_idx').on(table.pedidoId),
  reportanteIdx: index('reports_reportante_idx').on(table.reportanteId),
}));


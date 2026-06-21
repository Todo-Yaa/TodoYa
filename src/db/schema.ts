import { pgTable, serial, text, varchar, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';

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
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla de Historial de Transacciones (Billetera)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  usuario_id: integer('usuario_id').references(() => users.id).notNull(),
  tipo: varchar('tipo', { length: 50 }).$type<'recarga' | 'gasto'>().notNull(),
  monto_monedas: integer('monto_monedas').notNull(),
  detalle: varchar('detalle', { length: 256 }).notNull(), // Ej: "Recarga de monedas (Prueba)" o "Postulación a lead #23"
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla de Pedidos / Solicitudes de servicio
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  proveedor: varchar('proveedor', { length: 256 }), // Nombre o ID del proveedor asignado
  servicio: varchar('servicio', { length: 256 }).notNull(), // Categoría (Plomería, Electricidad, etc.)
  descripcion: text('descripcion').notNull(),
  estado: varchar('estado', { length: 50 }).$type<'Buscando proveedor' | 'En progreso' | 'Completado'>().default('Buscando proveedor').notNull(),
  progreso: integer('progreso').default(0).notNull(), // 0%, 25%, 50%, 100%
  hora: varchar('hora', { length: 100 }).notNull(), // Fecha/Hora formateada de creación
  color: varchar('color', { length: 50 }).default('#FFB400'), // Color de la tarjeta/tag
  precio: varchar('precio', { length: 100 }).notNull(), // Ej: "150 Bs." o "Presupuesto: 500 Bs."
  urgencia: varchar('urgencia', { length: 50 }).$type<'Normal' | 'Alta'>().default('Normal').notNull(),
  
  // Calificación del servicio (Bloqueo Estilo Jango)
  calificado: boolean('calificado').default(false),
  calificacionEstrellas: integer('calificacion_estrellas'),
  calificacionEtiquetas: jsonb('calificacion_etiquetas').$type<string[]>(),
  
  // Tiempos de ejecución
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  tiempoEjecucion: varchar('tiempo_ejecucion', { length: 100 }), // Ej: "45 minutos"
});

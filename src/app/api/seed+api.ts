import { db, isDbConnected } from '../../db';
import { users, orders } from '../../db/schema';

/**
 * POST /api/seed
 * Siembra los datos de demostración en Neon.db si las tablas están vacías.
 * Solo inserta si no existen registros para evitar duplicados.
 */
export async function POST(request: Request) {
  if (!isDbConnected() || !db) {
    return Response.json({ error: 'Neon.db no disponible' }, { status: 503 });
  }

  try {
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    
    if (existingUsers.length > 0) {
      return Response.json({ 
        status: 'skipped', 
        message: 'Neon.db ya tiene datos. No se sobreescribió.' 
      });
    }

    // ── Insertar Usuarios Demo ──────────────────────────────────
    const seedUsers = await db.insert(users).values([
      {
        nombre: 'Luis Alberto M.',
        correoOTelefono: 'luis@todoya.com',
        rol: 'client',
        contrasena: 'demo1234',
        tipoProveedor: 'normal',
        tipoEntidad: 'natural',
        monedas: 24,
        kycVerificado: false,
      },
      {
        nombre: 'Juan Ríos',
        correoOTelefono: 'juan.rios@todoya.com',
        rol: 'provider',
        contrasena: 'demo1234',
        tipoProveedor: 'normal',
        tipoEntidad: 'natural',
        proveedorConfigurado: true,
        serviciosOfrecidos: ['Plomería'],
        anosExperiencia: 'Más de 3 años',
        descripcionProveedor: 'Plomero certificado con 5 años de experiencia residencial.',
        monedas: 24,
        kycVerificado: true,
        kycDetalles: 'Documento verificado',
      },
      {
        nombre: 'Corporación Alfa S.A.',
        correoOTelefono: 'empresa@todoya.com',
        rol: 'business',
        contrasena: 'demo1234',
        tipoProveedor: 'normal',
        tipoEntidad: 'empresa',
        nit: '481920028',
        correoFacturacion: 'facturas@alfa.corp.bo',
        rubro: 'Papelería',
        monedas: 24,
        kycVerificado: true,
        kycDetalles: 'NIT e identidad B2B verificados',
      },
      {
        nombre: 'Imprenta y Gráfica Beta',
        correoOTelefono: 'proveedor_empresa@todoya.com',
        rol: 'provider',
        contrasena: 'demo1234',
        tipoProveedor: 'normal',
        tipoEntidad: 'empresa',
        nit: '839201992',
        correoFacturacion: 'facturas@beta.bo',
        rubro: 'Branding & Lettering',
        ofreceB2B: true,
        proveedorConfigurado: true,
        serviciosOfrecidos: ['Branding & Lettering'],
        anosExperiencia: 'Más de 3 años',
        descripcionProveedor: 'Ofrecemos soluciones gráficas y branding corporativo de alta calidad.',
        monedas: 24,
        kycVerificado: true,
        kycDetalles: 'NIT e identidad B2B verificados',
      },
    ]).returning();

    // Mapear correo → ID para las FK de órdenes
    const emailToId: Record<string, number> = {};
    seedUsers.forEach(u => { emailToId[u.correoOTelefono] = u.id; });

    // ── Insertar Pedidos Demo ───────────────────────────────────
    await db.insert(orders).values([
      {
        titulo: 'Fuga en lavabo',
        servicio: 'Plomería',
        descripcion: 'Tengo una fuga debajo del lavabo del baño, sale mucha agua.',
        precio: 'Bs. 80–150',
        urgencia: 'Normal',
        proveedor: 'Juan Ríos',
        clienteId: emailToId['luis@todoya.com'],
        proveedorId: emailToId['juan.rios@todoya.com'],
        estado: 'En progreso',
        progreso: 65,
        color: '#FFB400',
        hora: 'Hoy 10:30',
        calificado: false,
        acceptedAt: new Date(),
      },
      {
        titulo: 'Instalación de AC',
        servicio: 'Climatización',
        descripcion: 'Necesito instalar un aire acondicionado split de 12000 BTU en el dormitorio.',
        precio: 'Bs. 150–400',
        urgencia: 'Normal',
        proveedor: null,
        clienteId: emailToId['luis@todoya.com'],
        proveedorId: null,
        estado: 'Buscando proveedor',
        progreso: 25,
        color: '#FFB400',
        hora: 'Hace 45 min',
        calificado: false,
      },
      {
        titulo: 'Pintura sala',
        servicio: 'Pintura',
        descripcion: 'Pintar la sala de estar completa, paredes y techo.',
        precio: 'Bs. 120–300',
        urgencia: 'Normal',
        proveedor: 'María López',
        clienteId: emailToId['luis@todoya.com'],
        proveedorId: null,
        estado: 'Completado',
        progreso: 100,
        color: '#4caf50',
        hora: '12 Jun 2026',
        calificado: true,
        calificacionEstrellas: 5,
        calificacionEtiquetas: ['Puntual', 'Limpio'],
        acceptedAt: new Date(Date.now() - 3600000 * 3),
        completedAt: new Date(),
        tiempoEjecucion: '2 horas',
      },
      {
        titulo: 'Papelería e Insumos',
        servicio: 'Papelería & Oficina',
        descripcion: 'Requerimos 20 resmas de papel bond tamaño carta, carpetas membretadas y bolígrafos.',
        precio: 'Bs. 300–600',
        urgencia: 'Normal',
        proveedor: null,
        clienteId: emailToId['empresa@todoya.com'],
        proveedorId: null,
        estado: 'Buscando proveedor',
        progreso: 25,
        color: '#6366F1',
        hora: 'Hace 2 horas',
        calificado: false,
      },
    ]);

    return Response.json({ 
      status: 'success', 
      message: `${seedUsers.length} usuarios y 4 pedidos demo insertados en Neon.db`,
      users: seedUsers.map(u => ({ id: u.id, nombre: u.nombre, correoOTelefono: u.correoOTelefono }))
    });
  } catch (error: any) {
    console.error('[Seed] Error al sembrar datos demo en Neon:', error);
    return Response.json({ error: 'Error al sembrar datos', details: error.message }, { status: 500 });
  }
}

// GET: Verificar si Neon ya tiene datos o está vacío
export async function GET(request: Request) {
  if (!isDbConnected() || !db) {
    return Response.json({ seeded: false, reason: 'Neon no disponible' });
  }

  try {
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
    
    return Response.json({ 
      seeded: existingUsers.length > 0,
      counts: {
        users: existingUsers.length,
        orders: existingOrders.length,
      }
    });
  } catch (e: any) {
    return Response.json({ seeded: false, reason: e.message });
  }
}

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL o EXPO_PUBLIC_DATABASE_URL no está configurada en .env');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Iniciando seeder para Neon.db...');

  try {
    // 1. Limpiar datos existentes
    console.log('Limpiando tablas...');
    await db.delete(schema.orders);
    await db.delete(schema.users);

    // 2. Insertar usuarios semilla
    console.log('Insertando usuarios...');
    await db.insert(schema.users).values([
      { nombre: 'Luis Alberto M.', correoOTelefono: 'luis@todoya.com', rol: 'client', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural' },
      { nombre: 'Juan Ríos', correoOTelefono: 'juan.rios@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'natural', proveedorConfigurado: true, serviciosOfrecidos: ['Plomería'], anosExperiencia: 'Más de 3 años', descripcionProveedor: 'Plomero certificado egresado de SENATI en Instalaciones Sanitarias y Gas. Especialista en fugas, tuberías y mantenimiento.' },
      { nombre: 'Empresa Aspersud', correoOTelefono: 'empresa@todoya.com', rol: 'business', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '481920028', correoFacturacion: 'facturas@aspersud.com', rubro: 'Decoración & Catering' },
      { nombre: 'Nefi Store', correoOTelefono: 'proveedor_empresa@todoya.com', rol: 'provider', contrasena: 'demo1234', tipoProveedor: 'normal', tipoEntidad: 'empresa', nit: '839201992', correoFacturacion: 'facturas@nefistore.com', rubro: 'Reparación de Laptops e Impresoras', ofreceB2B: true, proveedorConfigurado: true, serviciosOfrecidos: ['Técnico de laptop-celulares', 'Servicios B2B'], anosExperiencia: 'Más de 5 años', descripcionProveedor: 'Reparación especializada de laptops, computadoras e impresoras corporativas.' }
    ]);

    // 3. Insertar pedidos semilla
    console.log('Insertando pedidos...');
    await db.insert(schema.orders).values([
      {
        titulo: "Fuga en lavabo",
        proveedor: "Juan Ríos",
        servicio: "Plomería",
        descripcion: "Tengo una fuga debajo del lavabo del baño, sale mucha agua.",
        estado: "En progreso",
        progreso: 65,
        hora: "Hoy 10:30",
        color: "#FFB400",
        precio: "S/. 80–150",
        urgencia: "Normal",
        acceptedAt: new Date(),
      },
      {
        titulo: "Instalación de AC",
        proveedor: null,
        servicio: "Climatización",
        descripcion: "Necesito instalar un aire acondicionado split de 12000 BTU en el dormitorio.",
        estado: "Buscando proveedor",
        progreso: 25,
        hora: "Hace 45 min",
        color: "#FFB400",
        precio: "S/. 150–400",
        urgencia: "Normal"
      },
      {
        titulo: "Pintura sala",
        proveedor: "María López",
        servicio: "Pintura",
        descripcion: "Pintar la sala de estar completa, paredes y techo.",
        estado: "Completado",
        progreso: 100,
        hora: "12 Jun 2026",
        color: "#4caf50",
        precio: "S/. 120–300",
        urgencia: "Normal",
        completedAt: new Date(),
        tiempoEjecucion: "2 horas",
        calificado: true,
        calificacionEstrellas: 5,
        calificacionEtiquetas: ["Puntual", "Limpio"]
      },
      {
        titulo: "Papelería e Insumos",
        proveedor: null,
        servicio: "Papelería & Oficina",
        descripcion: "Requerimos 20 resmas de papel bond tamaño carta, carpetas membretadas y bolígrafos para uso corporativo.",
        estado: "Buscando proveedor",
        progreso: 25,
        hora: "Hace 2 horas",
        color: "#6366F1",
        precio: "S/. 300–600",
        urgencia: "Normal"
      }
    ]);

    console.log('Base de datos Neon poblada correctamente con datos de prueba.');
  } catch (error) {
    console.error('Error ejecutando el seeder:', error);
  } finally {
    process.exit(0);
  }
}

seed();

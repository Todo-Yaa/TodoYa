import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// GET: Obtener todos los usuarios registrados
export async function GET(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Usando base de datos local simulada' });
    }

    const allUsers = await db.select().from(users);
    return Response.json({ status: 'success', data: allUsers });
  } catch (error: any) {
    console.error('Error in GET /api/users:', error);
    return Response.json({ error: 'Error al obtener usuarios', details: error.message }, { status: 500 });
  }
}

// POST: Registrar un nuevo usuario (manual o social OAuth)
export async function POST(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Registro simulado de forma local exitoso' });
    }

    const body = await request.json();
    const { nombre, correoOTelefono, rol, contrasena, tipoProveedor = 'normal', tipoEntidad = 'natural', nit, correoFacturacion, rubro, ofreceB2B = false } = body;

    // Verificar si ya existe el correo/teléfono
    const usuarioExistente = await db.select().from(users).where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase())).limit(1);

    if (usuarioExistente.length > 0) {
      // Si ya existe (p. ej. en login social), actualizamos los datos y lo devolvemos
      const updated = await db.update(users)
        .set({
          nombre,
          rol,
          nit: nit || usuarioExistente[0].nit,
          correoFacturacion: correoFacturacion || usuarioExistente[0].correoFacturacion,
          rubro: rubro || usuarioExistente[0].rubro,
          ofreceB2B: ofreceB2B || usuarioExistente[0].ofreceB2B,
        })
        .where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase()))
        .returning();
      return Response.json({ status: 'success', action: 'updated', user: updated[0] });
    }

    // Registrar nuevo
    const nuevoUsuario = await db.insert(users).values({
      nombre,
      correoOTelefono: correoOTelefono.trim().toLowerCase(),
      rol,
      contrasena,
      tipoProveedor,
      tipoEntidad,
      nit,
      correoFacturacion,
      rubro,
      ofreceB2B,
    }).returning();

    return Response.json({ status: 'success', action: 'created', user: nuevoUsuario[0] });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return Response.json({ error: 'Error al registrar usuario', details: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración del perfil del Proveedor (Onboarding)
export async function PUT(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Perfil de proveedor configurado localmente' });
    }

    const body = await request.json();
    const { correoOTelefono, serviciosOfrecidos, anosExperiencia, descripcionProveedor, coberturaB2B } = body;

    if (!correoOTelefono) {
      return Response.json({ error: 'El identificador de correo/teléfono es requerido' }, { status: 400 });
    }

    const updated = await db.update(users)
      .set({
        proveedorConfigurado: true,
        rol: 'provider',
        serviciosOfrecidos,
        anosExperiencia,
        descripcionProveedor,
        coberturaB2B,
        ofreceB2B: CoberturaB2BValida(coberturaB2B), // Auxiliar para empresas
      })
      .where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase()))
      .returning();

    if (updated.length === 0) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return Response.json({ status: 'success', user: updated[0] });
  } catch (error: any) {
    console.error('Error in PUT /api/users:', error);
    return Response.json({ error: 'Error al actualizar perfil del proveedor', details: error.message }, { status: 500 });
  }
}

function CoberturaB2BValida(cobertura: string | undefined): boolean {
  return cobertura !== undefined && (cobertura === 'Local' || cobertura === 'Nacional');
}

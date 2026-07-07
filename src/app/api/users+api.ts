import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { localDb } from '../../db/localDb';

// GET: Obtener todos los registrados
export async function GET(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      const localUsers = localDb.getUsers();
      return Response.json({ status: 'success', data: localUsers });
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
    const body = await request.json();
    const { nombre, correoOTelefono, rol, contrasena, tipoProveedor = 'normal', tipoEntidad = 'natural', nit, correoFacturacion, rubro, ofreceB2B = false, celular, codigoPais } = body;

    if (!isDbConnected() || !db) {
      const usuarioExistente = localDb.getUserByEmailOrPhone(correoOTelefono);
      if (usuarioExistente) {
        const updated = localDb.updateUser(correoOTelefono, {
          nombre,
          rol,
          nit: nit || usuarioExistente.nit,
          correoFacturacion: correoFacturacion || usuarioExistente.correoFacturacion,
          rubro: rubro || usuarioExistente.rubro,
          ofreceB2B: ofreceB2B || usuarioExistente.ofreceB2B,
          celular: celular || usuarioExistente.celular,
          codigoPais: codigoPais || usuarioExistente.codigoPais,
        });
        return Response.json({ status: 'success', action: 'updated', user: updated });
      }
      const nuevoUsuario = localDb.insertUser({
        nombre,
        correoOTelefono,
        rol,
        contrasena,
        tipoProveedor,
        tipoEntidad,
        nit,
        correoFacturacion,
        rubro,
        ofreceB2B,
        celular,
        codigoPais,
      });
      return Response.json({ status: 'success', action: 'created', user: nuevoUsuario });
    }

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
          celular: celular || usuarioExistente[0].celular,
          codigoPais: codigoPais || usuarioExistente[0].codigoPais,
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
      celular,
      codigoPais,
    }).returning();

    return Response.json({ status: 'success', action: 'created', user: nuevoUsuario[0] });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return Response.json({ error: 'Error al registrar usuario', details: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración del perfil del Proveedor (Onboarding) o Plan de Suscripción
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { correoOTelefono, serviciosOfrecidos, anosExperiencia, descripcionProveedor, coberturaB2B, planId, pushToken, kycVerificado, kycDetalles, baneado } = body;

    if (!correoOTelefono) {
      return Response.json({ error: 'El identificador de correo/teléfono es requerido' }, { status: 400 });
    }

    const updateData: any = {};
    if (planId !== undefined) {
      updateData.planId = planId;
    }
    if (pushToken !== undefined) {
      updateData.pushToken = pushToken;
    }
    if (serviciosOfrecidos !== undefined) {
      updateData.proveedorConfigurado = true;
      updateData.rol = 'provider';
      updateData.serviciosOfrecidos = serviciosOfrecidos;
    }
    if (anosExperiencia !== undefined) updateData.anosExperiencia = anosExperiencia;
    if (descripcionProveedor !== undefined) updateData.descripcionProveedor = descripcionProveedor;
    if (coberturaB2B !== undefined) {
      updateData.coberturaB2B = coberturaB2B;
      updateData.ofreceB2B = CoberturaB2BValida(coberturaB2B);
    }
    if (kycVerificado !== undefined) {
      updateData.kycVerificado = kycVerificado;
    }
    if (kycDetalles !== undefined) {
      updateData.kycDetalles = kycDetalles;
    }
    if (baneado !== undefined) {
      updateData.baneado = baneado;
    }

    if (!isDbConnected() || !db) {
      const updated = localDb.updateUser(correoOTelefono, updateData);
      if (!updated) {
        return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      return Response.json({ status: 'success', user: updated });
    }

    const updated = await db.update(users)
      .set(updateData)
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

// DELETE: Eliminar una cuenta de usuario
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const correoOTelefono = url.searchParams.get('correoOTelefono');

    if (!correoOTelefono) {
      return Response.json({ error: 'El correo/teléfono es requerido' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      localDb.deleteUser(correoOTelefono);
      return Response.json({ status: 'success', message: 'Usuario eliminado de la base de datos local' });
    }

    await db.delete(users).where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase()));
    
    return Response.json({ status: 'success', message: 'Usuario eliminado de Neon.db' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users:', error);
    return Response.json({ error: 'Error al eliminar usuario', details: error.message }, { status: 500 });
  }
}

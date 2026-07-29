import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { localDb } from '../../db/localDb';
import { checkApiRateLimit } from '../../utils/rate-limiter';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../../utils/security';

// GET: Obtener todos los registrados
export async function GET(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 60, 60000);
  if (rateLimitError) return rateLimitError;

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
  const rateLimitError = checkApiRateLimit(request, 15, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { nombre: rawNombre, correoOTelefono: rawCorreo, rol: rawRol, contrasena, tipoProveedor = 'normal', tipoEntidad = 'natural', nit: rawNit, correoFacturacion: rawCorreoFact, rubro: rawRubro, ofreceB2B = false, celular: rawCelular, codigoPais } = body;

    const nombre = sanitizeText(rawNombre);
    const correoOTelefono = rawCorreo ? sanitizeText(rawCorreo).toLowerCase() : '';
    const rol = (rawRol && ['client', 'provider', 'business'].includes(rawRol) ? rawRol : 'client') as 'client' | 'provider' | 'business';
    const nit = rawNit ? sanitizeText(rawNit) : null;
    const correoFacturacion = rawCorreoFact ? sanitizeEmail(rawCorreoFact) : null;
    const rubro = rawRubro ? sanitizeText(rawRubro) : null;
    const celular = rawCelular ? sanitizePhone(rawCelular) : null;

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
    const usuarioExistente = await db.select().from(users).where(eq(users.correoOTelefono, correoOTelefono)).limit(1);

    if (usuarioExistente.length > 0) {
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
        .where(eq(users.correoOTelefono, correoOTelefono))
        .returning();
      return Response.json({ status: 'success', action: 'updated', user: updated[0] });
    }

    // Registrar nuevo
    const nuevoUsuario = await db.insert(users).values({
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
    }).returning();

    return Response.json({ status: 'success', action: 'created', user: nuevoUsuario[0] });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return Response.json({ error: 'Error al registrar usuario', details: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración del perfil del Proveedor (Onboarding) o Plan de Suscripción
export async function PUT(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { correoOTelefono, serviciosOfrecidos, anosExperiencia, descripcionProveedor, coberturaB2B, planId, pushToken, kycVerificado, kycDetalles, baneado, fotoPerfil, fechaUltimaModificacionFoto, nombre, nuevoCorreoOTelefono, celular, fechaUltimaModificacionDatos } = body;

    if (!correoOTelefono) {
      return Response.json({ error: 'El identificador de correo/teléfono es requerido' }, { status: 400 });
    }

    const cleanIdentifier = sanitizeText(correoOTelefono).toLowerCase();

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = sanitizeText(nombre);
    if (nuevoCorreoOTelefono !== undefined) updateData.correoOTelefono = sanitizeText(nuevoCorreoOTelefono).toLowerCase();
    if (celular !== undefined) updateData.celular = sanitizePhone(celular);
    if (fechaUltimaModificacionDatos !== undefined) updateData.fechaUltimaModificacionDatos = fechaUltimaModificacionDatos;
    if (planId !== undefined) updateData.planId = sanitizeText(planId);
    if (pushToken !== undefined) updateData.pushToken = sanitizeText(pushToken);
    if (serviciosOfrecidos !== undefined) {
      updateData.proveedorConfigurado = true;
      updateData.rol = 'provider';
      updateData.serviciosOfrecidos = Array.isArray(serviciosOfrecidos) ? serviciosOfrecidos.map((s: string) => sanitizeText(s)) : serviciosOfrecidos;
    }
    if (anosExperiencia !== undefined) updateData.anosExperiencia = sanitizeText(anosExperiencia);
    if (descripcionProveedor !== undefined) updateData.descripcionProveedor = sanitizeText(descripcionProveedor);
    if (coberturaB2B !== undefined) {
      updateData.coberturaB2B = sanitizeText(coberturaB2B);
      updateData.ofreceB2B = CoberturaB2BValida(updateData.coberturaB2B);
    }
    if (kycVerificado !== undefined) updateData.kycVerificado = kycVerificado;
    if (kycDetalles !== undefined) updateData.kycDetalles = sanitizeText(kycDetalles);
    if (baneado !== undefined) updateData.baneado = baneado;
    if (fotoPerfil !== undefined) updateData.fotoPerfil = fotoPerfil;
    if (fechaUltimaModificacionFoto !== undefined) updateData.fechaUltimaModificacionFoto = fechaUltimaModificacionFoto;

    if (!isDbConnected() || !db) {
      const updated = localDb.updateUser(cleanIdentifier, updateData);
      if (!updated) {
        return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      return Response.json({ status: 'success', user: updated });
    }

    const updated = await db.update(users)
      .set(updateData)
      .where(eq(users.correoOTelefono, cleanIdentifier))
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
  const rateLimitError = checkApiRateLimit(request, 10, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const url = new URL(request.url);
    const correoOTelefono = url.searchParams.get('correoOTelefono');

    if (!correoOTelefono) {
      return Response.json({ error: 'El correo/teléfono es requerido' }, { status: 400 });
    }

    const cleanIdentifier = sanitizeText(correoOTelefono).toLowerCase();

    if (!isDbConnected() || !db) {
      localDb.deleteUser(cleanIdentifier);
      return Response.json({ status: 'success', message: 'Usuario eliminado de la base de datos local' });
    }

    await db.delete(users).where(eq(users.correoOTelefono, cleanIdentifier));
    
    return Response.json({ status: 'success', message: 'Usuario eliminado de Neon.db' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users:', error);
    return Response.json({ error: 'Error al eliminar usuario', details: error.message }, { status: 500 });
  }
}

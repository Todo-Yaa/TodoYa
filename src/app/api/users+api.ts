import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq, or } from 'drizzle-orm';
import { localDb } from '../../db/localDb';
import {
  hashPassword,
  verifyPassword,
  esPasswordHasheada,
  signSessionToken,
  resolveTenantId,
} from '../../utils/auth';

const DEFAULT_TENANT_ID = 1;

// GET: Obtener los usuarios registrados (solo del tenant de la sesión/petición)
export async function GET(request: Request) {
  try {
    const tenantId = await resolveTenantId(request);

    if (!isDbConnected() || !db) {
      const localUsers = localDb.getUsersByTenant(tenantId);
      return Response.json({ status: 'success', tenantId, data: localUsers });
    }

    const allUsers = await db.select().from(users).where(eq(users.tenantId, tenantId));
    return Response.json({ status: 'success', tenantId, data: allUsers });
  } catch (error: any) {
    console.error('Error in GET /api/users:', error);
    return Response.json({ error: 'Error al obtener usuarios', details: error.message }, { status: 500 });
  }
}

// POST: Login con sesión JWT, o Registro de nuevo usuario (manual o social OAuth)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Login con sesión JWT ─────────────────────────────────
    if (body.action === 'login') {
      return await handleLogin(body);
    }

    const { nombre, correoOTelefono, rol, contrasena, tipoProveedor = 'normal', tipoEntidad = 'natural', nit, correoFacturacion, rubro, ofreceB2B = false, celular, codigoPais, tenantId } = body;

    // Resolver el tenant: del body, del JWT/query, o el tenant por defecto
    const resolvedTenantId = tenantId || await resolveTenantId(request);
    // Las contraseñas se almacenan SIEMPRE con hash (scrypt)
    const passwordHash = contrasena ? await hashPassword(contrasena) : null;

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
          tenantId: usuarioExistente.tenantId || resolvedTenantId,
        });
        const token = await signSessionToken({
          userId: updated.id,
          tenantId: updated.tenantId ?? DEFAULT_TENANT_ID,
          rol: updated.rol,
        });
        return Response.json({ status: 'success', action: 'updated', user: updated, token, tenantId: updated.tenantId ?? DEFAULT_TENANT_ID });
      }
      const nuevoUsuario = localDb.insertUser({
        nombre,
        correoOTelefono,
        rol,
        contrasena: passwordHash,
        tipoProveedor,
        tipoEntidad,
        nit,
        correoFacturacion,
        rubro,
        ofreceB2B,
        celular,
        codigoPais,
        tenantId: resolvedTenantId,
      });
      const token = await signSessionToken({
        userId: nuevoUsuario.id,
        tenantId: nuevoUsuario.tenantId ?? DEFAULT_TENANT_ID,
        rol: nuevoUsuario.rol,
      });
      return Response.json({ status: 'success', action: 'created', user: nuevoUsuario, token, tenantId: nuevoUsuario.tenantId ?? DEFAULT_TENANT_ID });
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
          tenantId: usuarioExistente[0].tenantId || resolvedTenantId,
        })
        .where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase()))
        .returning();
      const token = await signSessionToken({
        userId: updated[0].id,
        tenantId: updated[0].tenantId ?? DEFAULT_TENANT_ID,
        rol: updated[0].rol,
      });
      return Response.json({ status: 'success', action: 'updated', user: updated[0], token, tenantId: updated[0].tenantId ?? DEFAULT_TENANT_ID });
    }

    // Registrar nuevo
    const nuevoUsuario = await db.insert(users).values({
      nombre,
      correoOTelefono: correoOTelefono.trim().toLowerCase(),
      rol,
      contrasena: passwordHash,
      tipoProveedor,
      tipoEntidad,
      nit,
      correoFacturacion,
      rubro,
      ofreceB2B,
      celular,
      codigoPais,
      tenantId: resolvedTenantId,
    }).returning();

    const token = await signSessionToken({
      userId: nuevoUsuario[0].id,
      tenantId: nuevoUsuario[0].tenantId ?? DEFAULT_TENANT_ID,
      rol: nuevoUsuario[0].rol,
    });
    return Response.json({ status: 'success', action: 'created', user: nuevoUsuario[0], token, tenantId: nuevoUsuario[0].tenantId ?? DEFAULT_TENANT_ID });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return Response.json({ error: 'Error al registrar usuario', details: error.message }, { status: 500 });
  }
}

// Login server-side: valida credenciales, emite un JWT de sesión y (si la contraseña
// estaba en texto plano) la migra a hash automáticamente.
async function handleLogin(body: any) {
  const { correoOTelefono, contrasena } = body;
  if (!correoOTelefono || !contrasena) {
    return Response.json({ error: 'Correo/teléfono y contraseña son requeridos' }, { status: 400 });
  }
  const ident = String(correoOTelefono).trim().toLowerCase();

  const verificarYBajarToken = async (user: any) => {
    if (user.baneado) {
      return Response.json({ error: 'Cuenta suspendida' }, { status: 403 });
    }
    const contrasenaGuardada = user.contrasena;
    const valida = contrasenaGuardada
      ? (esPasswordHasheada(contrasenaGuardada)
          ? await verifyPassword(contrasena, contrasenaGuardada)
          : contrasenaGuardada === contrasena)
      : false;
    if (!valida) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    return { user, necesitaMigrarHash: !!contrasenaGuardada && !esPasswordHasheada(contrasenaGuardada) };
  };

  if (!isDbConnected() || !db) {
    const found = localDb.getUsers().find(u => {
      const correo = (u.correoOTelefono || '').trim().toLowerCase();
      const celular = (u.celular || '').trim().toLowerCase();
      return correo === ident || celular === ident;
    });
    if (!found) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    const resultado = await verificarYBajarToken(found);
    if (resultado instanceof Response) return resultado;

    if (resultado.necesitaMigrarHash) {
      localDb.updateUserById(found.id, { contrasena: await hashPassword(contrasena) });
    }

    const token = await signSessionToken({ userId: found.id, tenantId: found.tenantId ?? DEFAULT_TENANT_ID, rol: found.rol });
    return Response.json({ status: 'success', action: 'login', token, tenantId: found.tenantId ?? DEFAULT_TENANT_ID, user: found });
  }

  const found = await db
    .select()
    .from(users)
    .where(or(eq(users.correoOTelefono, ident), eq(users.celular, ident)))
    .limit(1);

  if (found.length === 0) {
    return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }
  const resultado = await verificarYBajarToken(found[0]);
  if (resultado instanceof Response) return resultado;

  if (resultado.necesitaMigrarHash) {
    await db.update(users)
      .set({ contrasena: await hashPassword(contrasena) })
      .where(eq(users.id, found[0].id));
  }

  const token = await signSessionToken({ userId: found[0].id, tenantId: found[0].tenantId ?? DEFAULT_TENANT_ID, rol: found[0].rol });
  return Response.json({ status: 'success', action: 'login', token, tenantId: found[0].tenantId ?? DEFAULT_TENANT_ID, user: found[0] });
}

// PUT: Actualizar configuración del perfil del Proveedor (Onboarding) o Plan de Suscripción
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { correoOTelefono, serviciosOfrecidos, anosExperiencia, descripcionProveedor, coberturaB2B, planId, pushToken, kycVerificado, kycDetalles, baneado } = body;

    if (!correoOTelefono) {
      return Response.json({ error: 'El identificador de correo/teléfono es requerido' }, { status: 400 });
    }

    // Verificar que el usuario objetivo pertenezca al tenant de la petición
    const tenantId = await resolveTenantId(request);

    if (!isDbConnected() || !db) {
      const targetUser = localDb.getUserByEmailOrPhone(correoOTelefono.trim().toLowerCase());
      if (!targetUser) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
      if ((targetUser.tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
        return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
      }
    } else {
      const targetUser = await db.select({ id: users.id, tenantId: users.tenantId }).from(users)
        .where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase())).limit(1);
      if (targetUser.length === 0) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
      if ((targetUser[0].tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
        return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
      }
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

    // Verificar que el usuario objetivo pertenezca al tenant de la petición
    const tenantId = await resolveTenantId(request);

    if (!isDbConnected() || !db) {
      const targetUser = localDb.getUserByEmailOrPhone(correoOTelefono.trim().toLowerCase());
      if (targetUser && (targetUser.tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
        return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
      }
      localDb.deleteUser(correoOTelefono);
      return Response.json({ status: 'success', message: 'Usuario eliminado de la base de datos local' });
    }

    const targetUser = await db.select({ tenantId: users.tenantId }).from(users)
      .where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase())).limit(1);
    if (targetUser.length > 0 && (targetUser[0].tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
      return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
    }

    await db.delete(users).where(eq(users.correoOTelefono, correoOTelefono.trim().toLowerCase()));
    
    return Response.json({ status: 'success', message: 'Usuario eliminado de Neon.db' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users:', error);
    return Response.json({ error: 'Error al eliminar usuario', details: error.message }, { status: 500 });
  }
}

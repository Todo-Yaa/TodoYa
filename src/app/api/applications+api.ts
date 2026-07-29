import { db, isDbConnected } from '../../db';
import { applications, orders, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { localDb } from '../../db/localDb';
import { checkApiRateLimit } from '../../utils/rate-limiter';
import { sanitizeText } from '../../utils/security';

// GET: Obtener postulaciones (por orderId o por proveedorId)
export async function GET(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 60, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const proveedorId = url.searchParams.get('proveedorId');

    if (!isDbConnected() || !db) {
      let result: any[];
      if (orderId) {
        result = localDb.getApplications(Number(orderId));
      } else if (proveedorId) {
        result = localDb.getApplicationsByProveedor(Number(proveedorId));
      } else {
        result = localDb.getApplications();
      }
      return Response.json({ status: 'success', data: result });
    }

    let result: any[];
    if (orderId) {
      result = await db.select().from(applications).where(eq(applications.orderId, Number(orderId)));
    } else if (proveedorId) {
      result = await db.select().from(applications).where(eq(applications.proveedorId, Number(proveedorId)));
    } else {
      result = await db.select().from(applications);
    }

    return Response.json({ status: 'success', data: result });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener postulaciones', details: error.message }, { status: 500 });
  }
}

// POST: Registrar una nueva postulación de proveedor a un pedido
export async function POST(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { orderId, proveedorId, monedasGastadas, notaPersonal = null } = body;

    if (!orderId || !proveedorId || monedasGastadas === undefined) {
      return Response.json({ error: 'orderId, proveedorId y monedasGastadas son requeridos' }, { status: 400 });
    }

    const cleanNotaPersonal = notaPersonal ? sanitizeText(notaPersonal) : null;

    if (!isDbConnected() || !db) {
      // Verificar si ya existe una postulación del mismo proveedor al mismo pedido
      const existente = localDb.getApplicationExistente(Number(orderId), Number(proveedorId));
      if (existente) {
        return Response.json({ error: 'Ya existe una postulación de este proveedor a este pedido', existing: existente }, { status: 409 });
      }
      
      const newApp = localDb.insertApplication({
        orderId: Number(orderId),
        proveedorId: Number(proveedorId),
        monedasGastadas: Number(monedasGastadas),
        notaPersonal: cleanNotaPersonal,
        estado: 'pendiente'
      });
      return Response.json({ status: 'success', application: newApp });
    }

    // Verificar si ya existe en Neon
    const existente = await db.select().from(applications)
      .where(and(
        eq(applications.orderId, Number(orderId)),
        eq(applications.proveedorId, Number(proveedorId))
      ))
      .limit(1);

    if (existente.length > 0) {
      return Response.json({ error: 'Ya existe una postulación de este proveedor a este pedido', existing: existente[0] }, { status: 409 });
    }

    const newApp = await db.insert(applications).values({
      orderId: Number(orderId),
      proveedorId: Number(proveedorId),
      monedasGastadas: Number(monedasGastadas),
      notaPersonal: cleanNotaPersonal,
      estado: 'pendiente'
    }).returning();

    return Response.json({ status: 'success', application: newApp[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al registrar postulación', details: error.message }, { status: 500 });
  }
}

// PUT: Actualizar estado de una postulación (aceptar o rechazar)
export async function PUT(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return Response.json({ error: 'id y estado son requeridos' }, { status: 400 });
    }

    const cleanEstado = sanitizeText(estado).toLowerCase() as 'pendiente' | 'aceptado' | 'rechazado';

    if (!['pendiente', 'aceptado', 'rechazado'].includes(cleanEstado)) {
      return Response.json({ error: 'Estado inválido. Use: pendiente, aceptado, rechazado' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      const updated = localDb.updateApplication(Number(id), { estado: cleanEstado });
      if (!updated) return Response.json({ error: 'Postulación no encontrada' }, { status: 404 });
      return Response.json({ status: 'success', application: updated });
    }

    const updated = await db.update(applications)
      .set({ estado: cleanEstado })
      .where(eq(applications.id, Number(id)))
      .returning();

    if (updated.length === 0) {
      return Response.json({ error: 'Postulación no encontrada' }, { status: 404 });
    }

    return Response.json({ status: 'success', application: updated[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al actualizar postulación', details: error.message }, { status: 500 });
  }
}

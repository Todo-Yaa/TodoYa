import { db, isDbConnected } from '../../db';
import { ratings, orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { localDb } from '../../db/localDb';

// GET: Obtener calificaciones (por orderId o por calificadoId para stats del proveedor)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const calificadoId = url.searchParams.get('calificadoId');
    const stats = url.searchParams.get('stats') === 'true';

    if (!isDbConnected() || !db) {
      if (stats && calificadoId) {
        const provStats = localDb.getProveedorStats(Number(calificadoId));
        return Response.json({ status: 'success', ...provStats });
      }
      if (orderId) {
        const result = localDb.getRatings(Number(orderId));
        return Response.json({ status: 'success', data: result });
      }
      if (calificadoId) {
        const result = localDb.getRatingsByCalificado(Number(calificadoId));
        return Response.json({ status: 'success', data: result });
      }
      return Response.json({ status: 'success', data: localDb.getRatings() });
    }

    let result: any[];

    if (orderId) {
      result = await db.select().from(ratings).where(eq(ratings.orderId, Number(orderId)));
    } else if (calificadoId) {
      result = await db.select().from(ratings).where(eq(ratings.calificadoId, Number(calificadoId)));
    } else {
      result = await db.select().from(ratings);
    }

    if (stats && calificadoId) {
      const total = result.length;
      const promedio = total > 0
        ? result.reduce((sum, r) => sum + (r.estrellas || 0), 0) / total
        : 0;
      return Response.json({
        status: 'success',
        totalCalificaciones: total,
        promedioEstrellas: Math.round(promedio * 10) / 10,
        data: result
      });
    }

    return Response.json({ status: 'success', data: result });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener calificaciones', details: error.message }, { status: 500 });
  }
}

// POST: Registrar una nueva calificación de servicio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, calificadorId = null, calificadoId = null, estrellas, etiquetas = [], comentario = null } = body;

    if (!orderId || !estrellas) {
      return Response.json({ error: 'orderId y estrellas son requeridos' }, { status: 400 });
    }

    if (estrellas < 1 || estrellas > 5) {
      return Response.json({ error: 'Las estrellas deben estar entre 1 y 5' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      // Guardar calificación en la tabla ratings
      const newRating = localDb.insertRating({
        orderId: Number(orderId),
        calificadorId: calificadorId ? Number(calificadorId) : null,
        calificadoId: calificadoId ? Number(calificadoId) : null,
        estrellas: Number(estrellas),
        etiquetas,
        comentario
      });

      // También actualizar el campo rápido en orders para queries simples
      localDb.updateOrder(Number(orderId), {
        calificado: true,
        calificacionEstrellas: Number(estrellas),
        calificacionEtiquetas: etiquetas
      });

      return Response.json({ status: 'success', rating: newRating });
    }

    // Guardar en tabla ratings de Neon
    const newRating = await db.insert(ratings).values({
      orderId: Number(orderId),
      calificadorId: calificadorId ? Number(calificadorId) : null,
      calificadoId: calificadoId ? Number(calificadoId) : null,
      estrellas: Number(estrellas),
      etiquetas,
      comentario
    }).returning();

    // Actualizar campo rápido en orders
    await db.update(orders)
      .set({
        calificado: true,
        calificacionEstrellas: Number(estrellas),
        calificacionEtiquetas: etiquetas
      })
      .where(eq(orders.id, Number(orderId)));

    return Response.json({ status: 'success', rating: newRating[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al registrar calificación', details: error.message }, { status: 500 });
  }
}

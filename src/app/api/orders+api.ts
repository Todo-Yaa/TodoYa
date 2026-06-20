import { db, isDbConnected } from '../../db';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';

// GET: Obtener todos los pedidos/solicitudes de la base de datos
export async function GET(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Usando base de datos local simulada' });
    }

    const allOrders = await db.select().from(orders);
    // Mapear los datos de tipo PostgreSQL a formato CamelCase de la App
    const formatOrders = allOrders.map(o => ({
      id: o.id,
      titulo: o.titulo,
      proveedor: o.proveedor,
      servicio: o.servicio,
      description: o.descripcion,
      estado: o.estado,
      progreso: o.progreso,
      hora: o.hora,
      color: o.color,
      precio: o.precio,
      urgencia: o.urgencia,
      calificado: o.calificado || false,
      calificacionEstrellas: o.calificacionEstrellas || undefined,
      calificacionEtiquetas: (o.calificacionEtiquetas as string[]) || undefined,
      acceptedAt: o.acceptedAt,
      completedAt: o.completedAt,
      tiempoEjecucion: o.tiempoEjecucion,
    }));

    return Response.json({ status: 'success', data: formatOrders });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener pedidos', details: error.message }, { status: 500 });
  }
}

// POST: Crear un nuevo pedido
export async function POST(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Pedido guardado localmente en AsyncStorage' });
    }

    const body = await request.json();
    const { titulo, servicio, description, precio, urgencia, proveedor = null } = body;

    const nuevoPedido = await db.insert(orders).values({
      titulo,
      servicio,
      descripcion: description,
      precio,
      urgencia,
      proveedor,
      estado: proveedor ? 'En progreso' : 'Buscando proveedor',
      progreso: proveedor ? 65 : 25,
      color: '#FFB400',
      hora: 'Ahora mismo',
      acceptedAt: proveedor ? new Date() : null,
    }).returning();

    return Response.json({ status: 'success', order: nuevoPedido[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al crear pedido', details: error.message }, { status: 500 });
  }
}

// PUT: Actualizar un pedido (Postulación, Finalización o Calificación)
export async function PUT(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Pedido actualizado localmente' });
    }

    const body = await request.json();
    const { id, action, providerName, estrellas, etiquetas } = body;

    if (!id) {
      return Response.json({ error: 'El ID del pedido es requerido' }, { status: 400 });
    }

    let updated;

    if (action === 'apply') {
      // Un proveedor se postula al pedido
      updated = await db.update(orders)
        .set({
          proveedor: providerName,
          estado: 'En progreso',
          progreso: 65,
          hora: 'Hace un momento',
          acceptedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
    } else if (action === 'complete') {
      // Completar el trabajo
      const [orderToComplete] = await db.select().from(orders).where(eq(orders.id, id));
      if (!orderToComplete) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

      const now = new Date();
      let tiempoEjecucionText = 'Tiempo desconocido';
      if (orderToComplete.acceptedAt) {
        const diffMs = now.getTime() - new Date(orderToComplete.acceptedAt).getTime();
        const diffMins = Math.round(diffMs / 60000);
        tiempoEjecucionText = diffMins > 60 ? `${Math.round(diffMins / 60)} horas` : `${diffMins} minutos`;
      }

      updated = await db.update(orders)
        .set({
          estado: 'Completado',
          progreso: 100,
          color: '#4caf50',
          hora: 'Terminado recientemente',
          completedAt: now,
          tiempoEjecucion: tiempoEjecucionText
        })
        .where(eq(orders.id, id))
        .returning();
    } else if (action === 'rate') {
      // Calificar el trabajo completado (sistema de bloqueo)
      updated = await db.update(orders)
        .set({
          calificado: true,
          calificacionEstrellas: estrellas,
          calificacionEtiquetas: etiquetas
        })
        .where(eq(orders.id, id))
        .returning();
    } else {
      return Response.json({ error: 'Acción no válida' }, { status: 400 });
    }

    if (updated.length === 0) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return Response.json({ status: 'success', order: updated[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al actualizar pedido', details: error.message }, { status: 500 });
  }
}

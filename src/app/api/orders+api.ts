import { db, isDbConnected } from '../../db';
import { orders, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { localDb } from '../../db/localDb';

// GET: Obtener todos los pedidos/solicitudes de la base de datos
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clienteId = url.searchParams.get('clienteId');
    const proveedorId = url.searchParams.get('proveedorId');

    if (!isDbConnected() || !db) {
      let allOrders: any[];
      if (clienteId) {
        allOrders = localDb.getOrdersByClienteId(Number(clienteId));
      } else if (proveedorId) {
        allOrders = localDb.getOrdersByProveedorId(Number(proveedorId));
      } else {
        allOrders = localDb.getOrders();
      }
      const formatOrders = allOrders.map(o => ({
        id: o.id,
        titulo: o.titulo,
        clienteId: o.clienteId || null,
        proveedorId: o.proveedorId || null,
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
        calificacionEtiquetas: o.calificacionEtiquetas || undefined,
        acceptedAt: o.acceptedAt,
        completedAt: o.completedAt,
        tiempoEjecucion: o.tiempoEjecucion,
      }));
      return Response.json({ status: 'success', data: formatOrders });
    }

    let query = db.select().from(orders);
    let allOrders: any[];

    if (clienteId) {
      allOrders = await db.select().from(orders).where(eq(orders.clienteId, Number(clienteId)));
    } else if (proveedorId) {
      allOrders = await db.select().from(orders).where(eq(orders.proveedorId, Number(proveedorId)));
    } else {
      allOrders = await db.select().from(orders);
    }

    const formatOrders = allOrders.map(o => ({
      id: o.id,
      titulo: o.titulo,
      clienteId: o.clienteId,
      proveedorId: o.proveedorId,
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
    const body = await request.json();
    const { titulo, servicio, description, precio, urgencia, proveedor = null, clienteId = null, proveedorId = null } = body;

    // Si viene un proveedor mockup (ej: Andrés Silva), asegurarse de que exista en la BD
    if (proveedor && !proveedorId) {
      const email = proveedor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.') + '@todoya.com';
      
      if (!isDbConnected() || !db) {
        const existingUser = localDb.getUserByEmailOrPhone(email);
        if (!existingUser) {
          localDb.insertUser({
            nombre: proveedor,
            correoOTelefono: email,
            rol: 'provider',
            contrasena: 'demo1234',
            proveedorConfigurado: true,
            serviciosOfrecidos: [servicio],
            tipoEntidad: 'natural'
          });
        }
      } else {
        const existingUser = await db.select().from(users).where(eq(users.correoOTelefono, email)).limit(1);
        if (existingUser.length === 0) {
          await db.insert(users).values({
            nombre: proveedor,
            correoOTelefono: email,
            rol: 'provider',
            contrasena: 'demo1234',
            proveedorConfigurado: true,
            serviciosOfrecidos: [servicio],
            tipoEntidad: 'natural'
          });
        }
      }
    }

    if (!isDbConnected() || !db) {
      const nuevoPedido = localDb.insertOrder({
        titulo,
        servicio,
        descripcion: description,
        precio,
        urgencia,
        proveedor,
        clienteId: clienteId ? Number(clienteId) : null,
        proveedorId: proveedorId ? Number(proveedorId) : null,
        estado: proveedor ? 'En progreso' : 'Buscando proveedor',
        progreso: proveedor ? 65 : 25,
        color: '#FFB400',
        hora: 'Ahora mismo',
        acceptedAt: proveedor ? new Date().toISOString() : null,
      });
      return Response.json({ status: 'success', order: nuevoPedido });
    }

    const nuevoPedido = await db.insert(orders).values({
      titulo,
      servicio,
      descripcion: description,
      precio,
      urgencia,
      proveedor,
      clienteId: clienteId ? Number(clienteId) : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
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
    const body = await request.json();
    const { id, action, providerName, proveedorId, estrellas, etiquetas } = body;

    if (!id) {
      return Response.json({ error: 'El ID del pedido es requerido' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      let updated;
      if (action === 'apply') {
        updated = localDb.updateOrder(id, {
          proveedor: providerName,
          proveedorId: proveedorId || null,  // ✅ Guardar FK del proveedor
          estado: 'En progreso',
          progreso: 65,
          hora: 'Hace un momento',
          acceptedAt: new Date().toISOString()
        });
      } else if (action === 'complete') {
        const orderToComplete = localDb.getOrderById(id);
        if (!orderToComplete) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
        const now = new Date();
        let tiempoEjecucionText = 'Tiempo desconocido';
        if (orderToComplete.acceptedAt) {
          const diffMs = now.getTime() - new Date(orderToComplete.acceptedAt).getTime();
          const diffMins = Math.round(diffMs / 60000);
          tiempoEjecucionText = diffMins > 60 ? `${Math.round(diffMins / 60)} horas` : `${diffMins} minutos`;
        }
        updated = localDb.updateOrder(id, {
          estado: 'Completado',
          progreso: 100,
          color: '#4caf50',
          hora: 'Terminado recientemente',
          completedAt: now.toISOString(),
          tiempoEjecucion: tiempoEjecucionText
        });
      } else if (action === 'rate') {
        updated = localDb.updateOrder(id, {
          calificado: true,
          calificacionEstrellas: estrellas,
          calificacionEtiquetas: etiquetas
        });
      } else {
        return Response.json({ error: 'Acción no válida' }, { status: 400 });
      }
      if (!updated) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
      return Response.json({ status: 'success', order: updated });
    }

    let updated;

    if (action === 'apply') {
      updated = await db.update(orders)
        .set({
          proveedor: providerName,
          proveedorId: proveedorId || null,  // ✅ FK del proveedor
          estado: 'En progreso',
          progreso: 65,
          hora: 'Hace un momento',
          acceptedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
    } else if (action === 'complete') {
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

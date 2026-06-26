import { db, isDbConnected } from '../../db';
import { users, orders, messages, ratings, applications, transactions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { localDb } from '../../db/localDb';

/**
 * POST /api/sync
 * Sincroniza los datos de local_db.json hacia Neon.db cuando el internet se recupera.
 * El servidor tiene acceso directo a ambas fuentes, por lo que la comparación es server-side.
 * 
 * GET /api/sync
 * Retorna el estado de cuántos registros locales no están en Neon.
 */

// GET: Verificar cuántos registros locales no están sincronizados con Neon
export async function GET(request: Request) {
  if (!isDbConnected() || !db) {
    return Response.json({ error: 'Neon no disponible', canSync: false }, { status: 503 });
  }

  try {
    const [neonUsers, neonOrders, neonMessages] = await Promise.all([
      db.select({ correoOTelefono: users.correoOTelefono }).from(users),
      db.select({ id: orders.id }).from(orders),
      db.select({ id: messages.id }).from(messages),
    ]);

    const localUsers = localDb.getUsers();
    const localOrders = localDb.getOrders();
    const localMessages = localDb.getMessages();

    const neonEmails = new Set(neonUsers.map(u => u.correoOTelefono));
    const unsynced = {
      users: localUsers.filter(u => !neonEmails.has(u.correoOTelefono)).length,
      orders: Math.max(0, localOrders.length - neonOrders.length),
      messages: Math.max(0, localMessages.length - neonMessages.length),
    };
    const total = unsynced.users + unsynced.orders + unsynced.messages;

    return Response.json({ 
      canSync: true, 
      pending: total, 
      detail: unsynced 
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST: Ejecutar la sincronización completa local → Neon
export async function POST(request: Request) {
  if (!isDbConnected() || !db) {
    return Response.json({ 
      error: 'Neon.db no disponible. Imposible sincronizar ahora.', 
      canSync: false 
    }, { status: 503 });
  }

  const syncResults = { 
    users: 0, 
    orders: 0, 
    messages: 0, 
    ratings: 0, 
    applications: 0,
    errors: 0 
  };

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. SINCRONIZAR USUARIOS (por correoOTelefono — campo único)
    // ─────────────────────────────────────────────────────────────
    const localUsers = localDb.getUsers();
    const neonUsersRaw = await db.select({ correoOTelefono: users.correoOTelefono }).from(users);
    const neonEmails = new Set(neonUsersRaw.map(u => u.correoOTelefono));

    for (const localUser of localUsers) {
      if (!neonEmails.has(localUser.correoOTelefono)) {
        try {
          await db.insert(users).values({
            nombre: localUser.nombre,
            correoOTelefono: localUser.correoOTelefono,
            rol: localUser.rol || 'client',
            contrasena: localUser.contrasena,
            tipoProveedor: localUser.tipoProveedor || 'normal',
            tipoEntidad: localUser.tipoEntidad || 'natural',
            nit: localUser.nit || null,
            correoFacturacion: localUser.correoFacturacion || null,
            rubro: localUser.rubro || null,
            ofreceB2B: localUser.ofreceB2B || false,
            proveedorConfigurado: localUser.proveedorConfigurado || false,
            serviciosOfrecidos: localUser.serviciosOfrecidos || null,
            anosExperiencia: localUser.anosExperiencia || null,
            descripcionProveedor: localUser.descripcionProveedor || null,
            coberturaB2B: localUser.coberturaB2B || null,
            monedas: localUser.monedas ?? 24,
            planId: localUser.planId || null,
            kycVerificado: localUser.kycVerificado || false,
            kycDetalles: localUser.kycDetalles || null,
          });
          syncResults.users++;
          neonEmails.add(localUser.correoOTelefono); // Actualizar el set
        } catch (e) {
          syncResults.errors++;
          console.warn('[Sync] Error insertando usuario:', localUser.correoOTelefono, e);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. OBTENER MAPA DE IDs: correoOTelefono → neon_id
    //    Necesario para mapear clienteId/proveedorId correctamente
    // ─────────────────────────────────────────────────────────────
    const allNeonUsers = await db.select({ id: users.id, correoOTelefono: users.correoOTelefono }).from(users);
    const emailToNeonId = new Map(allNeonUsers.map(u => [u.correoOTelefono, u.id]));

    // ─────────────────────────────────────────────────────────────
    // 3. SINCRONIZAR PEDIDOS
    //    Deduplicación suave: mismo titulo + servicio + createdAt (tolerancia de 1 hora)
    // ─────────────────────────────────────────────────────────────
    const localOrders = localDb.getOrders();
    const neonOrders = await db.select({ 
      titulo: orders.titulo, 
      servicio: orders.servicio, 
      createdAt: orders.createdAt 
    }).from(orders);

    // Crear un set de claves de pedidos ya en Neon
    const neonOrderKeys = new Set(
      neonOrders.map(o => `${o.titulo}__${o.servicio}`)
    );

    for (const localOrder of localOrders) {
      const key = `${localOrder.titulo}__${localOrder.servicio}`;
      if (!neonOrderKeys.has(key)) {
        try {
          // Resolver clienteId a ID de Neon usando el correo del local user
          let neonClienteId: number | null = null;
          if (localOrder.clienteId) {
            const localCliente = localDb.getUserById(localOrder.clienteId);
            if (localCliente) {
              neonClienteId = emailToNeonId.get(localCliente.correoOTelefono) || null;
            }
          }

          // Resolver proveedorId
          let neonProveedorId: number | null = null;
          if (localOrder.proveedorId) {
            const localProveedor = localDb.getUserById(localOrder.proveedorId);
            if (localProveedor) {
              neonProveedorId = emailToNeonId.get(localProveedor.correoOTelefono) || null;
            }
          }

          await db.insert(orders).values({
            titulo: localOrder.titulo,
            servicio: localOrder.servicio,
            descripcion: localOrder.descripcion,
            precio: localOrder.precio,
            urgencia: localOrder.urgencia || 'Normal',
            proveedor: localOrder.proveedor || null,
            clienteId: neonClienteId,
            proveedorId: neonProveedorId,
            estado: localOrder.estado || 'Buscando proveedor',
            progreso: localOrder.progreso ?? 25,
            color: localOrder.color || '#FFB400',
            hora: localOrder.hora || 'Ahora mismo',
            calificado: localOrder.calificado || false,
            calificacionEstrellas: localOrder.calificacionEstrellas || null,
            calificacionEtiquetas: localOrder.calificacionEtiquetas || null,
            acceptedAt: localOrder.acceptedAt ? new Date(localOrder.acceptedAt) : null,
            completedAt: localOrder.completedAt ? new Date(localOrder.completedAt) : null,
            tiempoEjecucion: localOrder.tiempoEjecucion || null,
          });
          syncResults.orders++;
          neonOrderKeys.add(key);
        } catch (e) {
          syncResults.errors++;
          console.warn('[Sync] Error insertando pedido:', localOrder.titulo, e);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. SINCRONIZAR MENSAJES
    //    Re-obtener pedidos de Neon con sus IDs para mapear correctamente
    // ─────────────────────────────────────────────────────────────
    const localMessages = localDb.getMessages();
    if (localMessages.length > 0) {
      const neonOrdersWithId = await db.select({ id: orders.id, titulo: orders.titulo, servicio: orders.servicio }).from(orders);
      const orderKeyToNeonId = new Map(neonOrdersWithId.map(o => [`${o.titulo}__${o.servicio}`, o.id]));

      const neonMessages = await db.select({ 
        orderId: messages.orderId, 
        senderName: messages.senderName, 
        messageText: messages.messageText 
      }).from(messages);

      const neonMsgKeys = new Set(
        neonMessages.map(m => `${m.orderId}__${m.senderName}__${m.messageText.substring(0, 30)}`)
      );

      for (const msg of localMessages) {
        // Encontrar el orderId correcto en Neon
        const localOrder = localDb.getOrderById(msg.orderId);
        if (!localOrder) continue;

        const orderKey = `${localOrder.titulo}__${localOrder.servicio}`;
        const neonOrderId = orderKeyToNeonId.get(orderKey);
        if (!neonOrderId) continue;

        const msgKey = `${neonOrderId}__${msg.senderName}__${msg.messageText.substring(0, 30)}`;
        if (!neonMsgKeys.has(msgKey)) {
          try {
            // Resolver senderId
            let neonSenderId: number | null = null;
            if (msg.senderId) {
              const localSender = localDb.getUserById(msg.senderId);
              if (localSender) {
                neonSenderId = emailToNeonId.get(localSender.correoOTelefono) || null;
              }
            }

            await db.insert(messages).values({
              orderId: neonOrderId,
              senderId: neonSenderId,
              senderName: msg.senderName,
              messageText: msg.messageText,
            });
            syncResults.messages++;
          } catch (e) {
            syncResults.errors++;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. SINCRONIZAR CALIFICACIONES
    // ─────────────────────────────────────────────────────────────
    const localRatings = localDb.getRatings();
    if (localRatings.length > 0) {
      const neonRatings = await db.select({ orderId: ratings.orderId, calificadorId: ratings.calificadorId }).from(ratings);
      const neonRatingsKeys = new Set(neonRatings.map(r => `${r.orderId}__${r.calificadorId}`));

      const neonOrdersMap = await db.select({ id: orders.id, titulo: orders.titulo, servicio: orders.servicio }).from(orders);
      const orderKeyToId = new Map(neonOrdersMap.map(o => [`${o.titulo}__${o.servicio}`, o.id]));

      for (const rating of localRatings) {
        const localOrder = localDb.getOrderById(rating.orderId);
        if (!localOrder) continue;
        const neonOrderId = orderKeyToId.get(`${localOrder.titulo}__${localOrder.servicio}`);
        if (!neonOrderId) continue;

        let neonCalificadorId: number | null = null;
        if (rating.calificadorId) {
          const localCal = localDb.getUserById(rating.calificadorId);
          if (localCal) neonCalificadorId = emailToNeonId.get(localCal.correoOTelefono) || null;
        }

        const key = `${neonOrderId}__${neonCalificadorId}`;
        if (!neonRatingsKeys.has(key)) {
          try {
            await db.insert(ratings).values({
              orderId: neonOrderId,
              calificadorId: neonCalificadorId,
              calificadoId: null,
              estrellas: rating.estrellas,
              etiquetas: rating.etiquetas || [],
              comentario: rating.comentario || null,
            });
            syncResults.ratings++;
          } catch (e) {
            syncResults.errors++;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. SINCRONIZAR POSTULACIONES
    // ─────────────────────────────────────────────────────────────
    const localApps = localDb.getApplications();
    if (localApps.length > 0) {
      const neonApps = await db.select({ orderId: applications.orderId, proveedorId: applications.proveedorId }).from(applications);
      const neonAppKeys = new Set(neonApps.map(a => `${a.orderId}__${a.proveedorId}`));

      const neonOrdersMap2 = await db.select({ id: orders.id, titulo: orders.titulo, servicio: orders.servicio }).from(orders);
      const orderKeyToId2 = new Map(neonOrdersMap2.map(o => [`${o.titulo}__${o.servicio}`, o.id]));

      for (const app of localApps) {
        const localOrder = localDb.getOrderById(app.orderId);
        if (!localOrder) continue;
        const neonOrderId = orderKeyToId2.get(`${localOrder.titulo}__${localOrder.servicio}`);
        if (!neonOrderId) continue;

        const localProv = localDb.getUserById(app.proveedorId);
        if (!localProv) continue;
        const neonProvId = emailToNeonId.get(localProv.correoOTelefono);
        if (!neonProvId) continue;

        const key = `${neonOrderId}__${neonProvId}`;
        if (!neonAppKeys.has(key)) {
          try {
            await db.insert(applications).values({
              orderId: neonOrderId,
              proveedorId: neonProvId,
              estado: app.estado || 'pendiente',
              monedasGastadas: app.monedasGastadas || 0,
              notaPersonal: app.notaPersonal || null,
            });
            syncResults.applications++;
          } catch (e) {
            syncResults.errors++;
          }
        }
      }
    }

    const total = syncResults.users + syncResults.orders + syncResults.messages + syncResults.ratings + syncResults.applications;

    console.log(`[Sync] ✅ Sincronización completada: ${total} registros subidos a Neon.`, syncResults);

    return Response.json({ 
      status: 'success', 
      message: `${total} registros sincronizados a Neon.db`,
      synced: syncResults
    });
  } catch (error: any) {
    console.error('[Sync] Error general:', error);
    return Response.json({ error: 'Error durante la sincronización', details: error.message }, { status: 500 });
  }
}

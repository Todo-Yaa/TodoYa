import { db, isDbConnected } from '../../db';
import { orders, messages } from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { localDb } from '../../db/localDb';
import { resolveTenantId } from '../../utils/auth';

const DEFAULT_TENANT_ID = 1;

// GET: Obtener los mensajes de una orden (solo del tenant de la sesión/petición) o todos (all=true)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const isGlobal = url.searchParams.get('all') === 'true';
    const tenantId = await resolveTenantId(request);

    if (isGlobal) {
      if (!isDbConnected() || !db) {
        const allMessages = localDb.getMessages().filter(m => (m.tenantId ?? DEFAULT_TENANT_ID) === tenantId);
        return Response.json({ status: 'success', tenantId, data: allMessages });
      }
      const allMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.tenantId, tenantId))
        .orderBy(asc(messages.createdAt));
      return Response.json({ status: 'success', tenantId, data: allMessages });
    }

    if (!orderId) {
      return Response.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      const order = localDb.getOrderById(Number(orderId));
      if (!order) return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
      if ((order.tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
        return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
      }
      const orderMessages = localDb.getMessages(Number(orderId)).filter(m => (m.tenantId ?? DEFAULT_TENANT_ID) === tenantId);
      return Response.json({ status: 'success', tenantId, data: orderMessages });
    }

    // Verificar que la orden pertenezca al tenant antes de exponer sus mensajes
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, Number(orderId)), eq(orders.tenantId, tenantId)));
    if (!order) return Response.json({ error: 'Orden no encontrada' }, { status: 404 });

    const allMessages = await db
      .select()
      .from(messages)
      .where(and(eq(messages.orderId, Number(orderId)), eq(messages.tenantId, tenantId)))
      .orderBy(asc(messages.createdAt));

    return Response.json({ status: 'success', tenantId, data: allMessages });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener mensajes', details: error.message }, { status: 500 });
  }
}

// POST: Enviar un nuevo mensaje en una orden
export async function POST(request: Request) {
  try {
    const body = await request.json();
    //  senderId es opcional pero se guarda si viene (FK real al usuario)
    const { orderId, senderName, messageText, senderId = null } = body;

    if (!orderId || !senderName || !messageText) {
      return Response.json({ error: 'orderId, senderName y messageText son requeridos' }, { status: 400 });
    }

    const tenantId = await resolveTenantId(request);

    if (!isDbConnected() || !db) {
      const order = localDb.getOrderById(Number(orderId));
      if (!order) return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
      if ((order.tenantId ?? DEFAULT_TENANT_ID) !== tenantId) {
        return Response.json({ error: 'No autorizado para este tenant' }, { status: 403 });
      }
      const newMessage = localDb.insertMessage({
        orderId: Number(orderId),
        tenantId,
        senderId: senderId ? Number(senderId) : null,  //  FK al usuario
        senderName,
        messageText,
      });
      return Response.json({ status: 'success', tenantId, message: newMessage });
    }

    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, Number(orderId)), eq(orders.tenantId, tenantId)));
    if (!order) return Response.json({ error: 'Orden no encontrada' }, { status: 404 });

    const newMessage = await db.insert(messages).values({
      orderId: Number(orderId),
      tenantId,
      senderId: senderId ? Number(senderId) : null,    //  FK al usuario
      senderName,
      messageText,
    }).returning();

    return Response.json({ status: 'success', tenantId, message: newMessage[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al enviar mensaje', details: error.message }, { status: 500 });
  }
}

import { db, isDbConnected } from '../../db';
import { messages } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { localDb } from '../../db/localDb';
import { getClientIp, isRateLimited, isPayloadTooLarge } from '../../utils/rate-limiter';

// GET: Obtener todos los mensajes de una orden específica (o todos si all=true)
export async function GET(request: Request) {
  try {
    // Anti-DDoS / Rate Limiting (Máximo 120 consultas por minuto = 2 por segundo para tolerar polling)
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 120, 60000)) {
      return Response.json({ error: 'Límite de peticiones excedido (Anti-DDoS).' }, { status: 429 });
    }
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const isGlobal = url.searchParams.get('all') === 'true';

    if (isGlobal) {
      if (!isDbConnected() || !db) {
        const allMessages = localDb.getMessages();
        return Response.json({ status: 'success', data: allMessages });
      }
      const allMessages = await db
        .select()
        .from(messages)
        .orderBy(asc(messages.createdAt));
      return Response.json({ status: 'success', data: allMessages });
    }

    if (!orderId) {
      return Response.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      const orderMessages = localDb.getMessages(Number(orderId));
      return Response.json({ status: 'success', data: orderMessages });
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, Number(orderId)))
      .orderBy(asc(messages.createdAt));

    return Response.json({ status: 'success', data: allMessages });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener mensajes', details: error.message }, { status: 500 });
  }
}

// POST: Enviar un nuevo mensaje en una orden
export async function POST(request: Request) {
  try {
    // 1. Verificar DDoS / Tamaño del Payload (Límite 1MB)
    if (isPayloadTooLarge(request)) {
      return Response.json({ error: 'Payload excesivo. Petición rechazada por seguridad.' }, { status: 413 });
    }

    // 2. Anti-DDoS / Rate Limiting (Máximo 40 mensajes enviados por minuto por IP)
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 40, 60000)) {
      return Response.json({ error: 'Límite de peticiones excedido (Anti-DDoS).' }, { status: 429 });
    }
    const body = await request.json();
    //  senderId es opcional pero se guarda si viene (FK real al usuario)
    const { orderId, senderName, messageText, senderId = null } = body;

    if (!orderId || !senderName || !messageText) {
      return Response.json({ error: 'orderId, senderName y messageText son requeridos' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      const newMessage = localDb.insertMessage({
        orderId: Number(orderId),
        senderId: senderId ? Number(senderId) : null,  //  FK al usuario
        senderName,
        messageText,
      });
      return Response.json({ status: 'success', message: newMessage });
    }

    const newMessage = await db.insert(messages).values({
      orderId: Number(orderId),
      senderId: senderId ? Number(senderId) : null,    //  FK al usuario
      senderName,
      messageText,
    }).returning();

    return Response.json({ status: 'success', message: newMessage[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al enviar mensaje', details: error.message }, { status: 500 });
  }
}

import { db, isDbConnected } from '../../db';
import { messages } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

// GET: Obtener todos los mensajes de una orden específica
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return Response.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      // Modo simulado: devolver mensajes de prueba
      return Response.json({
        status: 'simulated',
        data: [
          { id: 1, orderId: Number(orderId), senderName: 'Juan Ríos', messageText: '¡Hola! Soy Juan Ríos, plomero certificado. Ya voy en camino.', createdAt: new Date(Date.now() - 120000).toISOString() },
          { id: 2, orderId: Number(orderId), senderName: 'Tú', messageText: 'Perfecto Juan, te espero. El lavabo está en el segundo piso.', createdAt: new Date(Date.now() - 60000).toISOString() },
        ]
      });
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
    const body = await request.json();
    const { orderId, senderName, messageText } = body;

    if (!orderId || !senderName || !messageText) {
      return Response.json({ error: 'orderId, senderName y messageText son requeridos' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      return Response.json({
        status: 'simulated',
        message: { id: Date.now(), orderId, senderName, messageText, createdAt: new Date().toISOString() }
      });
    }

    const newMessage = await db.insert(messages).values({
      orderId: Number(orderId),
      senderName,
      messageText,
    }).returning();

    return Response.json({ status: 'success', message: newMessage[0] });
  } catch (error: any) {
    return Response.json({ error: 'Error al enviar mensaje', details: error.message }, { status: 500 });
  }
}

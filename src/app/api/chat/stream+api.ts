// Endpoint GET /api/chat/stream
// Servidor de Eventos en Tiempo Real (Server-Sent Events - SSE)
// Permite que la app reciba mensajes nuevos al instante sin polling (0s de latencia)

import { db } from '../../../db';
import { messages as messagesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = Number(url.searchParams.get('orderId')) || 1;
  const lastId = Number(url.searchParams.get('lastId')) || 0;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Función para enviar mensaje SSE formateado
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Enviar evento inicial de conexión establecida
      sendEvent({ type: 'connected', orderId, timestamp: new Date().toISOString() });

      let currentLastId = lastId;

      // Intervalo de chequeo ultrarrápido (500ms) solo en el servidor para notificar al cliente sin bloquear HTTP
      const intervalId = setInterval(async () => {
        try {
          if (db) {
            const newMsgs = await db
              .select()
              .from(messagesTable)
              .where(eq(messagesTable.orderId, orderId));

            const fresh = newMsgs.filter(m => m.id > currentLastId);
            if (fresh.length > 0) {
              currentLastId = Math.max(...fresh.map(m => m.id));
              sendEvent({ type: 'new_messages', messages: fresh });
            }
          }
        } catch (e) {
          // Ignorar errores temporales de conexión
        }
      }, 500);

      // Mantener la conexión durante 30 segundos y pedir reconexión suave
      setTimeout(() => {
        clearInterval(intervalId);
        sendEvent({ type: 'reconnect_suggested' });
        controller.close();
      }, 30000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

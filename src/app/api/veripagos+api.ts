import { db, isDbConnected } from '../../db';
import { users, transactions } from '../../db/schema';
import { eq } from 'drizzle-orm';

const VERIPAGOS_SECRET_KEY = '12df605b-5dd3-4a35-84b0-b9ec07bfecae';
const VERIPAGOS_PASSWORD = 's9Ee7!Cw67';
const VERIPAGOS_USER = 'victorhugo';

// Auxiliar para codificar Basic Auth
function getBasicAuthHeader() {
  const credentials = `${VERIPAGOS_USER}:${VERIPAGOS_PASSWORD}`;
  // En entornos de Node/Expo backend, Buffer está disponible globalmente
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

// POST: Generar un código QR de VeriPagos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, monedas, detalle } = body;

    if (!userId || !monedas) {
      return Response.json({ error: 'Se requiere userId y cantidad de monedas' }, { status: 400 });
    }

    // Para la demo del Hackatón cobrará 1.00 Bs. reales
    const montoReal = 1.00;

    const dataArray = [
      JSON.stringify({ userId, monedas })
    ];

    const basicAuth = getBasicAuthHeader();

    const response = await fetch('https://veripagos.com/api/bcp/generar-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify({
        secret_key: VERIPAGOS_SECRET_KEY,
        monto: montoReal,
        data: dataArray,
        uso_unico: true,
        vigencia: "0/00:15",
        detalle: detalle || `Recarga de ${monedas} monedas`
      })
    });

    const result = await response.json();

    if (result.Codigo !== 0) {
      return Response.json({ error: result.Mensaje || 'Error de VeriPagos' }, { status: 400 });
    }

    return Response.json({
      status: 'success',
      movimiento_id: result.Data.movimiento_id,
      qr: `data:image/png;base64,${result.Data.qr}`
    });

  } catch (error: any) {
    console.error('Error generating VeriPagos QR:', error);
    return Response.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// GET: Consultar el estado del QR y acreditar monedas si está completado
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const movimientoIdStr = url.searchParams.get('movimiento_id');
    const userIdStr = url.searchParams.get('userId');
    const monedasStr = url.searchParams.get('monedas');

    if (!movimientoIdStr || !userIdStr || !monedasStr) {
      return Response.json({ error: 'Faltan parámetros de consulta (movimiento_id, userId, monedas)' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const monedas = parseInt(monedasStr, 10);

    const basicAuth = getBasicAuthHeader();

    // Consultar estado en VeriPagos
    const response = await fetch('https://veripagos.com/api/bcp/verificar-estado-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify({
        secret_key: VERIPAGOS_SECRET_KEY,
        movimiento_id: String(movimientoIdStr)
      })
    });

    const result = await response.json();

    if (result.Codigo !== 0) {
      return Response.json({ error: result.Mensaje || 'Error al consultar estado en VeriPagos' }, { status: 400 });
    }

    const estadoPago = result.Data.estado; // "Completado", "Pendiente", etc.

    if (estadoPago === 'Completado') {
      // 1. Acreditar las monedas en la base de datos si está online
      if (isDbConnected() && db) {
        // Consultar el saldo actual
        const [user] = await db.select({ monedas: users.monedas }).from(users).where(eq(users.id, userId));
        if (user) {
          const saldoActual = user.monedas ?? 0;
          const nuevoSaldo = saldoActual + monedas;

          // Evitar doble acreditación comprobando si ya registramos esta recarga
          const detalleUnico = `Recarga VeriPagos #${movimientoIdStr}`;
          const [transaccionExistente] = await db.select().from(transactions).where(eq(transactions.detalle, detalleUnico));

          if (!transaccionExistente) {
            // Actualizar saldo
            await db.update(users)
              .set({ monedas: nuevoSaldo })
              .where(eq(users.id, userId));

            // Registrar transacción
            await db.insert(transactions).values({
              usuario_id: userId,
              tipo: 'recarga',
              monto_monedas: monedas,
              detalle: detalleUnico
            });

            return Response.json({
              status: 'success',
              paymentStatus: estadoPago,
              accredited: true,
              coins: nuevoSaldo,
              message: 'Pago completado y monedas acreditadas con éxito'
            });
          } else {
            return Response.json({
              status: 'success',
              paymentStatus: estadoPago,
              accredited: false,
              coins: saldoActual,
              message: 'El pago ya había sido acreditado previamente'
            });
          }
        }
      }
    }

    return Response.json({
      status: 'success',
      paymentStatus: estadoPago,
      accredited: false,
      message: `El pago está en estado: ${estadoPago}`
    });

  } catch (error: any) {
    console.error('Error verifying VeriPagos QR:', error);
    return Response.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

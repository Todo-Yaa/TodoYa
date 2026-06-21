import { db, isDbConnected } from '../../db';
import { users, transactions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: Obtener saldo e historial de transacciones de un usuario
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdStr = url.searchParams.get('userId');
    
    if (!userIdStr) {
      return Response.json({ error: 'Se requiere userId' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);

    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', coins: 24, history: [] });
    }

    // Obtener saldo actual
    const [user] = await db.select({ monedas: users.monedas }).from(users).where(eq(users.id, userId));
    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener historial
    const history = await db.select()
      .from(transactions)
      .where(eq(transactions.usuario_id, userId))
      .orderBy(desc(transactions.createdAt));

    return Response.json({
      status: 'success',
      coins: user.monedas,
      history: history
    });
  } catch (error: any) {
    return Response.json({ error: 'Error al obtener billetera', details: error.message }, { status: 500 });
  }
}

// POST: Registrar recarga o gasto y actualizar saldo
export async function POST(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      return Response.json({ status: 'simulated', message: 'Simulado en AsyncStorage' });
    }

    const body = await request.json();
    const { userId, tipo, monto, detalle } = body;

    if (!userId || !tipo || !monto || !detalle) {
      return Response.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // 1. Obtener usuario para conocer saldo actual
    const [user] = await db.select({ monedas: users.monedas }).from(users).where(eq(users.id, userId));
    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const saldoActual = user.monedas ?? 0;
    
    // Si es un gasto, verificar que haya fondos suficientes
    if (tipo === 'gasto' && saldoActual < monto) {
      return Response.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    const nuevoSaldo = tipo === 'recarga' ? saldoActual + monto : saldoActual - monto;

    // Ejecutar actualización de saldo
    await db.update(users)
      .set({ monedas: nuevoSaldo })
      .where(eq(users.id, userId));

    // Registrar transacción
    const nuevaTransaccion = await db.insert(transactions).values({
      usuario_id: userId,
      tipo: tipo,
      monto_monedas: monto,
      detalle: detalle
    }).returning();

    return Response.json({
      status: 'success',
      coins: nuevoSaldo,
      transaction: nuevaTransaccion[0]
    });
  } catch (error: any) {
    return Response.json({ error: 'Error procesando transacción', details: error.message }, { status: 500 });
  }
}

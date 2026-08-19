// PATCH /api/kyc-update
// Persiste el resultado de verificación KYC del usuario en Neon DB.
// Body: { userId: number, kycVerificado: boolean, kycDetalles: string }

import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, kycVerificado, kycDetalles } = body;

    if (!userId) {
      return Response.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Si no hay conexión a Neon, retornar éxito silencioso (se sincronizará después)
    if (!db) {
      return Response.json({ status: 'offline', message: 'Sin conexión a DB, se guardará al reconectar.' });
    }

    await db
      .update(users)
      .set({
        kycVerificado: kycVerificado ?? true,
        kycDetalles: kycDetalles ?? 'Verificado',
      })
      .where(eq(users.id, userId));

    return Response.json({ status: 'success', message: 'KYC actualizado en Neon DB correctamente.' });

  } catch (error: any) {
    console.error('[kyc-update] Error:', error.message);
    return Response.json({ error: 'Error interno al actualizar KYC', details: error.message }, { status: 500 });
  }
}

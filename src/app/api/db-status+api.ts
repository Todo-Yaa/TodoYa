import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';

export async function GET(request: Request) {
  try {
    let connected = isDbConnected();
    let queryExito = false;
    let errorMessage = '';
    
    if (connected && db) {
      try {
        // Hacemos una consulta rápida de prueba para asegurar que la base de datos responde
        await db.select().from(users).limit(1);
        queryExito = true;
      } catch (dbErr: any) {
        connected = false;
        errorMessage = dbErr.message;
        console.error('❌ Error de conexión real a Neon DB:', dbErr);
      }
    }
    
    return Response.json({
      status: 'ok',
      database: (connected && queryExito) ? 'connected' : 'local_db.json (Offline)',
      provider: (connected && queryExito) ? 'Neon.db (PostgreSQL Serverless)' : 'JSON Local File System',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error general en /api/db-status:', error);
    return Response.json(
      { error: 'Error al verificar la base de datos', details: error.message },
      { status: 500 }
    );
  }
}

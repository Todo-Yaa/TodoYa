import { isDbConnected } from '../../db';

export async function GET(request: Request) {
  try {
    const connected = isDbConnected();
    
    return Response.json({
      status: 'ok',
      database: connected ? 'connected' : 'simulated (missing EXPO_PUBLIC_DATABASE_URL)',
      provider: 'Neon.db (PostgreSQL Serverless)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json(
      { error: 'Error al verificar la base de datos', details: error.message },
      { status: 500 }
    );
  }
}

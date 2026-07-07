import { db, isDbConnected } from '../../db';
import { reports } from '../../db/schema';
import { localDb } from '../../db/localDb';

// GET: Obtener todos los reportes
export async function GET(request: Request) {
  try {
    if (!isDbConnected() || !db) {
      const localReports = localDb.getReports();
      return Response.json({ status: 'success', data: localReports });
    }

    const allReports = await db.select().from(reports);
    return Response.json({ status: 'success', data: allReports });
  } catch (error: any) {
    console.error('Error in GET /api/reports:', error);
    return Response.json({ error: 'Error al obtener reportes', details: error.message }, { status: 500 });
  }
}

// POST: Registrar un reporte contra un proveedor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pedidoId, reportanteId, reportadoNombre, motivo, descripcion } = body;

    if (!reportadoNombre || !motivo || !descripcion) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (!isDbConnected() || !db) {
      const nuevoReporte = localDb.insertReport({
        pedidoId,
        reportanteId,
        reportadoNombre,
        motivo,
        descripcion,
        estado: 'pendiente'
      });
      return Response.json({ status: 'success', data: nuevoReporte });
    }

    const [nuevoReporte] = await db.insert(reports)
      .values({
        pedidoId: pedidoId || null,
        reportanteId: reportanteId || null,
        reportadoNombre,
        motivo,
        descripcion,
        estado: 'pendiente'
      })
      .returning();

    return Response.json({ status: 'success', data: nuevoReporte });
  } catch (error: any) {
    console.error('Error in POST /api/reports:', error);
    return Response.json({ error: 'Error al procesar reporte', details: error.message }, { status: 500 });
  }
}

import { db, isDbConnected } from '../../db';
import { users, transactions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { localDb } from '../../db/localDb';

const VERIPAGOS_SECRET_KEY = '12df605b-5dd3-4a35-84b0-b9ec07bfecae';
const VERIPAGOS_PASSWORD = 's9Ee7!Cw67';
const VERIPAGOS_USER = 'victorhugo';

// Auxiliar para codificar Basic Auth
function getBasicAuthHeader() {
  const credentials = `${VERIPAGOS_USER}:${VERIPAGOS_PASSWORD}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

// Helper to extract QR image from different VeriPagos response formats
function extractQrImage(data: any): string | null {
  if (!data) return null;
  // Format 1: base64 string directly in qr field
  if (typeof data.qr === 'string' && data.qr.length > 0) {
    // If it's already a data URL, return as is
    if (data.qr.startsWith('data:')) return data.qr;
    // If it looks like a URL, return as is
    if (data.qr.startsWith('http')) return data.qr;
    // Otherwise treat as raw base64
    return `data:image/png;base64,${data.qr}`;
  }
  // Format 2: image_base64 field
  if (typeof data.image_base64 === 'string' && data.image_base64.length > 0) {
    return `data:image/png;base64,${data.image_base64}`;
  }
  // Format 3: qr_base64 field
  if (typeof data.qr_base64 === 'string' && data.qr_base64.length > 0) {
    return `data:image/png;base64,${data.qr_base64}`;
  }
  // Format 4: qr_image field
  if (typeof data.qr_image === 'string' && data.qr_image.length > 0) {
    return data.qr_image.startsWith('data:') ? data.qr_image : `data:image/png;base64,${data.qr_image}`;
  }
  // Format 5: imagen field
  if (typeof data.imagen === 'string' && data.imagen.length > 0) {
    return data.imagen.startsWith('data:') ? data.imagen : `data:image/png;base64,${data.imagen}`;
  }
  return null;
}

// Helper to extract movement ID from different response formats
function extractMovimientoId(data: any): any {
  if (!data) return null;
  return data.movimiento_id ?? data.id ?? data.transaction_id ?? data.qr_id ?? null;
}

// Helper to check if the VeriPagos response indicates success
function isVeriPagosSuccess(result: any): boolean {
  // Different possible success indicators
  if (result.Codigo === 0) return true;
  if (result.codigo === 0) return true;
  if (result.status === 'success' || result.status === 'ok') return true;
  if (result.success === true) return true;
  // If there's Data without an error code, assume success
  if (result.Data && (result.Codigo === undefined && result.codigo === undefined)) return true;
  return false;
}

// POST: Generar un código QR de VeriPagos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, monedas, planId, detalle } = body;

    if (userId === undefined || userId === null) {
      return Response.json({ error: 'Se requiere userId' }, { status: 400 });
    }

    // Para la demo del Hackatón cobrará 1.00 Bs. reales
    const montoReal = 1.00;

    const dataArray = [
      JSON.stringify({ userId, planId, monedas })
    ];

    const basicAuth = getBasicAuthHeader();
    
    const requestPayload = {
      secret_key: VERIPAGOS_SECRET_KEY,
      monto: montoReal,
      data: dataArray,
      uso_unico: true,
      vigencia: "0/00:15",
      detalle: detalle || `Suscripción a plan / Recarga`
    };

    console.log('[VeriPagos POST] Sending request to VeriPagos:', JSON.stringify(requestPayload));

    const response = await fetch('https://veripagos.com/api/bcp/generar-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify(requestPayload)
    });

    const rawText = await response.text();
    console.log('[VeriPagos POST] HTTP Status:', response.status);
    console.log('[VeriPagos POST] Raw Response:', rawText);

    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error('[VeriPagos POST] Failed to parse JSON response:', rawText);
      return Response.json({ 
        error: 'Respuesta inválida de VeriPagos', 
        details: `HTTP ${response.status}: ${rawText.substring(0, 200)}`,
        rawResponse: rawText.substring(0, 500)
      }, { status: 502 });
    }

    console.log('[VeriPagos POST] Parsed result:', JSON.stringify(result));

    if (!isVeriPagosSuccess(result)) {
      const errorMsg = result.Mensaje || result.mensaje || result.message || result.error || 'Error de VeriPagos';
      console.error('[VeriPagos POST] VeriPagos returned error:', errorMsg, 'Full result:', JSON.stringify(result));
      return Response.json({ 
        error: errorMsg, 
        veripagosResponse: result 
      }, { status: 400 });
    }

    const dataSection = result.Data || result.data || result;
    const movimientoId = extractMovimientoId(dataSection);
    const qrImage = extractQrImage(dataSection);

    console.log('[VeriPagos POST] movimiento_id:', movimientoId);
    console.log('[VeriPagos POST] QR found:', !!qrImage, 'length:', qrImage?.length);

    if (!movimientoId) {
      console.error('[VeriPagos POST] No movimiento_id found in response. Data:', JSON.stringify(dataSection));
      return Response.json({ 
        error: 'No se recibió ID de movimiento de VeriPagos',
        veripagosResponse: result
      }, { status: 502 });
    }

    if (!qrImage) {
      console.error('[VeriPagos POST] No QR image found in response. Data:', JSON.stringify(dataSection));
      return Response.json({ 
        error: 'No se recibió imagen QR de VeriPagos',
        veripagosResponse: result,
        availableFields: Object.keys(dataSection || {})
      }, { status: 502 });
    }

    return Response.json({
      status: 'success',
      movimiento_id: movimientoId,
      qr: qrImage
    });

  } catch (error: any) {
    console.error('[VeriPagos POST] Unexpected error:', error);
    return Response.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// Helper to get plan name
function getPlanName(planId: string | null) {
  switch (planId) {
    case 'provider_1': return 'Plan 1 - Residencial';
    case 'provider_2': return 'Plan 2 - Profesional';
    case 'provider_3': return 'Plan 3 - Élite';
    case 'business_1': return 'Plan Empresa 1 - Básico';
    case 'business_2': return 'Plan Empresa 2 - Pro';
    case 'business_3': return 'Plan Empresa 3 - Élite';
    default: return 'Plan Básico';
  }
}

// GET: Consultar el estado del QR y acreditar plan o monedas si está completado
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const movimientoIdStr = url.searchParams.get('movimiento_id');
    const userIdStr = url.searchParams.get('userId');
    const monedasStr = url.searchParams.get('monedas');
    const planId = url.searchParams.get('planId');

    if (!movimientoIdStr || !userIdStr || !monedasStr) {
      return Response.json({ error: 'Faltan parámetros de consulta (movimiento_id, userId, monedas)' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const monedas = parseInt(monedasStr, 10);

    const basicAuth = getBasicAuthHeader();

    const verifyPayload = {
      secret_key: VERIPAGOS_SECRET_KEY,
      movimiento_id: String(movimientoIdStr)
    };

    console.log('[VeriPagos GET] Checking status for movimiento_id:', movimientoIdStr);

    // Consultar estado en VeriPagos
    const response = await fetch('https://veripagos.com/api/bcp/verificar-estado-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuth
      },
      body: JSON.stringify(verifyPayload)
    });

    const rawText = await response.text();
    console.log('[VeriPagos GET] HTTP Status:', response.status);
    console.log('[VeriPagos GET] Raw Response:', rawText);

    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error('[VeriPagos GET] Failed to parse JSON:', rawText);
      return Response.json({ 
        error: 'Respuesta inválida de VeriPagos al verificar estado', 
        details: rawText.substring(0, 200) 
      }, { status: 502 });
    }

    console.log('[VeriPagos GET] Parsed result:', JSON.stringify(result));

    if (!isVeriPagosSuccess(result)) {
      const errorMsg = result.Mensaje || result.mensaje || result.message || result.error || 'Error al consultar estado en VeriPagos';
      console.error('[VeriPagos GET] Error from VeriPagos:', errorMsg);
      return Response.json({ error: errorMsg, veripagosResponse: result }, { status: 400 });
    }

    const dataSection = result.Data || result.data || result;
    const estadoPago: string = dataSection.estado || dataSection.status || dataSection.estado_qr || dataSection.payment_status || 'Pendiente';

    console.log('[VeriPagos GET] Estado de pago:', estadoPago);

    if (estadoPago === 'Completado' || estadoPago === 'completado' || estadoPago === 'COMPLETADO' || estadoPago === 'Pagado' || estadoPago === 'pagado') {
      const planName = planId ? getPlanName(planId) : `Recarga de ${monedas} monedas`;
      const detalleUnico = planId ? `Suscripción a ${planName} (#${movimientoIdStr})` : `Recarga VeriPagos #${movimientoIdStr}`;

      // 1. Acreditar el plan/monedas en la base de datos si está online
      if (isDbConnected() && db) {
        try {
          const [user] = await db.select({ planId: users.planId, monedas: users.monedas }).from(users).where(eq(users.id, userId));
          if (user) {
            const saldoActual = user.monedas ?? 0;
            const nuevoSaldo = saldoActual + (planId ? 0 : monedas);

            // Evitar doble acreditación
            const [transaccionExistente] = await db.select().from(transactions).where(eq(transactions.detalle, detalleUnico));

            if (!transaccionExistente) {
              const updatePayload: any = {};
              if (planId) {
                updatePayload.planId = planId;
              } else {
                updatePayload.monedas = nuevoSaldo;
              }

              await db.update(users)
                .set(updatePayload)
                .where(eq(users.id, userId));

              // Registrar transacción
              await db.insert(transactions).values({
                usuario_id: userId,
                tipo: 'recarga',
                monto_monedas: monedas, // guardamos el precio del plan en Bs. en el campo de monto
                detalle: detalleUnico
              });

              console.log('[VeriPagos GET] Plan/Monedas acreditados exitosamente en Neon DB:', planId || nuevoSaldo);

              return Response.json({
                status: 'success',
                paymentStatus: 'Completado',
                accredited: true,
                coins: nuevoSaldo,
                planId: planId || user.planId,
                message: 'Pago completado y plan acreditado con éxito'
              });
            } else {
              return Response.json({
                status: 'success',
                paymentStatus: 'Completado',
                accredited: false,
                coins: saldoActual,
                planId: user.planId,
                message: 'El pago ya había sido acreditado previamente'
              });
            }
          }
        } catch (dbError: any) {
          console.error('[VeriPagos GET] DB error while crediting:', dbError);
          return Response.json({
            status: 'success',
            paymentStatus: 'Completado',
            accredited: false,
            message: 'Pago completado pero error al acreditar en BD: ' + dbError.message
          });
        }
      } else {
        // DB no disponible - actualizar localDb si existe
        try {
          const user = localDb.getUserById(userId);
          if (user) {
            const history = localDb.getTransactions(userId);
            const transaccionExistente = history.find((t: any) => t.detalle === detalleUnico);
            
            if (!transaccionExistente) {
              if (planId) {
                localDb.updateUserById(userId, { planId });
              } else {
                const saldoActual = user.monedas ?? 0;
                localDb.updateUserById(userId, { monedas: saldoActual + monedas });
              }
              localDb.insertTransaction({
                usuario_id: userId,
                tipo: 'recarga',
                monto_monedas: monedas,
                detalle: detalleUnico
              });
            }
          }
        } catch (localDbError) {
          console.error('[VeriPagos GET] Error al actualizar localDb:', localDbError);
        }

        return Response.json({
          status: 'success',
          paymentStatus: 'Completado',
          accredited: true,
          message: 'Pago completado y acreditado en base de datos local'
        });
      }
    }

    return Response.json({
      status: 'success',
      paymentStatus: estadoPago,
      accredited: false,
      message: `El pago está en estado: ${estadoPago}`
    });

  } catch (error: any) {
    console.error('[VeriPagos GET] Unexpected error:', error);
    return Response.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

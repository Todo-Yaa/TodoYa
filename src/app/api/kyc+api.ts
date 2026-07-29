import { checkApiRateLimit } from '../../utils/rate-limiter';
import { sanitizeText } from '../../utils/security';

// API Proxy para el Verificador de KYC de decouple-services (Walter Ibañez)
// Endpoint base de AWS: https://cm981m6ag1.execute-api.us-east-1.amazonaws.com

const KYC_SIMULATED = process.env.EXPO_PUBLIC_KYC_SIMULATED !== 'false'; // Por defecto en modo simulado para no gastar recursos
const KYC_API_BASE = 'https://cm981m6ag1.execute-api.us-east-1.amazonaws.com';

// POST: Generar presigned URL para subir la imagen a S3 (Step 1)
// Body: { action: 'presign' } → { sessionId, uploadUrl }
// POST: Verificar la imagen ya subida con Claude (Step 2)
// Body: { action: 'verify', sessionId } → { approved, details, rejectedReasons }
export async function POST(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 10, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { action, sessionId } = body;

    const cleanAction = action ? sanitizeText(action) : '';
    const cleanSessionId = sessionId ? sanitizeText(sessionId) : null;

    // ========= MODO SIMULADO (para proteger recursos de AWS) =========
    if (KYC_SIMULATED) {
      if (cleanAction === 'presign') {
        const fakeSessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return Response.json({
          status: 'simulated',
          sessionId: fakeSessionId,
          uploadUrl: `https://fake-s3-bucket.s3.amazonaws.com/kyc/${fakeSessionId}?presigned=true`,
        });
      }

      if (cleanAction === 'verify') {
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const approved = Math.random() > 0.1;
        return Response.json({
          status: 'simulated',
          result: {
            approved,
            details: approved
              ? 'Carnet de Identidad boliviano verificado. Nombre visible: legible. Fecha de nacimiento válida. Documento dentro del período de vigencia.'
              : 'Documento rechazado: imagen borrosa o ilegible. Por favor, intente nuevamente con mejor iluminación.',
            rejectedReasons: approved ? [] : ['Image quality too low', 'Text not readable'],
          }
        });
      }
    }

    // ========= MODO REAL =========
    if (cleanAction === 'presign') {
      const res = await fetch(`${KYC_API_BASE}/api/v1/identification/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const errText = await res.text();
        return Response.json({ error: 'Error en presign de AWS', details: errText }, { status: res.status });
      }
      
      const data = await res.json();
      return Response.json({ status: 'success', ...data });
    }

    if (cleanAction === 'verify') {
      if (!cleanSessionId) {
        return Response.json({ error: 'sessionId es requerido para verificar' }, { status: 400 });
      }

      const res = await fetch(`${KYC_API_BASE}/api/v1/identification/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: cleanSessionId }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return Response.json({ error: 'Error en verificación de AWS', details: errText }, { status: res.status });
      }

      const data = await res.json();
      return Response.json({ status: 'success', result: data });
    }

    return Response.json({ error: 'Acción inválida. Use "presign" o "verify".' }, { status: 400 });

  } catch (error: any) {
    return Response.json({ error: 'Error interno del proxy KYC', details: error.message }, { status: 500 });
  }
}

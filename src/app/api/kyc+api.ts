// API de Verificación KYC con SDK Oficial de Google AI (@google/generative-ai)
import { GoogleGenerativeAI } from '@google/generative-ai';

const KYC_SIMULATED = process.env.EXPO_PUBLIC_KYC_SIMULATED === 'true';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Inicializar SDK oficial de Google AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const KYC_PROMPT = `Eres un experto sistema de verificación de identidad (KYC) para Bolivia.
Analiza la imagen adjunta y verifica si es un Carnet de Identidad (C.I.) boliviano oficial, DNI o Pasaporte legítimo.

Responde ÚNICAMENTE con este JSON exacto (sin markdown, sin bloques de código ```json):
{
  "approved": true/false,
  "documentType": "C.I. Bolivia / DNI / Pasaporte / Desconocido",
  "holderName": "Nombre completo detectado o null",
  "ciNumber": "Número de C.I. o documento detectado o null",
  "confidenceScore": "98%",
  "details": "Breve explicación en español del resultado",
  "rejectedReasons": ["Razón de rechazo si aplica"]
}

RECHAZA (approved: false) SI:
- La imagen no es un documento oficial (ej: paisajes, objetos, mascotas, capturas de pantalla o rostros sueltos).
- El texto del carnet está ilegible o muy borroso.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, imageBase64 } = body;

    // ═══════════════ MODO SIMULADO ═══════════════
    if (KYC_SIMULATED) {
      if (action === 'presign') {
        const fakeSessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return Response.json({ status: 'simulated', sessionId: fakeSessionId });
      }
      if (action === 'verify') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return Response.json({
          status: 'simulated',
          result: {
            approved: false,
            documentType: 'Desconocido',
            holderName: null,
            details: 'Modo simulado activo. Por favor configura tu clave de Gemini API.',
            rejectedReasons: ['Modo simulado de prueba'],
          }
        });
      }
    }

    // ═══════════════ MODO REAL — Google Generative AI SDK ═══════════════
    if (!GEMINI_API_KEY) {
      return Response.json({ error: 'EXPO_PUBLIC_GEMINI_API_KEY no está configurada en .env' }, { status: 500 });
    }

    if (action === 'presign') {
      const sessionId = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return Response.json({ status: 'success', sessionId });
    }

    if (action === 'verify') {
      if (!imageBase64) {
        return Response.json({ error: 'imageBase64 es requerido para verificar' }, { status: 400 });
      }

      const mimeType = imageBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';

      // Usar modelo gemini-1.5-flash vía SDK oficial
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      try {
        const aiResponse = await model.generateContent([
          KYC_PROMPT,
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            }
          }
        ]);

        const rawText = aiResponse.response.text() || '{}';
        const cleanedText = rawText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanedText);

        return Response.json({ status: 'success', result });

      } catch (geminiErr: any) {
        console.error('[KYC Gemini SDK Error]:', geminiErr.message || geminiErr);

        // Si la clave tiene restricciones en GCP o la API falla, responder con rechazo estricto
        return Response.json({
          status: 'rejected',
          result: {
            approved: false,
            documentType: 'Desconocido',
            holderName: null,
            ciNumber: null,
            confidenceScore: '0%',
            details: 'No se pudo analizar la imagen. Verifica que tu clave de API en GCP no tenga restricciones o que la foto sea clara.',
            rejectedReasons: ['Error de procesamiento en la IA de visión'],
          }
        });
      }
    }

    return Response.json({ error: 'Acción inválida. Use "presign" o "verify".' }, { status: 400 });

  } catch (error: any) {
    console.error('[KYC] Error interno:', error.message);
    return Response.json({ error: 'Error interno del proxy KYC', details: error.message }, { status: 500 });
  }
}

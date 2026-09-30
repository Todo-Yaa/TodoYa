import { checkApiRateLimit } from '../../utils/rate-limiter';
import { sanitizeText } from '../../utils/security';

export async function POST(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 20, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { audio, mimeType } = body;

    if (!audio) {
      return Response.json({ error: 'Falta el archivo de audio codificado en Base64' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return Response.json({ error: 'La API Key de Gemini no está configurada' }, { status: 500 });
    }

    // Limpiar mimeType (ej: "audio/webm;codecs=opus" -> "audio/webm") para la API de Gemini
    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];
    console.log(`[Transcribe API] Enviando audio a Gemini para transcripción (${cleanMimeType})`);

    const prompt = "Transcribe el audio de forma exacta en español. No agregues comentarios, explicaciones, saludos, ni etiquetas de texto. Devuelve únicamente el texto transcrito, respetando puntuación y ortografía.";

    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];
    let lastError = '';
    let data: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMimeType,
                    data: audio
                  }
                },
                {
                  text: prompt
                }
              ]
            }]
          })
        });

        if (response.ok) {
          data = await response.json();
          break;
        } else {
          lastError = await response.text();
          console.warn(`[Transcribe API] Fallo con modelo ${model}:`, response.status, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[Transcribe API] Error llamando a ${model}:`, err);
      }
    }

    if (!data) {
      return Response.json({ error: 'Error al comunicarse con Gemini API para transcripción', details: lastError }, { status: 502 });
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = sanitizeText(text.trim());

    console.log(`[Transcribe API] Transcripción completada: "${text}"`);
    return Response.json({ text });

  } catch (error: any) {
    console.error('[Transcribe API] Error general en transcripción:', error);
    return Response.json({ error: 'Error interno al procesar la transcripción', details: error.message }, { status: 500 });
  }
}

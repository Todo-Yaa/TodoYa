export async function POST(request: Request) {
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

    console.log(`[Transcribe API] Enviando audio a Gemini para transcripción (${mimeType || 'audio/webm'})`);

    const prompt = "Transcribe el audio de forma exacta en español. No agregues comentarios, explicaciones, saludos, ni etiquetas de texto. Devuelve únicamente el texto transcrito, respetando puntuación y ortografía.";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Transcribe API] Error de Gemini API:', response.status, errorText);
      return Response.json({ error: `Error de Gemini API: ${response.status}`, details: errorText }, { status: 502 });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.trim();

    console.log(`[Transcribe API] Transcripción completada: "${text}"`);
    return Response.json({ text });

  } catch (error: any) {
    console.error('[Transcribe API] Error general en transcripción:', error);
    return Response.json({ error: 'Error interno al procesar la transcripción', details: error.message }, { status: 500 });
  }
}

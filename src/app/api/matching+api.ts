// Importar base de datos si estuviera activa
import { db } from '../../db';

// Datos de prueba locales para la simulación del Matching si no hay base de datos real
const PROVEEDORES_MOCK = [
  { id: 'p1', nombre: 'Juan Pérez', especialidad: 'Plomería', rating: 4.8, experiencia: 5, lat: -17.783, lng: -63.182, descripcion: 'Especialista en fugas de agua, grifos y cañerías.' },
  { id: 'p2', nombre: 'Carlos Gómez', especialidad: 'Electricidad', rating: 4.9, experiencia: 8, lat: -17.781, lng: -63.178, descripcion: 'Instalaciones eléctricas, cortocircuitos y mantenimiento.' },
  { id: 'p3', nombre: 'Ana Mendoza', especialidad: 'Plomería', rating: 4.2, experiencia: 2, lat: -17.786, lng: -63.185, descripcion: 'Mantenimiento preventivo e instalación de sanitarios.' },
  { id: 'p4', nombre: 'Luis Choque', especialidad: 'Pintura', rating: 4.7, experiencia: 10, lat: -17.788, lng: -63.175, descripcion: 'Pintura de interiores y exteriores, texturados.' },
  { id: 'p5', nombre: 'María Rodríguez', especialidad: 'Climatización', rating: 4.9, experiencia: 6, lat: -17.779, lng: -63.188, descripcion: 'Reparación y mantenimiento de aire acondicionado.' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { descripcion, latCliente = -17.784, lngCliente = -17.784 } = body;

    if (!descripcion || descripcion.trim() === '') {
      return Response.json({ error: 'La descripción del servicio es requerida' }, { status: 400 });
    }

    console.log(`[Matching API] Iniciando análisis para: "${descripcion}"`);

    // =========================================================================
    // 🧠 ESPACIO PARA INTEGRACIÓN DE APIS DE INTELIGENCIA ARTIFICIAL (OpenAI / Gemini)
    // =========================================================================
    /*
    // EJEMPLO: Integración con Google Gemini API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    let categoriaDetectadaPorIA = null;
    let urgenciaDetectadaPorIA = 'Normal';

    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analiza la siguiente solicitud de servicio y responde ÚNICAMENTE en formato JSON con la estructura {"categoria": "Plomería" | "Electricidad" | "Pintura" | "Climatización", "urgencia": "Normal" | "Alta"}.
                Solicitud: "${descripcion}"`
              }]
            }]
          })
        });
        const data = await response.json();
        const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(textoRespuesta.trim());
        categoriaDetectadaPorIA = parsed.categoria;
        urgenciaDetectadaPorIA = parsed.urgencia;
      } catch (err) {
        console.error('Error llamando a Gemini API:', err);
      }
    }

    // EJEMPLO: Integración con OpenAI API (GPT-4o-mini)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY && !categoriaDetectadaPorIA) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Eres un clasificador de tareas. Responde solo JSON con llaves "categoria" (Plomería, Electricidad, Pintura, Climatización) y "urgencia" (Normal, Alta)' },
              { role: 'user', content: descripcion }
            ],
            response_format: { type: 'json_object' }
          })
        });
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        categoriaDetectadaPorIA = parsed.categoria;
        urgenciaDetectadaPorIA = parsed.urgencia;
      } catch (err) {
        console.error('Error llamando a OpenAI API:', err);
      }
    }
    */
    // =========================================================================

    // =========================================================================
    // ⚙️ ALGORITMO DE MATCHING SIMULADO / FALLBACK (PROCESAMIENTO NLP BÁSICO)
    // =========================================================================
    let categoria = 'Plomería'; // Default
    let urgencia: 'Normal' | 'Alta' = 'Normal';
    const textLower = descripcion.toLowerCase();

    // Detección simple basada en palabras clave
    if (textLower.match(/(tubo|agua|gotera|fuga|grifo|lavaplatos|inodoro|caño|inundacion|inundación)/)) {
      categoria = 'Plomería';
      if (textLower.match(/(inundacion|inundación|fuga grave|revent|urgente|rapido|rápido|inmediat)/)) {
        urgencia = 'Alta';
      }
    } else if (textLower.match(/(luz|enchufe|corto|cable|cortocircuito|corriente|toma|llave|termica|térmica|tablero)/)) {
      categoria = 'Electricidad';
      if (textLower.match(/(humo|chispa|fuego|peligro|urgente|sin luz|cortocircuito)/)) {
        urgencia = 'Alta';
      }
    } else if (textLower.match(/(pintar|pared|techo|fachada|rodillo|brocha|humedad|color|acabado)/)) {
      categoria = 'Pintura';
    } else if (textLower.match(/(aire|acondicionado|clima|frio|frío|calor|gotea aire|no enfria|no enfría|split)/)) {
      categoria = 'Climatización';
      if (textLower.match(/(calor insoportable|urgente|oficina caliente)/)) {
        urgencia = 'Alta';
      }
    }

    // Calcular distancia de Harvesine simplificada
    const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distancia en km
    };

    // Algoritmo de Scoring:
    // score = (rating * 0.4) + (factor_distancia * 0.4) + (factor_experiencia * 0.2)
    // El mejor score se posiciona primero.
    const proveedoresFiltrados = PROVEEDORES_MOCK.filter(p => p.especialidad === categoria);
    
    const proveedoresConScore = proveedoresFiltrados.map(p => {
      const distancia = calcularDistancia(latCliente, lngCliente, p.lat, p.lng);
      
      // Factores normalizados de 0 a 1
      const factorRating = p.rating / 5.0;
      const factorDistancia = Math.max(0, 1 - (distancia / 10)); // Más cerca es mejor (max 10km)
      const factorExperiencia = Math.min(1, p.experiencia / 10); // 10 o más años de experiencia es el tope (1)
      
      const score = (factorRating * 0.4) + (factorDistancia * 0.4) + (factorExperiencia * 0.2);

      return {
        ...p,
        distanciaKm: parseFloat(distancia.toFixed(2)),
        score: parseFloat(score.toFixed(2))
      };
    });

    // Ordenar de mayor a menor puntuación (score)
    const proveedoresOrdenados = proveedoresConScore.sort((a, b) => b.score - a.score);

    // Sugerencia de precio base local
    let precioSugerido = '100 Bs. - 150 Bs.';
    if (categoria === 'Plomería') precioSugerido = urgencia === 'Alta' ? '180 Bs. - 250 Bs.' : '80 Bs. - 130 Bs.';
    if (categoria === 'Electricidad') precioSugerido = urgencia === 'Alta' ? '200 Bs. - 300 Bs.' : '100 Bs. - 180 Bs.';
    if (categoria === 'Pintura') precioSugerido = '250 Bs. - 450 Bs. (según m²)';
    if (categoria === 'Climatización') precioSugerido = '150 Bs. - 280 Bs.';

    return Response.json({
      success: true,
      nlpAnalysis: {
        categoriaDetectada: categoria,
        urgenciaDetectada: urgencia,
        confianza: 0.95,
      },
      precioSugerido,
      proveedoresEmparejados: proveedoresOrdenados,
      totalEncontrados: proveedoresOrdenados.length,
    });
  } catch (error: any) {
    return Response.json(
      { error: 'Error procesando el algoritmo de emparejamiento', details: error.message },
      { status: 500 }
    );
  }
}

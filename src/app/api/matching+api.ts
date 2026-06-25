// Importar base de datos si estuviera activa
import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Datos de prueba locales para la simulación del Matching si no hay base de datos real
const PROVEEDORES_MOCK = [
  { id: 'p1', nombre: 'Juan Pérez', especialidad: 'Plomería', rating: 4.8, experiencia: 5, lat: -17.783, lng: -63.182, descripcion: 'Especialista en fugas de agua, grifos y cañerías.' },
  { id: 'p2', nombre: 'Carlos Gómez', especialidad: 'Electricidad', rating: 4.9, experiencia: 8, lat: -17.781, lng: -63.178, descripcion: 'Instalaciones eléctricas, cortocircuitos y mantenimiento.' },
  { id: 'p3', nombre: 'Ana Mendoza', especialidad: 'Plomería', rating: 4.2, experiencia: 2, lat: -17.786, lng: -63.185, descripcion: 'Mantenimiento preventivo e instalación de sanitarios.' },
  { id: 'p4', nombre: 'Luis Choque', especialidad: 'Pintura', rating: 4.7, experiencia: 10, lat: -17.788, lng: -63.175, descripcion: 'Pintura de interiores y exteriores, texturados.' },
  { id: 'p5', nombre: 'María Rodríguez', especialidad: 'Climatización', rating: 4.9, experiencia: 6, lat: -17.779, lng: -63.188, descripcion: 'Reparación y mantenimiento de aire acondicionado.' },
  { id: 'p6', nombre: 'Luis Gómez', especialidad: 'Mecánico', rating: 4.8, experiencia: 5, lat: -17.785, lng: -63.185, descripcion: 'Mecánico automotriz a domicilio. Diagnóstico y reparación.' },
  { id: 'p7', nombre: 'Mario Roca', especialidad: 'Cerrajero', rating: 4.9, experiencia: 7, lat: -17.782, lng: -63.179, descripcion: 'Apertura de chapas, duplicados de llaves y cerrajería de emergencia.' },
  { id: 'p8', nombre: 'Pedro Silva', especialidad: 'Carpintero', rating: 4.7, experiencia: 6, lat: -17.788, lng: -63.181, descripcion: 'Carpintería en general, restauración y armado de muebles.' },
  { id: 'p9', nombre: 'Julio Vera', especialidad: 'Técnico de laptop-celulares', rating: 4.9, experiencia: 8, lat: -17.778, lng: -63.186, descripcion: 'Reparación de celulares y laptops. Cambio de pantalla y batería.' },
  { id: 'p10', nombre: 'Elena Paz', especialidad: 'Sastrería', rating: 4.8, experiencia: 12, lat: -17.781, lng: -63.189, descripcion: 'Arreglos de costura, entalles, confección a medida y bastas.' },
  { id: 'p11', nombre: 'Pensionado Doña Flor', especialidad: 'Viandas y Pensiones', rating: 4.9, experiencia: 5, lat: -17.781, lng: -63.189, descripcion: 'Almuerzos completos y viandas a domicilio.' },
  { id: 'p12', nombre: 'Pensionado El Buen Sabor', especialidad: 'Viandas y Pensiones', rating: 4.8, experiencia: 3, lat: -17.785, lng: -63.169, descripcion: 'Comida criolla y pensiones ejecutivas.' },
];

// Diccionarios de palabras clave para "Todas las Probabilidades" (Sistema de Puntaje)
const CATEGORIAS_BASE: Record<string, string[]> = {
  'Plomería': ['tubo', 'agua', 'gotera', 'fuga', 'grifo', 'lavaplatos', 'inodoro', 'caño', 'inundacion', 'inundación', 'cañeria', 'desague', 'baño', 'bomba', 'pileta', 'filtracion'],
  'Electricidad': ['luz', 'enchufe', 'corto', 'cable', 'cortocircuito', 'corriente', 'toma', 'llave', 'termica', 'térmica', 'tablero', 'apagon', 'foco', 'iluminacion', 'lampara', 'chispa', 'electrocutado'],
  'Pintura': ['pintar', 'pared', 'techo', 'fachada', 'rodillo', 'brocha', 'humedad', 'color', 'acabado', 'pintor', 'barniz', 'pintura', 'descacarado', 'latex'],
  'Climatización': ['aire', 'acondicionado', 'clima', 'frio', 'frío', 'calor', 'gotea', 'enfria', 'enfría', 'split', 'gas', 'compresor', 'ventilador', 'climatizador'],
  'Mecánico': ['auto', 'carro', 'motor', 'freno', 'mecanico', 'mecánico', 'taller', 'aceite', 'suspension', 'bateria', 'llanta', 'ruido'],
  'Viandas y Pensiones': ['comida', 'vianda', 'pension', 'pensión', 'almuerzo', 'cena', 'comedor', 'plato', 'menú', 'menu', 'viandas', 'casera', 'sopa', 'segundo', 'pensionado'],
  'Cerrajero': ['llave', 'cerradura', 'chapa', 'candado', 'puerta', 'cerrajero', 'abrir', 'perdi', 'traba', 'seguridad', 'copia'],
  'Carpintero': ['madera', 'mueble', 'silla', 'mesa', 'carpintero', 'puerta', 'cajon', 'estante', 'ropero', 'tablon', 'lijado', 'barniz'],
  'Técnico de laptop-celulares': ['pantalla', 'bateria', 'celular', 'laptop', 'computadora', 'cargador', 'teclado', 'no prende', 'tecnico', 'técnico', 'pantalla rota', 'iphone', 'android'],
  'Sastrería': ['ropa', 'sastre', 'sastrería', 'costura', 'pantalon', 'camisa', 'entallar', 'cierre', 'vestido', 'tela', 'doblez', 'aguja', 'botón'],
  'Papelería & Oficina': ['papel', 'resma', 'oficina', 'boligrafo', 'carpeta', 'escritorio', 'impresion', 'impresora', 'tinta', 'toner', 'lapiz', 'cuaderno', 'archivo', 'fotocopia'],
  'Branding & Lettering': ['letrero', 'banner', 'diseño', 'logo', 'vinilo', 'grafica', 'corporeo', 'rotulado', 'marca', 'identidad', 'letras', 'iluminado', 'fachada', 'vidriera'],
  'Decoración & Eventos': ['decoracion', 'evento', 'globo', 'fiesta', 'aniversario', 'cumpleaños', 'arreglo', 'flores', 'ambientacion', 'salon', 'sillas', 'mesas', 'catering'],
  'Servicios B2B': ['limpieza', 'mantenimiento', 'empresa', 'corporativo', 'guardia', 'seguridad', 'consultoria', 'asesoria', 'contable', 'fiscal', 'legal']
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { descripcion, latCliente = -17.784, lngCliente = -17.784 } = body;

    if (!descripcion || descripcion.trim() === '') {
      return Response.json({ error: 'La descripción del servicio es requerida' }, { status: 400 });
    }

    console.log(`[Matching API] Iniciando análisis para: "${descripcion}"`);

    let categoria = 'Plomería'; // Default fallback
    let urgencia: 'Normal' | 'Alta' = 'Normal';
    let descripcionCorregida = descripcion;

    // =========================================================================
    // 🧠 INTEGRACIÓN CON GOOGLE GEMINI API (CON CORRECCIÓN GRAMATICAL)
    // =========================================================================
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    let categoriaDetectadaPorIA: string | null = null;
    let urgenciaDetectadaPorIA: 'Normal' | 'Alta' | null = null;
    let descripcionCorregidaPorIA: string | null = null;

    if (GEMINI_API_KEY) {
      try {
        const prompt = `Analiza la siguiente descripción de un servicio solicitado por un cliente o empresa.
Corrige cualquier error gramatical, ortográfico o de tipeo en la descripción (por ejemplo, si dice "tengo un fga de gua" corrígelo a "Tengo una fuga de agua").
Clasifica el servicio en una de las siguientes categorías válidas EXACTAS:
${Object.keys(CATEGORIAS_BASE).map(c => `- "${c}"`).join('\n')}

Determina la urgencia del servicio como "Normal" o "Alta" según la gravedad o palabras clave de urgencia descritas.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (no envíes Markdown block, solo el objeto JSON como texto plano):
{
  "categoria": "Nombre de la categoría clasificada",
  "urgencia": "Normal" o "Alta",
  "descripcionCorregida": "La descripción corregida y con buena ortografía"
}

Descripción del servicio: "${descripcion}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          textoRespuesta = textoRespuesta.trim();
          
          if (textoRespuesta.startsWith('```')) {
            textoRespuesta = textoRespuesta.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          }

          const parsed = JSON.parse(textoRespuesta);
          if (parsed && typeof parsed === 'object') {
            categoriaDetectadaPorIA = parsed.categoria;
            urgenciaDetectadaPorIA = (parsed.urgencia === 'Alta' || parsed.urgencia === 'Normal') ? parsed.urgencia : 'Normal';
            descripcionCorregidaPorIA = parsed.descripcionCorregida;
          }
        } else {
          console.warn(`[Matching API] Gemini API retornó código de estado: ${response.status}`);
        }
      } catch (err) {
        console.error('[Matching API] Error llamando a Gemini API:', err);
      }
    }

    // Normalización de la categoría recomendada por IA
    let iaMatchSuccessful = false;
    if (categoriaDetectadaPorIA) {
      const exactCategory = Object.keys(CATEGORIAS_BASE).find(
        c => c.toLowerCase() === categoriaDetectadaPorIA?.toLowerCase() ||
             c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === 
             categoriaDetectadaPorIA?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      );
      if (exactCategory) {
        categoria = exactCategory;
        urgencia = urgenciaDetectadaPorIA || 'Normal';
        descripcionCorregida = descripcionCorregidaPorIA || descripcion;
        iaMatchSuccessful = true;
        console.log(`[Matching API] Gemini detectó exitosamente: Categoría: "${categoria}", Urgencia: "${urgencia}", Descripción corregida: "${descripcionCorregida}"`);
      } else {
        console.warn(`[Matching API] Gemini recomendó una categoría no válida: "${categoriaDetectadaPorIA}". Usando fallback.`);
      }
    }

    // =========================================================================
    // ⚙️ ALGORITMO DE MATCHING SIMULADO / FALLBACK (PROCESAMIENTO NLP BÁSICO)
    // =========================================================================
    if (!iaMatchSuccessful) {
      const textLower = descripcion.toLowerCase();
      let maxPuntaje = 0;
      
      for (const [catName, palabras] of Object.entries(CATEGORIAS_BASE)) {
        let puntaje = 0;
        for (const palabra of palabras) {
          if (textLower.includes(palabra)) {
            let matches = textLower.split(palabra).length - 1;
            puntaje += matches;
          }
        }
        if (puntaje > maxPuntaje) {
          maxPuntaje = puntaje;
          categoria = catName;
        }
      }

      if (textLower.match(/(urgente|rapido|rápido|inmediat|ya|emergencia|peligro|humo|fuego|inundacion|revent|auxilio|urgencia)/)) {
        urgencia = 'Alta';
      }
      console.log(`[Matching API] Fallback NLP resolvió: Categoría: "${categoria}", Urgencia: "${urgencia}"`);
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
    
    // Extraer proveedores desde la Base de Datos Real de Neon.db (o fallback al Mock si está desconectado)
    let proveedoresFuente = PROVEEDORES_MOCK;
    if (isDbConnected() && db) {
      try {
        const bdProviders = await db.select().from(users).where(eq(users.rol, 'provider'));
        const mappedProviders = bdProviders.map(p => {
          let especialidad = 'Plomería'; // default genérico
          if (p.serviciosOfrecidos && Array.isArray(p.serviciosOfrecidos) && p.serviciosOfrecidos.length > 0) {
            especialidad = p.serviciosOfrecidos[0];
          } else if (p.ofreceB2B && p.rubro) {
            especialidad = p.rubro;
          }

          // Convertir años de experiencia a número para la formula
          let expAnos = 3; 
          if (p.anosExperiencia === '1 a 3 años') expAnos = 2;
          else if (p.anosExperiencia === 'Más de 3 años') expAnos = 5;

          return {
            id: String(p.id),
            nombre: p.nombre,
            especialidad: especialidad,
            rating: 4.8, // En una versión futura se sacaría del promedio de calificacionEstrellas
            experiencia: expAnos,
            lat: -17.780 + (Math.random() * 0.02 - 0.01), // Coordenada simulada en radio de SCZ
            lng: -63.180 + (Math.random() * 0.02 - 0.01),
            descripcion: p.descripcionProveedor || 'Proveedor de servicios verificado'
          };
        });

        if (mappedProviders.length > 0) {
          proveedoresFuente = mappedProviders;
        }
      } catch(e) {
        console.error('Error al obtener proveedores de BD, usando Mock', e);
      }
    }

    const proveedoresFiltrados = proveedoresFuente.filter(p => p.especialidad === categoria);
    
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
    if (categoria === 'Mecánico') precioSugerido = '150 Bs. - 400 Bs. (según diagnóstico)';
    if (categoria === 'Cerrajero') precioSugerido = urgencia === 'Alta' ? '120 Bs. - 200 Bs.' : '70 Bs. - 120 Bs.';
    if (categoria === 'Carpintero') precioSugerido = '100 Bs. - 300 Bs. (según trabajo)';
    if (categoria === 'Técnico de laptop-celulares') precioSugerido = '80 Bs. - 250 Bs. (más repuestos)';
    if (categoria === 'Sastrería') precioSugerido = '40 Bs. - 100 Bs. (según prenda)';
    if (categoria === 'Viandas y Pensiones') precioSugerido = '20 Bs. - 35 Bs. (por vianda/plato)';

    return Response.json({
      success: true,
      nlpAnalysis: {
        categoriaDetectada: categoria,
        urgenciaDetectada: urgencia,
        correctedDescription: descripcionCorregida,
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

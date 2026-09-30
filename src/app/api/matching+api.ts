import { db, isDbConnected } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getClientIp, isRateLimited, isPayloadTooLarge } from '../../utils/rate-limiter';
import { sanitizePromptInput } from '../../utils/security';
import { puntosAEstrellas, puedeAccederTarifaAlta } from '../../services/scoring';

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
  { id: 'p13', nombre: 'José Mamani', especialidad: 'Albañilería & Construcción', rating: 4.9, experiencia: 15, lat: -17.785, lng: -63.180, descripcion: 'Colocación de cerámica, revoques, construcción y refacciones en general.' },
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
  'Branding & Lettering': ['letrero', 'banner', 'diseño', 'logo', 'vinilo', 'grafica', 'corporeo', 'rotulado', 'marca', 'identidad', 'letras', 'iluminado', 'fachada', 'vidriera', 'vidriero', 'vidrio', 'vidrios', 'blindex'],
  'Decoración & Eventos': ['decoracion', 'evento', 'globo', 'fiesta', 'aniversario', 'cumpleaños', 'arreglo', 'flores', 'ambientacion', 'salon', 'sillas', 'mesas', 'catering'],
  'Servicios B2B': ['limpieza', 'mantenimiento', 'empresa', 'corporativo', 'guardia', 'seguridad', 'consultoria', 'asesoria', 'contable', 'fiscal', 'legal'],
  'Albañilería & Construcción': ['albañil', 'albañileria', 'albañilería', 'cemento', 'ladrillo', 'ceramica', 'cerámica', 'piso', 'pared', 'columna', 'revoque', 'construccion', 'construcción', 'obra', 'losa', 'mezcla', 'azulejo', 'baldosa', 'contrapiso']
};

function calcularCoincidenciaSemanticaIA(solicitudCliente: string, descripcionProveedor: string, serviciosOfrecidos: string[] = []): { score: number; motivo: string; porcentajeText: string } {
  const reqLower = solicitudCliente.toLowerCase().trim();
  const descLower = (descripcionProveedor + " " + serviciosOfrecidos.join(" ")).toLowerCase().trim();

  if (!descLower) {
    return { score: 0.3, motivo: 'Proveedor verificado', porcentajeText: '70%' };
  }

  const stopWords = new Set(['necesito', 'busco', 'quiero', 'un', 'una', 'el', 'la', 'los', 'las', 'de', 'del', 'en', 'para', 'con', 'por', 'que', 'se', 'mi', 'mis', 'favor', 'ayuda', 'urgente', 'especializado', 'especialista']);
  const tokensCliente = reqLower
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  if (tokensCliente.length === 0) {
    return { score: 0.5, motivo: 'Afinidad de categoría general', porcentajeText: '75%' };
  }

  let maxFraseScore = 0;
  let motivoEncontrado = '';

  for (let len = Math.min(tokensCliente.length, 4); len >= 2; len--) {
    for (let i = 0; i <= tokensCliente.length - len; i++) {
      const subFrase = tokensCliente.slice(i, i + len).join(' ');
      if (descLower.includes(subFrase)) {
        maxFraseScore = 0.98;
        motivoEncontrado = ` Coincidencia exacta: "${subFrase}"`;
        break;
      }
    }
    if (maxFraseScore > 0) break;
  }

  let tokenMatches = 0;
  const palabrasCoincidentes: string[] = [];
  for (const token of tokensCliente) {
    if (descLower.includes(token)) {
      tokenMatches++;
      palabrasCoincidentes.push(token);
    }
  }

  const tokenRatio = tokenMatches / tokensCliente.length;
  let scoreSemantico = Math.max(maxFraseScore, tokenRatio * 0.9);

  if (!motivoEncontrado) {
    if (palabrasCoincidentes.length > 0) {
      motivoEncontrado = ` Especializado en: "${palabrasCoincidentes.join(', ')}"`;
    } else {
      motivoEncontrado = 'Especialista en la categoría';
      scoreSemantico = 0.35;
    }
  }

  const pct = Math.round(scoreSemantico * 100);
  return {
    score: scoreSemantico,
    motivo: motivoEncontrado,
    porcentajeText: `${pct}%`
  };
}

export async function POST(request: Request) {
  try {
    // 1. Verificar DDoS / Tamaño del Payload (Límite 1MB)
    if (isPayloadTooLarge(request)) {
      return Response.json({ error: 'Payload excesivo. Petición rechazada por seguridad.' }, { status: 413 });
    }

    // 2. Verificar DDoS / Límite de tasa (Máximo 15 peticiones de matching por minuto por IP)
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 15, 60000)) {
      return Response.json({ error: 'Límite de peticiones excedido (Anti-DDoS). Por favor espera un minuto.' }, { status: 429 });
    }

    const body = await request.json();
    const { descripcion: rawDescripcion, latCliente = -17.784, lngCliente = -17.784 } = body;

    if (!rawDescripcion || String(rawDescripcion).trim() === '') {
      return Response.json({ error: 'La descripción del servicio es requerida' }, { status: 400 });
    }

    const descripcion = sanitizePromptInput(rawDescripcion);

    console.log(`[Matching API] Iniciando análisis para: "${descripcion}"`);

    let categoria = 'Plomería'; // Default fallback
    let subservicio = 'Servicio general';
    let prediagnostico = 'Requiere inspección física';
    let urgencia: 'Normal' | 'Alta' = 'Normal';
    let descripcionCorregida = descripcion;

    // =========================================================================
    //  INTEGRACIÓN CON GOOGLE GEMINI API (CON CORRECCIÓN GRAMATICAL)
    // =========================================================================
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    let tieneSentidoDetectadoPorIA = true;
    let categoriaDetectadaPorIA: string | null = null;
    let subservicioDetectadoPorIA: string | null = null;
    let prediagnosticoDetectadoPorIA: string | null = null;
    let urgenciaDetectadaPorIA: 'Normal' | 'Alta' | null = null;
    let descripcionCorregidaPorIA: string | null = null;

    // Validación de sentido básica local (para fallback rápido o falta de API Key)
    const textTrimmed = descripcion.trim();
    const wordsList = textTrimmed.split(/\s+/).filter(Boolean);
    const containsGenericRequest = textTrimmed.toLowerCase().match(/(necesito|busco|quiero|repar|instal|compra|arregl|urgente|servici|ayuda|resma|papel|aire|tengo|dañado|roto|averia|problema)/);
    
    let totalKeywordsCount = 0;
    for (const palabras of Object.values(CATEGORIAS_BASE)) {
      for (const palabra of palabras) {
        if (textTrimmed.toLowerCase().includes(palabra)) {
          totalKeywordsCount++;
        }
      }
    }
    const tieneSentidoLocal = textTrimmed.length >= 8 && wordsList.length >= 2 && (totalKeywordsCount > 0 || containsGenericRequest);

    // El filtro local se ejecutará si la llamada a Gemini falla o si no hay API Key disponible.

    if (GEMINI_API_KEY) {
      try {
        const prompt = `Analiza la siguiente descripción de un servicio solicitado por un cliente o empresa.
Determina si la descripción tiene sentido y es una solicitud real de servicio, insumo o trabajo técnico (por ejemplo, "tengo un fga de gua" o "necesito 20 resmas de papel" o "limpieza de mi oficina" sí tienen sentido; mientras que "asdfasdf", "12345", "hola" o palabras sueltas sin petición de servicio NO tienen sentido).

Si la descripción tiene sentido:
- Establece "tieneSentido" como true.
- Corrige cualquier error gramatical, ortográfico o de tipeo en la descripción (por ejemplo, si dice "tengo un fga de gua" corrígelo a "Tengo una fuga de agua").
- Clasifica el servicio en una de las siguientes categorías válidas EXACTAS:
${Object.keys(CATEGORIAS_BASE).map(c => `- "${c}"`).join('\n')}

Nota de clasificación especial y guías por categoría:
- "Plomería": Fugas de agua, goteras, tuberías, cañerías, grifos, inodoros, lavaplatos, desatoro de drenajes, bombas de agua, filtraciones, sanitarios.
- "Electricidad": Cortocircuitos, enchufes, interruptores, cableado, térmicas, tableros eléctricos, apagones, bombillas/focos, chispas, instalaciones eléctricas.
- "Pintura": Pintado de interiores/exteriores, paredes, techos, fachadas, rodillos, brochas, humedad en paredes, empapelado, látex, barniz.
- "Climatización": Aire acondicionado, calefacción, ventilación, mantenimiento de splits, recarga de gas, limpieza de filtros.
- "Mecánico": Reparación de automóviles/motos, motores, frenos, cambio de aceite, llantas, batería de vehículo, remolques.
- "Viandas y Pensiones": Comida a domicilio, viandas diarias, almuerzos, cenas, cáterin corporativo, platos preparados, pensionados.
- "Cerrajero": Apertura de puertas, duplicados de llaves, cambio de cerraduras, chapas trabadas, cerrajería de emergencia.
- "Carpintero": Muebles de madera, sillas, mesas, puertas de madera, estantes, cajones, lijado, barnizado, restauración de madera.
- "Técnico de laptop-celulares": Reparación de computadoras, laptops, celulares, tablets, pantallas rotas, cambio de batería, formateo de software.
- "Sastrería": Arreglos de ropa, bastas, entallados, cierres, botones, confección a medida de prendas.
- "Papelería & Oficina": Suministros de oficina, papel resma, carpetas, tóners/tintas de impresora, fotocopias, impresiones.
- "Branding & Lettering": Letreros luminosos, banners, diseño gráfico, logos, vinilos, rotulación, fachada comercial, vidriería, vidriero, vidrios comerciales, blindex.
- "Decoración & Eventos": Decoración de eventos, globos, flores, arreglos para fiestas/aniversarios/cumpleaños, ambientación de salas.
- "Servicios B2B": Limpieza corporativa de oficinas, consultoría empresarial, contabilidad, seguridad física, mantenimiento general de instalaciones comerciales.
- "Albañilería & Construcción": Trabajos de albañilería/albañil, colocación de cerámica, baldosas o azulejos, mezcla de cemento, reparación de pisos/contrapisos, revoque de paredes, levantar muros de ladrillo, columnas, losas y obras de construcción en general.

- Determina la urgencia del servicio como "Normal" o "Alta" según la gravedad o palabras clave de urgencia descritas.
- Detecta con granularidad el subservicio exacto requerido (por ejemplo: "Instalación de grifo", "Reparación de cortocircuito", "Mantenimiento preventivo de aire split", "Reparación de pantalla iPhone", etc.).
- Elabora un pre-diagnóstico técnico preliminar y automatizado muy corto sobre la causa probable o solución recomendada en base a la descripción provista (por ejemplo: "Posible desgaste del empaque o daño en la rosca", "Sobrecarga del interruptor termomagnético secundario", "Filtros obstruidos por polvo o falta de gas refrigerante", "Fisura en panel LCD táctil externo", etc.).

Si la descripción NO tiene sentido, es incoherente o spam:
- Establece "tieneSentido" como false.
- Los campos "categoria", "subservicio", "prediagnostico", "urgencia" y "descripcionCorregida" deben ser null.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (no envíes Markdown block, solo el objeto JSON como texto plano):
{
  "tieneSentido": true o false,
  "categoria": "Nombre de la categoría clasificada o null",
  "urgencia": "Normal" o "Alta" o null,
  "descripcionCorregida": "La descripción corregida o null"
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
            tieneSentidoDetectadoPorIA = parsed.tieneSentido !== false;
            categoriaDetectadaPorIA = parsed.categoria;
            subservicioDetectadoPorIA = parsed.subservicio;
            prediagnosticoDetectadoPorIA = parsed.prediagnostico;
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

    if (tieneSentidoDetectadoPorIA === false) {
      console.warn(`[Matching API] Gemini determinó que la descripción no tiene sentido: "${descripcion}"`);
      return Response.json({
        success: false,
        noSense: true,
        message: 'La descripción del servicio no tiene sentido. Vuelve a escribirlo.'
      });
    }

    // Normalización de la categoría recomendada por IA
    let iaMatchSuccessful = false;
    if (tieneSentidoDetectadoPorIA && categoriaDetectadaPorIA) {
      const exactCategory = Object.keys(CATEGORIAS_BASE).find(
        c => c.toLowerCase() === categoriaDetectadaPorIA?.toLowerCase() ||
             c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === 
             categoriaDetectadaPorIA?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      );
      if (exactCategory) {
        categoria = exactCategory;
        subservicio = subservicioDetectadoPorIA || 'Servicio general';
        prediagnostico = prediagnosticoDetectadoPorIA || 'Requiere inspección física';
        urgencia = urgenciaDetectadaPorIA || 'Normal';
        descripcionCorregida = descripcionCorregidaPorIA || descripcion;
        iaMatchSuccessful = true;
        console.log(`[Matching API] Gemini detectó exitosamente: Categoría: "${categoria}", Urgencia: "${urgencia}", Descripción corregida: "${descripcionCorregida}"`);
      } else {
        console.warn(`[Matching API] Gemini recomendó una categoría no válida: "${categoriaDetectadaPorIA}". Usando fallback.`);
      }
    }

    // =========================================================================
    //  ALGORITMO DE MATCHING SIMULADO / FALLBACK (PROCESAMIENTO NLP BÁSICO)
    // =========================================================================
    if (!iaMatchSuccessful) {
      if (!tieneSentidoLocal) {
        console.warn(`[Matching API] Fallback local determinó que la descripción no tiene sentido: "${descripcion}"`);
        return Response.json({
          success: false,
          noSense: true,
          message: 'Vuelve a escribirlo'
        });
      }
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
    let proveedoresFuente: any[] = PROVEEDORES_MOCK;
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
            serviciosOfrecidos: p.serviciosOfrecidos,
            ofreceB2B: p.ofreceB2B,
            rubro: p.rubro,
            // Sistema de Scoring (Tarea 3.3): la calificación visible se deriva
            // del puntaje del proveedor (100 pts = 5.0★, cada cancelación injustificada -10 pts).
            rating: puntosAEstrellas(p.puntaje ?? 100),
            puntajeScoring: p.puntaje ?? 100,
            cancelacionesInjustificadas: p.cancelacionesInjustificadas ?? 0,
            puedeAccederTarifaAlta: puedeAccederTarifaAlta(p.puntaje ?? 100),
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

    const proveedoresFiltrados = proveedoresFuente.filter(p => {
      // 1. Si el proveedor tiene serviciosOfrecidos como un array con elementos, verificar si contiene la categoría solicitada
      if (p.serviciosOfrecidos && Array.isArray(p.serviciosOfrecidos) && p.serviciosOfrecidos.length > 0) {
        return p.serviciosOfrecidos.includes(categoria);
      }
      // 2. Si no, verificar si su especialidad o rubro coincide con la categoría
      return p.especialidad === categoria || (p.ofreceB2B && p.rubro === categoria);
    });
    
    const proveedoresConScore = proveedoresFiltrados.map(p => {
      const distancia = calcularDistancia(latCliente, lngCliente, p.lat, p.lng);
      const coincidenciaSemantica = calcularCoincidenciaSemanticaIA(descripcion, p.descripcion, p.serviciosOfrecidos || []);
      
      // Factores normalizados de 0 a 1
      const factorCoincidenciaIA = coincidenciaSemantica.score;
      const factorRating = p.rating / 5.0;
      const factorDistancia = Math.max(0, 1 - (distancia / 10)); // Más cerca es mejor (max 10km)
      const factorExperiencia = Math.min(1, p.experiencia / 10);
      
      // Fórmula Ponderada con Prioridad a la Coincidencia en Descripción (45%)
      const score = (factorCoincidenciaIA * 0.45) + (factorDistancia * 0.30) + (factorRating * 0.15) + (factorExperiencia * 0.10);

      return {
        ...p,
        distanciaKm: parseFloat(distancia.toFixed(2)),
        coincidenciaPorcentaje: coincidenciaSemantica.porcentajeText,
        motivoCoincidenciaIA: coincidenciaSemantica.motivo,
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
    if (categoria === 'Albañilería & Construcción') precioSugerido = '150 Bs. - 500 Bs. (según trabajo/m²)';

    return Response.json({
      success: true,
      nlpAnalysis: {
        categoriaDetectada: categoria,
        subservicioDetectado: subservicio,
        prediagnosticoDetectado: prediagnostico,
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

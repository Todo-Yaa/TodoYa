// Datos de prueba locales (los mismos de la API para mantener consistencia y soporte offline)
export const PROVEEDORES_MOCK = [
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
  { id: 'p13', nombre: 'José Mamani', especialidad: 'Albañilería & Construcción', rating: 4.9, experiencia: 15, lat: -17.785, lng: -63.180, descripcion: 'Colocación de cerámica, revoques, construcción y refacciones en general.' }
];

/**
 * Calcula la distancia de Haversine entre dos puntos geográficos (en kilómetros).
 */
export const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

/**
 * Algoritmo de Procesamiento del Lenguaje Natural (NLP) simplificado.
 * Deduce la categoría y urgencia basándose en palabras clave.
 */
export const analizarTextoNLP = (descripcion: string) => {
  let categoria = 'Plomería'; // Default
  let urgencia: 'Normal' | 'Alta' = 'Normal';
  const textLower = descripcion.toLowerCase();

  // Diccionarios de palabras clave para "Todas las Probabilidades" (Sistema de Puntaje)
  const categoriasBase = {
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

  let maxPuntaje = 0;
  
  for (const [catName, palabras] of Object.entries(categoriasBase)) {
    let puntaje = 0;
    for (const palabra of palabras) {
      if (textLower.includes(palabra)) {
        puntaje++;
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

  return { categoria, urgencia };
};

/**
 * Algoritmo de Emparejamiento Offline (Matching Engine Local)
 * Asigna una puntuación (score) a cada proveedor basado en:
 * score = (rating * 0.4) + (distanciaFactor * 0.4) + (experienciaFactor * 0.2)
 */
export const matchProvidersOffline = async (descripcion: string, latCliente: number, lngCliente: number) => {
  // Validación de sentido básica local
  const textTrimmed = descripcion.trim();
  const wordsList = textTrimmed.split(/\s+/).filter(Boolean);
  const containsGenericRequest = textTrimmed.toLowerCase().match(/(necesito|busco|quiero|repar|instal|compra|arregl|urgente|servici|ayuda|resma|papel|aire|tengo|dañado|roto|averia|problema|fuga|gotera|corto|pintar|limpieza|sastre|vianda|comida|llave|chapa|cerradura)/);

  const tieneSentidoLocal = textTrimmed.length >= 8 && wordsList.length >= 2 && containsGenericRequest;

  if (!tieneSentidoLocal) {
    return {
      success: false,
      noSense: true,
      nlpAnalysis: {
        categoriaDetectada: 'Ninguna',
        urgenciaDetectada: 'Normal',
        correctedDescription: descripcion,
        confianza: 0.0
      },
      precioSugerido: '',
      proveedoresEmparejados: [],
      totalEncontrados: 0,
      modo: 'offline'
    };
  }

  const { categoria, urgencia } = analizarTextoNLP(descripcion);

  const proveedoresFiltrados = PROVEEDORES_MOCK.filter(p => p.especialidad === categoria);
  
  const proveedoresConScore = proveedoresFiltrados.map(p => {
    const distancia = calcularDistancia(latCliente, lngCliente, p.lat, p.lng);
    
    // Factores normalizados (0 a 1)
    const factorRating = p.rating / 5.0;
    const factorDistancia = Math.max(0, 1 - (distancia / 10)); // Más cerca es mejor (max 10km)
    const factorExperiencia = Math.min(1, p.experiencia / 10); // 10 o más años es el tope (1)
    
    const score = (factorRating * 0.4) + (factorDistancia * 0.4) + (factorExperiencia * 0.2);

    return {
      id: p.id,
      nombre: p.nombre,
      especialidad: p.especialidad,
      rating: p.rating,
      experiencia: p.experiencia,
      lat: p.lat,
      lng: p.lng,
      descripcion: p.descripcion,
      distanciaKm: parseFloat(distancia.toFixed(2)),
      score: parseFloat(score.toFixed(2))
    };
  });

  // Ordenar de mayor a menor score
  const ordenados = proveedoresConScore.sort((a, b) => b.score - a.score);

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

  return {
    success: true,
    nlpAnalysis: {
      categoriaDetectada: categoria,
      subservicioDetectado: 'Servicio general de ' + categoria,
      prediagnosticoDetectado: 'Requiere revisión física para pre-diagnóstico',
      urgenciaDetectada: urgencia,
      correctedDescription: descripcion,
      confianza: 0.95,
    },
    precioSugerido,
    proveedoresEmparejados: ordenados,
    totalEncontrados: ordenados.length,
    modo: 'offline'
  };
};

/**
 * Realiza la petición al backend de Expo API Routes para obtener la coincidencia.
 */
export const matchProvidersOnline = async (descripcion: string, latCliente: number, lngCliente: number) => {
  try {
    const response = await fetch('/api/matching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        descripcion,
        latCliente,
        lngCliente
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, modo: 'online' };
  } catch (error: any) {
    console.warn('[Matching Service] Falló la conexión online, usando motor offline:', error.message);
    throw error;
  }
};

/**
 * Servicio de Emparejamiento Inteligente (Intelligent Matching Engine)
 * Intenta la llamada online (API Route) primero, y si falla (por estar sin conexión, 
 * o ejecutándose en un emulador nativo sin backend local configurado), hace fallback offline.
 */
export const matchProviders = async (descripcion: string, latCliente: number, lngCliente: number) => {
  try {
    return await matchProvidersOnline(descripcion, latCliente, lngCliente);
  } catch (err) {
    return await matchProvidersOffline(descripcion, latCliente, lngCliente);
  }
};

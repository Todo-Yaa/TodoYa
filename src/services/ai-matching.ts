// Datos de prueba locales (los mismos de la API para mantener consistencia y soporte offline)
export const PROVEEDORES_MOCK = [
  { id: 'p1', nombre: 'Juan Pérez', especialidad: 'Plomería', rating: 4.8, experiencia: 5, lat: -17.783, lng: -63.182, descripcion: 'Especialista en fugas de agua, grifos y cañerías.' },
  { id: 'p2', nombre: 'Carlos Gómez', especialidad: 'Electricidad', rating: 4.9, experiencia: 8, lat: -17.781, lng: -63.178, descripcion: 'Instalaciones eléctricas, cortocircuitos y cableado trifásico.' },
  { id: 'p3', nombre: 'Ana Mendoza', especialidad: 'Plomería', rating: 4.9, experiencia: 7, lat: -17.786, lng: -63.185, descripcion: 'Especialista certificado en cambio de tuberías de gas, calefones y bombas de agua.' },
  { id: 'p4', nombre: 'Luis Choque', especialidad: 'Pintura', rating: 4.7, experiencia: 10, lat: -17.788, lng: -63.175, descripcion: 'Pintura de interiores y exteriores, empapelado y impermeabilización.' },
  { id: 'p5', nombre: 'María Rodríguez', especialidad: 'Climatización', rating: 4.9, experiencia: 6, lat: -17.779, lng: -63.188, descripcion: 'Reparación, recarga de gas y mantenimiento de aire acondicionado split.' },
  { id: 'p6', nombre: 'Luis Gómez', especialidad: 'Mecánico', rating: 4.8, experiencia: 5, lat: -17.785, lng: -63.185, descripcion: 'Mecánico automotriz a domicilio. Diagnóstico de motor y frenos.' },
  { id: 'p7', nombre: 'Mario Roca', especialidad: 'Cerrajero', rating: 4.9, experiencia: 7, lat: -17.782, lng: -63.179, descripcion: 'Apertura de chapas de alta seguridad, candados y duplicado de llaves.' },
  { id: 'p8', nombre: 'Pedro Silva', especialidad: 'Carpintero', rating: 4.7, experiencia: 6, lat: -17.788, lng: -63.181, descripcion: 'Carpintería en general, restauración de muebles y puertas de madera.' },
  { id: 'p9', nombre: 'Julio Vera', especialidad: 'Técnico de laptop-celulares', rating: 4.9, experiencia: 8, lat: -17.778, lng: -63.186, descripcion: 'Reparación de celulares y laptops. Cambio de pantalla táctil y batería.' },
  { id: 'p10', nombre: 'Elena Paz', especialidad: 'Sastrería', rating: 4.8, experiencia: 12, lat: -17.781, lng: -63.189, descripcion: 'Arreglos de costura, entalles, cambio de cierres y prendas a medida.' },
  { id: 'p11', nombre: 'Pensionado Doña Flor', especialidad: 'Viandas y Pensiones', rating: 4.9, experiencia: 5, lat: -17.781, lng: -63.189, descripcion: 'Almuerzos completos, catering corporativo y viandas semanales.' },
  { id: 'p12', nombre: 'Pensionado El Buen Sabor', especialidad: 'Viandas y Pensiones', rating: 4.8, experiencia: 3, lat: -17.785, lng: -63.169, descripcion: 'Comida criolla y pensiones ejecutivas para oficinas.' },
  { id: 'p13', nombre: 'José Mamani', especialidad: 'Albañilería & Construcción', rating: 4.9, experiencia: 15, lat: -17.785, lng: -63.180, descripcion: 'Colocación de cerámica, azulejos, revoques, pisos y refacciones generales.' }
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
 * Motor de Coincidencia Semántica IA entre la solicitud del cliente y la descripción del proveedor.
 */
export const calcularCoincidenciaSemanticaIA = (solicitudCliente: string, descripcionProveedor: string, serviciosOfrecidos: string[] = []): { score: number; motivo: string; porcentajeText: string } => {
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

  // 1. Búsqueda de Frases Exactas (N-Gramos)
  let maxFraseScore = 0;
  let motivoEncontrado = '';

  for (let len = Math.min(tokensCliente.length, 4); len >= 2; len--) {
    for (let i = 0; i <= tokensCliente.length - len; i++) {
      const subFrase = tokensCliente.slice(i, i + len).join(' ');
      if (descLower.includes(subFrase)) {
        maxFraseScore = 0.98;
        motivoEncontrado = `🎯 Coincidencia exacta: "${subFrase}"`;
        break;
      }
    }
    if (maxFraseScore > 0) break;
  }

  // 2. Coincidencia por Palabras Clave Especializadas
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
      motivoEncontrado = `⚡ Especializado en: "${palabrasCoincidentes.join(', ')}"`;
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
};

/**
 * Algoritmo de Procesamiento del Lenguaje Natural (NLP) simplificado.
 */
export const analizarTextoNLP = (descripcion: string) => {
  let categoria = 'Plomería'; // Default
  let urgencia: 'Normal' | 'Alta' = 'Normal';
  const textLower = descripcion.toLowerCase();

  // Diccionarios de palabras clave para "Todas las Probabilidades" (Sistema de Puntaje)
  const categoriasBase = {
    'Plomería': ['tubo', 'tuberia', 'tuberías', 'gas', 'agua', 'gotera', 'fuga', 'grifo', 'lavaplatos', 'inodoro', 'caño', 'inundacion', 'inundación', 'cañeria', 'desague', 'baño', 'bomba', 'pileta', 'filtracion', 'calefon', 'terma'],
    'Electricidad': ['luz', 'enchufe', 'corto', 'cable', 'cortocircuito', 'corriente', 'toma', 'llave', 'termica', 'térmica', 'tablero', 'apagon', 'foco', 'iluminacion', 'lampara', 'chispa', 'electrocutado', 'trifasico', 'trifásico'],
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
 * Algoritmo de Emparejamiento Offline (2 Filtros: 1. Categoría Base, 2. Coincidencia Semántica IA en Descripción)
 * Fórmula:
 * score = (coincidenciaIA * 0.45) + (distanciaFactor * 0.30) + (ratingFactor * 0.15) + (experienciaFactor * 0.10)
 */
export const matchProvidersOffline = async (descripcion: string, latCliente: number, lngCliente: number) => {
  const textTrimmed = descripcion.trim();
  const wordsList = textTrimmed.split(/\s+/).filter(Boolean);
  const containsGenericRequest = textTrimmed.toLowerCase().match(/(necesito|busco|quiero|repar|instal|compra|arregl|urgente|servici|ayuda|resma|papel|aire|tengo|dañado|roto|averia|problema|fuga|gotera|corto|pintar|limpieza|sastre|vianda|comida|llave|chapa|cerradura|cambio|tuberia|gas)/);

  const tieneSentidoLocal = textTrimmed.length >= 6 && wordsList.length >= 2 && containsGenericRequest;

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

  // FILTRO 1: Filtramos primero por la Categoría requerida
  const proveedoresFiltrados = PROVEEDORES_MOCK.filter(p => p.especialidad === categoria);
  
  // FILTRO 2: Evaluación Semántica en la Descripción del Proveedor
  const proveedoresConScore = proveedoresFiltrados.map(p => {
    const distancia = calcularDistancia(latCliente, lngCliente, p.lat, p.lng);
    const coincidenciaSemantica = calcularCoincidenciaSemanticaIA(descripcion, p.descripcion);
    
    // Factores normalizados (0 a 1)
    const factorCoincidenciaIA = coincidenciaSemantica.score;
    const factorRating = p.rating / 5.0;
    const factorDistancia = Math.max(0, 1 - (distancia / 10)); // Más cerca es mejor
    const factorExperiencia = Math.min(1, p.experiencia / 10);
    
    // Fórmula Ponderada con Prioridad a la Coincidencia Exacta en la Descripción (45%)
    const score = (factorCoincidenciaIA * 0.45) + (factorDistancia * 0.30) + (factorRating * 0.15) + (factorExperiencia * 0.10);

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
      coincidenciaPorcentaje: coincidenciaSemantica.porcentajeText,
      motivoCoincidenciaIA: coincidenciaSemantica.motivo,
      score: parseFloat(score.toFixed(2))
    };
  });

  // Ordenar de mayor a menor score (Coincidencia exacta en descripción primero)
  const ordenados = proveedoresConScore.sort((a, b) => b.score - a.score);

  let precioSugerido = 'S/. 100 - S/. 150';
  if (categoria === 'Plomería') precioSugerido = urgencia === 'Alta' ? 'S/. 180 - S/. 250' : 'S/. 80 - S/. 130';
  if (categoria === 'Electricidad') precioSugerido = urgencia === 'Alta' ? 'S/. 200 - S/. 300' : 'S/. 100 - S/. 180';
  if (categoria === 'Pintura') precioSugerido = 'S/. 250 - S/. 450 (según m²)';
  if (categoria === 'Climatización') precioSugerido = 'S/. 150 - S/. 280';
  if (categoria === 'Mecánico') precioSugerido = 'S/. 150 - S/. 400 (según diagnóstico)';
  if (categoria === 'Cerrajero') precioSugerido = urgencia === 'Alta' ? 'S/. 120 - S/. 200' : 'S/. 70 - S/. 120';
  if (categoria === 'Carpintero') precioSugerido = 'S/. 100 - S/. 300 (según trabajo)';
  if (categoria === 'Técnico de laptop-celulares') precioSugerido = 'S/. 80 - S/. 250 (más repuestos)';
  if (categoria === 'Sastrería') precioSugerido = 'S/. 40 - S/. 100 (según prenda)';
  if (categoria === 'Viandas y Pensiones') precioSugerido = 'S/. 20 - S/. 35 (por vianda/plato)';
  if (categoria === 'Albañilería & Construcción') precioSugerido = 'S/. 150 - S/. 500 (según trabajo/m²)';

  return {
    success: true,
    nlpAnalysis: {
      categoriaDetectada: categoria,
      subservicioDetectado: 'Servicio especializado de ' + categoria,
      prediagnosticoDetectado: 'Requiere revisión técnica en ubicación',
      urgenciaDetectada: urgencia,
      correctedDescription: descripcion,
      confianza: 0.98,
    },
    precioSugerido,
    proveedoresEmparejados: ordenados,
    totalEncontrados: ordenados.length,
    modo: 'offline'
  };
};

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

export const matchProviders = async (descripcion: string, latCliente: number, lngCliente: number) => {
  try {
    return await matchProvidersOnline(descripcion, latCliente, lngCliente);
  } catch (err) {
    return await matchProvidersOffline(descripcion, latCliente, lngCliente);
  }
};

// Datos de prueba locales (los mismos de la API para mantener consistencia y soporte offline)
export const PROVEEDORES_MOCK = [
  { id: 'p1', nombre: 'Juan Pérez', especialidad: 'Plomería', rating: 4.8, experiencia: 5, lat: -17.783, lng: -63.182, descripcion: 'Especialista en fugas de agua, grifos y cañerías.' },
  { id: 'p2', nombre: 'Carlos Gómez', especialidad: 'Electricidad', rating: 4.9, experiencia: 8, lat: -17.781, lng: -63.178, descripcion: 'Instalaciones eléctricas, cortocircuitos y mantenimiento.' },
  { id: 'p3', nombre: 'Ana Mendoza', especialidad: 'Plomería', rating: 4.2, experiencia: 2, lat: -17.786, lng: -63.185, descripcion: 'Mantenimiento preventivo e instalación de sanitarios.' },
  { id: 'p4', nombre: 'Luis Choque', especialidad: 'Pintura', rating: 4.7, experiencia: 10, lat: -17.788, lng: -63.175, descripcion: 'Pintura de interiores y exteriores, texturados.' },
  { id: 'p5', nombre: 'María Rodríguez', especialidad: 'Climatización', rating: 4.9, experiencia: 6, lat: -17.779, lng: -63.188, descripcion: 'Reparación y mantenimiento de aire acondicionado.' },
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

  // Reglas léxicas para categorías
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

  return { categoria, urgencia };
};

/**
 * Algoritmo de Emparejamiento Offline (Matching Engine Local)
 * Asigna una puntuación (score) a cada proveedor basado en:
 * score = (rating * 0.4) + (distanciaFactor * 0.4) + (experienciaFactor * 0.2)
 */
export const matchProvidersOffline = async (descripcion: string, latCliente: number, lngCliente: number) => {
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

  return {
    success: true,
    nlpAnalysis: {
      categoriaDetectada: categoria,
      urgenciaDetectada: urgencia,
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

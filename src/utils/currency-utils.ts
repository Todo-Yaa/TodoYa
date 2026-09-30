/**
 * Utility for location-based currency detection and price formatting for TodoYa (Bolivia / Perú / Latam).
 */

export interface CurrencyConfig {
  country: string;
  symbol: string;
  code: string;
  name: string;
}

const PERU_CITIES = [
  'lima', 'arequipa', 'cusco', 'trujillo', 'chiclayo', 'piura', 'huancayo', 
  'tacna', 'callao', 'ica', 'cajamarca', 'puno', 'chimbote', 'maynas', 'iquitos'
];

const BOLIVIA_CITIES = [
  'santa cruz', 'la paz', 'cochabamba', 'el alto', 'sucre', 'tarija', 
  'oruro', 'potosi', 'potosí', 'trinidad', 'cobija', 'montero'
];

/**
 * Mapeo de precios base de Bolivia (BOB / Bs.) a precios atractivos y realistas en Perú (PEN / S/.).
 */
const BASE_PRICE_MAP_BOB_TO_PEN: Record<number, number> = {
  20: 12,
  22: 14,
  25: 15,
  60: 35,
  70: 40,
  80: 45,
  90: 50,
  100: 55,
  110: 60,
  120: 70,
  130: 75,
  140: 80,
  150: 85,
  160: 90,
  180: 100,
  200: 110,
  250: 140,
  300: 165,
  320: 175,
  350: 190,
  400: 220,
  450: 250,
  500: 275,
  850: 470,
  950: 520,
};

/**
 * Detecta la configuración de país y moneda basándose en la ciudad o indicio de ubicación.
 */
export function getCurrencyConfig(cityOrLocation?: string | null, countryHint?: string | null, phoneCode?: string | null): CurrencyConfig {
  const input = `${cityOrLocation || ''} ${countryHint || ''}`.toLowerCase();
  
  let isPeru = false;
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (timeZone.toLowerCase().includes('lima') || timeZone.toLowerCase().includes('peru')) {
        isPeru = true;
      }
    }
  } catch (e) {}

  // Verificación directa para Perú (Lima, Arequipa, zona horaria America/Lima, etc.)
  if (
    isPeru ||
    input.includes('peru') || 
    input.includes('perú') || 
    input.includes('lima') ||
    input.includes('arequipa') ||
    phoneCode === '51' || 
    PERU_CITIES.some(c => input.includes(c))
  ) {
    return {
      country: 'Peru',
      symbol: 'S/.',
      code: 'PEN',
      name: 'Soles'
    };
  }

  // Por defecto (Bolivia: Santa Cruz, La Paz, etc.)
  return {
    country: 'Bolivia',
    symbol: 'Bs.',
    code: 'BOB',
    name: 'Bolivianos'
  };
}

/**
 * Convierte un monto numérico en Bs. (BOB) a Soles (PEN).
 */
export function convertBobToPen(amountBob: number): number {
  if (BASE_PRICE_MAP_BOB_TO_PEN[amountBob]) {
    return BASE_PRICE_MAP_BOB_TO_PEN[amountBob];
  }
  // Fallback con factor aproximado ~0.55 redondeado a múltiplo de 5 (o entero si es menor a 15)
  const calculated = amountBob * 0.55;
  if (calculated < 15) {
    return Math.round(calculated);
  }
  return Math.round(calculated / 5) * 5;
}

/**
 * Convierte un monto numérico en Soles (PEN) a Bs. (BOB).
 */
export function convertPenToBob(amountPen: number): number {
  const calculated = amountPen * 1.82;
  return Math.round(calculated / 5) * 5;
}

/**
 * Formatea un monto base (asumido en Bs.) para la ubicación actual del usuario.
 */
export function formatPriceForLocation(baseAmountBob: number, cityOrLocation?: string | null, prefix: string = ''): string {
  const config = getCurrencyConfig(cityOrLocation);
  if (config.code === 'PEN') {
    const penAmount = convertBobToPen(baseAmountBob);
    return `${prefix}S/. ${penAmount}`;
  }
  return `${prefix}Bs. ${baseAmountBob}`;
}

/**
 * Adapta dinámicamente cualquier texto con precio (ej: "Desde Bs. 80" -> "Desde S/. 45")
 * según la ciudad/país detectado.
 */
export function adaptPriceText(text: string, cityOrLocation?: string | null): string {
  if (!text) return text;
  const config = getCurrencyConfig(cityOrLocation);

  if (config.code === 'PEN') {
    // Si la moneda es Perú, reemplaza referencias "Bs." / "BOB" / "bov" / "Bs" por "S/."
    return text.replace(/(?:Desde\s+)?(?:Bs\.|BOB|bov|Bs)\s*(\d+(?:\.\d+)?)/gi, (match, numStr) => {
      const isDesde = /desde/i.test(match);
      const num = parseFloat(numStr);
      const pen = convertBobToPen(num);
      return `${isDesde ? 'Desde ' : ''}S/. ${pen}`;
    });
  } else {
    // Si la moneda es Bolivia, reemplaza referencias "S/." por "Bs."
    return text.replace(/(?:Desde\s+)?(?:S\/\.)\s*(\d+(?:\.\d+)?)/gi, (match, numStr) => {
      const isDesde = /desde/i.test(match);
      const num = parseFloat(numStr);
      const bob = convertPenToBob(num);
      return `${isDesde ? 'Desde ' : ''}Bs. ${bob}`;
    });
  }
}

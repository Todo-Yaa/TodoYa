import {
  PUNTOS_SCORE_INICIAL,
  PENALIZACION_CANCELACION_INJUSTIFICADA,
  UMBRAL_PUNTOS_TARIFA_ALTA,
} from '../db/schema';

// ============================================================================
// SISTEMA DE SCORING DE PROVEEDORES (Tarea 3.3)
// ============================================================================
// Todo proveedor inicia con 100 puntos, equivalente visualmente a 5.0 estrellas.
// Cada cancelación injustificada resta 10 puntos, reduciendo la calificación
// visible y restringiendo el acceso a pedidos de tarifa alta (punkto < 80 = 4.0★).
// ============================================================================

export { PUNTOS_SCORE_INICIAL, PENALIZACION_CANCELACION_INJUSTIFICADA, UMBRAL_PUNTOS_TARIFA_ALTA };

// Umbral monetario (en la moneda regional del pedido) para considerarlo de tarifa alta
export const UMBRAL_TARIFA_ALTA_SOLES = 200;

export interface ProviderScore {
  puntaje: number;
  estrellas: number;
  cancelacionesInjustificadas: number;
  puedeAccederTarifaAlta: boolean;
}

/**
 * Convierte los puntos del proveedor a su calificación visible en estrellas (0–5).
 * 100 pts -> 5.0★ | 90 pts -> 4.5★ | 80 pts -> 4.0★ | 0 pts -> 0.0★
 */
export function puntosAEstrellas(puntaje: number): number {
  const pts = Math.max(0, Number(puntaje) || 0);
  return Math.round((pts / 20) * 10) / 10;
}

/**
 * Convierte una calificación en estrellas (0–5) a puntos (para compatibilidad).
 */
export function estrellasAPuntos(estrellas: number): number {
  const stars = Math.max(0, Math.min(5, Number(estrellas) || 0));
  return Math.round(stars * 20);
}

/**
 * Determina si el proveedor puede acceder a pedidos de tarifa alta.
 * Se exige un puntaje mínimo de 80 puntos (4.0 estrellas).
 */
export function puedeAccederTarifaAlta(puntaje: number): boolean {
  const pts = Number(puntaje);
  if (Number.isNaN(pts)) return false;
  return pts >= UMBRAL_PUNTOS_TARIFA_ALTA;
}

/**
 * Determina si un pedido se considera de "tarifa alta".
 * El precio viene como texto (ej: "S/. 150–400", "250 Bs.", "Presupuesto: 500 Bs.").
 * Se usa el valor máximo expresado para no sobre-restringir el acceso.
 */
export function esPedidoTarifaAlta(precio: unknown): boolean {
  const texto = String(precio ?? '');
  const numeros = texto.match(/\d+(?:[.,]\d+)?/g);
  if (!numeros || numeros.length === 0) return false;
  const maximo = Math.max(...numeros.map(n => parseFloat(n.replace(',', '.'))));
  return maximo >= UMBRAL_TARIFA_ALTA_SOLES;
}

/**
 * Calcula los puntos del proveedor tras una cancelación, aplicando la regla:
 * - Justificada: sin pérdida de puntos.
 * - Injustificada: -10 puntos (nunca por debajo de 0).
 */
export function calcularPuntosTrasCancelacion(puntajeActual: number, justificada: boolean): number {
  const actual = Math.max(0, Number(puntajeActual) || 0);
  if (justificada) return actual;
  return Math.max(0, actual - PENALIZACION_CANCELACION_INJUSTIFICADA);
}

/**
 * Lee el scoring completo de un proveedor a partir de su registro (users).
 * Tolera campos ausentes (base de datos sin la migración o modo local).
 */
export function getProviderScore(user: {
  puntaje?: number | null;
  cancelacionesInjustificadas?: number | null;
} | null | undefined): ProviderScore {
  const puntaje = user?.puntaje !== undefined && user.puntaje !== null
    ? Number(user.puntaje)
    : PUNTOS_SCORE_INICIAL;
  const cancelaciones = user?.cancelacionesInjustificadas !== undefined && user.cancelacionesInjustificadas !== null
    ? Number(user.cancelacionesInjustificadas)
    : 0;
  return {
    puntaje,
    estrellas: puntosAEstrellas(puntaje),
    cancelacionesInjustificadas: Math.max(0, cancelaciones),
    puedeAccederTarifaAlta: puedeAccederTarifaAlta(puntaje),
  };
}
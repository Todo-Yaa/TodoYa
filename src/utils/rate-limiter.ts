/**
 * Utilidad de limitación de tasa (Rate Limiting) y mitigación de DDoS a nivel de aplicación.
 * Filtra peticiones repetitivas por IP y bloquea payloads excesivamente pesados.
 */

// Caché en memoria para almacenar las peticiones de cada dirección IP
const cacheRateLimit = new Map<string, { count: number; resetTime: number }>();

/**
 * Obtiene la dirección IP real del cliente desde las cabeceras HTTP de Vercel/proxies.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Verifica si una IP ha excedido el límite de solicitudes permitido en una ventana de tiempo.
 * @param ip Dirección IP del cliente.
 * @param limit Número máximo de solicitudes permitidas.
 * @param windowMs Ventana de tiempo en milisegundos (por defecto 1 minuto).
 */
export function isRateLimited(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const clientData = cacheRateLimit.get(ip);

  // Limpiar memoria si el mapa crece demasiado (mitigación de fugas de memoria)
  if (cacheRateLimit.size > 10000) {
    const expiredKeys: string[] = [];
    cacheRateLimit.forEach((val, key) => {
      if (now > val.resetTime) expiredKeys.push(key);
    });
    expiredKeys.forEach(k => cacheRateLimit.delete(k));
  }

  if (!clientData) {
    cacheRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > clientData.resetTime) {
    // Reiniciar ventana de tiempo
    cacheRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  clientData.count += 1;
  if (clientData.count > limit) {
    return true;
  }

  return false;
}

/**
 * Valida el tamaño del cuerpo de la solicitud para evitar saturación de memoria (Payload Size Limit).
 * @param request Objeto Request.
 * @param maxBytes Tamaño máximo en bytes (por defecto 1MB).
 */
export function isPayloadTooLarge(request: Request, maxBytes = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const bytes = parseInt(contentLength, 10);
    if (isNaN(bytes) || bytes > maxBytes) {
      return true;
    }
  }
  return false;
}

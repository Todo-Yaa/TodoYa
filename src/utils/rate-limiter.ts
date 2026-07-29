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
 * Obtiene el estado actual del contador de rate limit para una IP.
 */
export function getRateLimitStatus(ip: string, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const clientData = cacheRateLimit.get(ip);
  if (!clientData || now > clientData.resetTime) {
    return { count: 0, remaining: limit, resetTime: now + windowMs };
  }
  const remaining = Math.max(0, limit - clientData.count);
  return { count: clientData.count, remaining, resetTime: clientData.resetTime };
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

/**
 * Helper unificado para validar Rate Limit y Payload Size en API Routes.
 * Devuelve un Response HTTP 429 o 413 si se viola la regla, o null si la petición es válida.
 */
export function checkApiRateLimit(
  request: Request,
  limit = 60,
  windowMs = 60000,
  maxPayloadBytes = 1024 * 1024
): Response | null {
  if (isPayloadTooLarge(request, maxPayloadBytes)) {
    return Response.json(
      { error: 'Payload excesivo. Petición rechazada por razones de seguridad anti-DDoS.' },
      { status: 413 }
    );
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, limit, windowMs)) {
    const retrySeconds = Math.ceil(windowMs / 1000);
    return Response.json(
      {
        error: 'Límite de peticiones excedido (Anti-DDoS / Rate Limit). Intenta más tarde.',
        retryAfterSeconds: retrySeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retrySeconds),
          'X-RateLimit-Limit': String(limit)
        }
      }
    );
  }

  return null;
}

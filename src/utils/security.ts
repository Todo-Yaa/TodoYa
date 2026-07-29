/**
 * Módulo de Seguridad y Sanitización contra Inyecciones
 * Protege la aplicación contra ataques XSS, Inyección HTML, Inyección SQL/NoSQL,
 * Inyección de Prompts en Inteligencia Artificial y Payloads Maliciosos.
 */

/**
 * Sanitiza una cadena de texto eliminando etiquetas HTML peligrosas,
 * scripts ejecutable, manejadores de eventos (onerror, onclick, etc.)
 * y secuencias de inyección.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }

  let sanitized = input.trim();

  // 1. Prevenir protocolo javascript: y data: en URLs o campos
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // 2. Eliminar etiquetas <script> y su contenido
  sanitized = sanitized.replace(/<script\b[^<]*([\s\S]*?)<\/script>/gi, '');

  // 3. Eliminar etiquetas de estilo e iframe desautorizadas
  sanitized = sanitized.replace(/<iframe\b[^<]*([\s\S]*?)<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*([\s\S]*?)<\/style>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*([\s\S]*?)<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*([\s\S]*?)<\/embed>/gi, '');

  // 4. Eliminar manejadores de eventos inline (onerror=, onclick=, onload=, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^>\s]+/gi, '');

  // 5. Eliminar secuencias nulas (Null Bytes %00 / \0) que burlan validaciones
  sanitized = sanitized.replace(/\0/g, '');

  // 6. Escape básico de entidades HTML peligrosas para renderizado web seguro
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
}

/**
 * Desescapa entidades HTML de forma segura cuando se requiera mostrar el texto original sanitizado.
 */
export function decodeSanitizedText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Sanitiza y valida formato de correo electrónico.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  const cleaned = email.trim().toLowerCase().replace(/\s+/g, '');
  // Filtra caracteres no válidos en email
  const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!validEmailRegex.test(cleaned)) {
    // Si contiene caracteres extraños los remueve
    return cleaned.replace(/[^a-zA-Z0-9._%+-@]/g, '');
  }
  return cleaned;
}

/**
 * Sanitiza números de teléfono permitiendo solo dígitos, espacios, guiones y signo '+'.
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  return phone.trim().replace(/[^\d+()\s-]/g, '');
}

/**
 * Sanitiza un objeto completo de forma recursiva (limpia todas las propiedades string).
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const copy: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      copy[key] = typeof val === 'string' ? sanitizeText(val) : sanitizeObject(val);
    }
    return copy as T;
  }
  return obj;
}

/**
 * Sanitiza entradas dirigidas a modelos de lenguaje (LLM / Gemini AI)
 * para neutralizar ataques de Prompt Injection (ej. "Ignore previous instructions", override delimiters).
 */
export function sanitizePromptInput(text: unknown): string {
  const clean = sanitizeText(text);
  // Remover comandos comunes de manipulación de system prompts
  return clean
    .replace(/(?:system instruction|ignore previous|disregard prior|act as root|bypass rules|jailbreak)/gi, '[filtrado]')
    .replace(/```(?:system|prompt|instruction)/gi, '```');
}

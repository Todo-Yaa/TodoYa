import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_KEY = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRÍTICO: La variable de entorno JWT_SECRET es obligatoria en entorno de producción.');
    } else {
      console.warn('[SEGURIDAD] Advertencia: Usando clave secreta JWT por defecto para desarrollo ("todo-ya-dev-secret").');
    }
  }
  return new TextEncoder().encode(secret || 'todo-ya-dev-secret');
};
const TOKEN_EXPIRATION = '30d';

export interface SessionPayload {
  userId: number;
  tenantId: number;
  rol?: string;
}

// ─────────────────────────────────────────────────────────────
// HASH DE CONTRASEÑAS (scrypt de Node — sin dependencias)
// Formato almacenado: scrypt$<saltHex>$<hashHex>
// ─────────────────────────────────────────────────────────────

function scryptHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptHash(password, salt);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const derivedKey = await scryptHash(password, salt);
  if (derivedKey.length !== expected.length) return false;
  return timingSafeEqual(derivedKey, expected);
}

export function esPasswordHasheada(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

// ─────────────────────────────────────────────────────────────
// JWT DE SESIÓN (jose — HS256)
// ─────────────────────────────────────────────────────────────

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(JWT_SECRET_KEY());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY(), { algorithms: ['HS256'] });
    if (typeof payload.userId !== 'number' || typeof payload.tenantId !== 'number') {
      return null;
    }
    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      rol: typeof payload.rol === 'string' ? payload.rol : undefined,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// RESOLUCIÓN DE TENANT PARA API ROUTES
// Orden: JWT (Authorization: Bearer) → query ?tenantId= → tenant por defecto (1)
// ─────────────────────────────────────────────────────────────

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function getTenantIdFromUrl(request: Request): number | null {
  const url = new URL(request.url);
  const raw = url.searchParams.get('tenantId');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Resuelve el tenantId de la petición:
 * 1. Si hay JWT válido, usa su tenantId.
 * 2. Si no, usa el query param ?tenantId=.
 * 3. Si tampoco, cae en el tenant por defecto (1).
 */
export async function resolveTenantId(request: Request): Promise<number> {
  const token = getBearerToken(request);
  if (token) {
    const session = await verifySessionToken(token);
    if (session) return session.tenantId;
  }
  const fromUrl = getTenantIdFromUrl(request);
  return fromUrl ?? 1;
}

/**
 * Extrae la sesión autenticada de la petición (o null si el JWT no es válido).
 */
export async function getSession(request: Request): Promise<SessionPayload | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifySessionToken(token);
}

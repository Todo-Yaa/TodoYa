// Ruta heredada deshabilitada deliberadamente durante la migración a NestJS.
// Nunca retornar usuarios/contraseñas ni permitir mutaciones sin autenticación.
const removed = () => Response.json(
  { message: 'Legacy users API is disabled; use NestJS and Supabase Auth' },
  { status: 410 },
);
export const GET = removed;
export const POST = removed;
export const PUT = removed;
export const DELETE = removed;

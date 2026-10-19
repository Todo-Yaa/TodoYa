import { supabase } from './supabase';

const root = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
if (!/^https?:\/\/[^/]+$/.test(root)) {
  throw new Error('Configure EXPO_PUBLIC_API_URL con un origen HTTP(S) accesible por el teléfono');
}
export async function authenticatedApi<T>(path: string, payload?: unknown, method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'): Promise<T> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('No hay sesión Supabase válida');
  const response = await fetch(`${root}${path}`, {
    method: method ?? (payload === undefined ? 'GET' : 'POST'),
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('La sesión expiró; inicia sesión nuevamente');
    if (response.status === 403) throw new Error('Confirma tu correo o completa los requisitos de acceso');
    // Never echo raw server body; could contain sensitive implementation details.
    throw new Error(`No fue posible completar la solicitud (HTTP ${response.status})`);
  }
  return response.json() as Promise<T>;
}

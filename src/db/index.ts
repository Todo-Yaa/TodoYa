import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Cargar la URL de conexión desde las variables de entorno (.env)
// Soporta DATABASE_URL (servidor/producción Vercel) y EXPO_PUBLIC_DATABASE_URL (cliente)
const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    '⚠️ ADVERTENCIA: La variable de entorno DATABASE_URL o EXPO_PUBLIC_DATABASE_URL no está definida.\n' +
    'El sistema utilizará simulación en memoria (localDb/AsyncStorage) hasta que configures tu base de datos Neon.db.'
  );
}

// Inicializar el cliente Neon HTTP (Serverless)
const sql = databaseUrl ? neon(databaseUrl) : null;

// Inicializar Drizzle ORM con los esquemas de tablas
export const db = sql ? drizzle(sql, { schema }) : null;

// Helper para verificar si la base de datos real está activa
export const isDbConnected = () => {
  return db !== null;
};

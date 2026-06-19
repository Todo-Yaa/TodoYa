import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Cargar la URL de conexión desde las variables de entorno de Expo (.env)
// NOTA: Para desarrollo local, crea un archivo `.env` en la raíz con:
// EXPO_PUBLIC_DATABASE_URL=postgresql://tu_usuario:tu_contraseña@tu_host.neon.tech/neondb?sslmode=require
const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    '⚠️ ADVERTENCIA: La variable de entorno EXPO_PUBLIC_DATABASE_URL no está definida.\n' +
    'El sistema utilizará simulación en memoria (AsyncStorage) hasta que configures tu base de datos Neon.db.'
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

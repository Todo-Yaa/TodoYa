// ============================================================================
// ROLLBACK de la migración 0000: Sistema de Scoring de Proveedores (Tarea 3.3)
// Uso: npm run db:rollback-scoring
// Ejecuta drizzle/0000_scoring_cancelaciones_proveedor.down.sql contra la base
// de datos (DATABASE_URL o EXPO_PUBLIC_DATABASE_URL) y elimina el registro de
// la migración en `__drizzle_migrations` para poder re-aplicarla luego.
// ============================================================================
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL o EXPO_PUBLIC_DATABASE_URL no está configurada en .env');
  process.exit(1);
}

async function rollback() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const downSql = fs.readFileSync(
      path.resolve(process.cwd(), 'drizzle/0000_scoring_cancelaciones_proveedor.down.sql'),
      'utf-8'
    );

    // Quitar los marcadores "-->" de drizzle y ejecutar cada sentencia por separado
    const statements = downSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[Rollback Scoring] Ejecutando ${statements.length} sentencias de reversión...`);
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (e: any) {
        // Si la columna/tabla no existe (ya se había revertido), continuar
        if (e.code === '42703' || e.code === '42P01') {
          console.warn(`[Rollback Scoring] Se omitió una sentencia (ya revertida): ${e.message}`);
        } else {
          throw e;
        }
      }
    }

    // Eliminar el registro de la migración para permitir re-aplicarla con `db:migrate`
    await client.query(
      `DELETE FROM "__drizzle_migrations"
       WHERE id = (SELECT MAX(id) FROM "__drizzle_migrations");`
    ).catch(() => console.warn('[Rollback Scoring] No se pudo limpiar __drizzle_migrations (¿aún sin ejecutar?).'));

    console.log('✅ Scoring de proveedores revertido correctamente. Puedes re-aplicarlo con `npm run db:migrate`.');
  } catch (error) {
    console.error('❌ Error ejecutando el rollback:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
    process.exit(0);
  }
}

rollback();
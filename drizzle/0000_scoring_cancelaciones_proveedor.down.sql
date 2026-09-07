-- ============================================================================
-- ROLLBACK de la migración 0000: Sistema de Scoring de Proveedores (Tarea 3.3)
-- ============================================================================
-- Revierte por completo los cambios de
-- drizzle/0000_scoring_cancelaciones_proveedor.sql
--
-- ⚠️ ADVERTENCIA: elimina los datos históricos de cancelaciones y las
--    columnas de scoring (puntos) de los proveedores. Úsalo SOLO si la
--    migración falla o se decide revertir el feature.
--
-- Para revolver con drizzle-kit también debes eliminar el registro de esta
-- migración de la tabla `__drizzle_migrations` para poder re-aplicarla luego:
--   DELETE FROM "__drizzle_migrations" WHERE id IS NOT NULL AND hash IN (
--     SELECT hash FROM "__drizzle_migrations" ORDER BY id DESC LIMIT 1
--   );
-- ============================================================================

-- 1) Índices de la tabla de cancelaciones
DROP INDEX IF EXISTS "provider_cancelaciones_proveedor_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "provider_cancelaciones_order_idx";

-- 2) Tabla de historial de cancelaciones
--> statement-breakpoint
DROP TABLE IF EXISTS "provider_cancelaciones";

-- 3) Columnas de scoring en users
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "fecha_ultima_penalizacion";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "cancelaciones_injustificadas";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "puntaje";
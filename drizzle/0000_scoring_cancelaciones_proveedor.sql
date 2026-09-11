-- ============================================================================
-- MIGRACIÓN 0000: Sistema de Scoring de Proveedores (Tarea 3.3)
-- ============================================================================
-- La base de datos real ya existe (creada con `drizzle-kit push`), por lo que
-- esta migración aplica ÚNICAMENTE el delta del sistema de scoring y es
-- idempotente: puede ejecutarse con seguridad sobre la base actual.
--
-- APLICAR:   npm run db:migrate   (equivalente a `npx drizzle-kit migrate`)
-- ROLLBACK:  npm run db:rollback-scoring (ejecuta el archivo
--            drizzle/0000_scoring_cancelaciones_proveedor.down.sql)
--
-- Cambios incluidos en `users` (todo proveedor inicia con 100 pts = 5.0★):
--   * puntaje                      integer NOT NULL DEFAULT 100
--   * cancelaciones_injustificadas integer NOT NULL DEFAULT 0
--   * fecha_ultima_penalizacion    timestamp
--
-- Nueva tabla `provider_cancelaciones`: historial de auditoría de cada
-- cancelación efectuada por un proveedor (justificada o injustificada).
-- ============================================================================

-- 1) Scoring en la tabla users (idempotente)
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "puntaje" integer DEFAULT 100 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cancelaciones_injustificadas" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fecha_ultima_penalizacion" timestamp;

-- 2) Tabla de historial de cancelaciones (idempotente, con FKs inline)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_cancelaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action,
	"order_id" integer NOT NULL REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
	"proveedor_id" integer NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	"justificada" boolean DEFAULT false NOT NULL,
	"motivo" varchar(256),
	"puntos_penalizados" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- 3) Índices de la nueva tabla (idempotente)
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_cancelaciones_proveedor_idx" ON "provider_cancelaciones" USING btree ("proveedor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_cancelaciones_order_idx" ON "provider_cancelaciones" USING btree ("order_id");
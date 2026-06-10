-- Fix de seguridad — Paso 4: cerrar la base con RLS + vitrina pública
--
-- ⚠ PUNTO DE NO RETORNO: a partir de acá la clave anónima (anon, la que viaja
-- en el bundle del browser) deja de poder leer/escribir las tablas. Solo los
-- usuarios autenticados vía Supabase Auth (authenticated) operan. El público
-- anónimo solo puede ver la vista `autos_publicos`.

-- ── 4.1 Flag de publicación en autos ────────────────────────────────────────
-- Default false: ningún auto se publica solo. Se activa con un toggle en /admin.
ALTER TABLE autos ADD COLUMN IF NOT EXISTS publicado BOOLEAN NOT NULL DEFAULT false;

-- ── 4.2 RLS en TODAS las tablas del schema public ───────────────────────────
-- Recorre cada tabla (a prueba de olvidos: si mañana agregás una tabla y
-- re-corrés algo parecido, queda cubierta). Habilita RLS y deja una política
-- que permite TODO a usuarios autenticados. `anon` queda SIN política => sin
-- acceso a ninguna tabla.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS authenticated_all ON public.%I;', r.tablename);
    EXECUTE format(
      'CREATE POLICY authenticated_all ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      r.tablename
    );
  END LOOP;
END $$;

-- ── 4.3 Vitrina pública: SOLO columnas seguras, SOLO autos publicados ────────
-- Excluido a propósito (datos sensibles que NI SIQUIERA existen en la vista):
--   precioCompra (costo), gananciaPretendida (margen), patente, chasis,
--   propietarioId (dueño), estado / estadoPublicacion (estado interno).
-- La vista corre con permisos del owner (NO security_invoker), a propósito:
-- así `anon` lee la vitrina sin tener ningún acceso a la tabla `autos`.
DROP VIEW IF EXISTS autos_publicos;
CREATE VIEW autos_publicos AS
  SELECT id, tipo, marca, modelo, version, anio, color, condicion,
         combustible, transmision, traccion, puertas, carroceria, motor,
         kilometraje, precio, descripcion, foto, fotos, "createdAt"
  FROM autos
  WHERE publicado = true;

-- ── 4.4 anon solo puede leer la vitrina (nunca la tabla autos) ──────────────
GRANT SELECT ON autos_publicos TO anon;

-- Forzar a PostgREST a recargar el esquema para que exponga la vista nueva.
NOTIFY pgrst, 'reload schema';

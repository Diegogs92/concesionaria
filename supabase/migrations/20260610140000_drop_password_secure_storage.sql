-- Fix de seguridad — Paso 5: eliminar password en texto plano + asegurar storage

-- ── 5.1 Borrar la columna password ──────────────────────────────────────────
-- Ya no se usa: las contraseñas viven hasheadas en Supabase Auth (auth.users).
-- Era el dato más sensible de la base (estaba en texto plano).
ALTER TABLE usuarios DROP COLUMN IF EXISTS password;

-- ── 5.2 Storage `avatars`: lectura pública, escritura solo autenticados ──────
-- El bucket es público (las fotos de perfil se sirven por URL pública), pero
-- subir/modificar/borrar debe requerir sesión. Antes cualquiera (anon) podía.
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

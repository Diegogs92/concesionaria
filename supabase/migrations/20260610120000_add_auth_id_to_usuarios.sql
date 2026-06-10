-- Fix de seguridad — Paso 1: linkear usuarios con Supabase Auth
--
-- Agrega la referencia al usuario de Supabase Auth (auth.users.id).
-- No cambia el comportamiento actual: la columna queda NULL hasta que el
-- Paso 2 cree los usuarios en Auth y complete el link. La app sigue
-- funcionando igual con el login actual mientras tanto.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

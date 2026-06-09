-- PROPIETARIOS
CREATE TABLE IF NOT EXISTS propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  "createdAt" TEXT
);
ALTER TABLE propietarios DISABLE ROW LEVEL SECURITY;

-- Relacionar autos con propietarios
ALTER TABLE autos ADD COLUMN IF NOT EXISTS "propietarioId" UUID REFERENCES propietarios(id) ON DELETE SET NULL;
ALTER TABLE autos ADD COLUMN IF NOT EXISTS "gananciaPretendida" INTEGER;

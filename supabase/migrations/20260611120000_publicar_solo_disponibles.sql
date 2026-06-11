-- La vitrina solo muestra autos publicados Y disponibles: un auto vendido
-- desaparece de la web aunque conserve publicado = true (defensa en la vista,
-- no dependemos de que el admin lo despublique al vender).
DROP VIEW IF EXISTS autos_publicos;
CREATE VIEW autos_publicos AS
  SELECT id, tipo, marca, modelo, version, anio, color, condicion,
         combustible, transmision, traccion, puertas, carroceria, motor,
         kilometraje, precio, descripcion, foto, fotos, "createdAt"
  FROM autos
  WHERE publicado = true
    AND coalesce(estado, 'disponible') = 'disponible';

-- DROP VIEW borra los grants: re-otorgar lectura al público anónimo.
GRANT SELECT ON autos_publicos TO anon;

NOTIFY pgrst, 'reload schema';

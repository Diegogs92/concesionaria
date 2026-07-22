# Flyer con múltiples vehículos para Instagram

## Contexto

Hoy `AutosPage.jsx` permite generar una imagen individual (post/story) por
vehículo vía `/api/imagen-social` (`web/lib/imagen-social.js`, `sharp` +
SVG). No existe ningún patrón de selección múltiple en la app. El pedido es
poder seleccionar varios vehículos desde la tabla y generar una sola imagen
tipo flyer con la lista de esos vehículos y su precio, para subir como
Story o Feed a Instagram.

## 1. Selección en la tabla (`src/pages/AutosPage.jsx`)

- Columna de checkbox al inicio de cada fila (tabla y vista mosaico), con
  `e.stopPropagation()` en el `onChange` para no abrir el modal de preview
  (mismo patrón que la columna Acciones, línea ~830).
- Checkbox "seleccionar todos" en el header de la tabla.
- Estado `selectedIds` (array) + contador visible ("3 seleccionados").
- Con `selectedIds.length > 0` aparece una barra/botón de acción junto a
  "+ Agregar": contador, "Generar flyer", "Cancelar selección".
- Tope duro de **8 vehículos**. Al intentar tildar un 9°, se bloquea con
  aviso ("Máximo 8 vehículos por flyer"); no se agrega automáticamente.
- "Generar flyer" abre un modal (similar al preview modal existente) con
  dos descargas: "Story (1080x1920)" y "Feed (1080x1080)", apuntando a la
  nueva API con los ids seleccionados en query string.

## 2. Layout del flyer (formato lista de precios, no collage)

- **Header**: logo/nombre de la concesionaria + título fijo tipo "STOCK
  DISPONIBLE".
- **Filas** (una por vehículo, hasta 8): foto miniatura cuadrada
  (`fotos[0]`, placeholder si no tiene fotos) + "MARCA MODELO Versión ·
  Año · KM" + precio grande destacado a la derecha.
- **Footer**: contacto (teléfono/WhatsApp/Instagram), reutilizando el
  bloque del flyer individual si existe.
- Story (1080×1920): filas altas, más aire vertical.
- Feed (1080×1080): filas más compactas (miniatura e interlineado
  reducidos) para que 8 filas entren en el cuadrado.

## 3. Backend

- `generarImagenSocialMultiple(ids, tipo)` — nueva función en
  `web/lib/imagen-social.js` (o archivo nuevo
  `web/lib/imagen-social-multiple.js`), reusa `getAutoPublico` por id y
  arma el SVG de lista con `sharp`, igual que el flyer individual.
- Nueva ruta `web/app/api/imagen-social-multiple/route.js`: recibe
  `?ids=1,2,3&tipo=post|story`, valida máximo 8 ids, devuelve PNG con
  `Content-Disposition: attachment`.

## 4. Errores y casos borde

- Vehículo sin fotos → placeholder gris con ícono de auto.
- Vehículo vendido entre selección y descarga → no se bloquea; el flyer es
  una foto del momento, no vale la pena validar en la API.
- Ids inválidos/inexistentes en la query → se ignoran silenciosamente
  (igual que el comportamiento actual de `getAutoPublico` con id
  inexistente).
- 0 vehículos seleccionados → el botón "Generar flyer" no se muestra, no
  hay caso a manejar en la API.

## Fuera de alcance (YAGNI)

- Edición de layout/orden desde la UI (drag, elegir foto por vehículo).
- Persistir "flyers" como entidad en la base — se genera al vuelo, como el
  flyer individual actual.
- Texto de header/footer configurable desde la UI — queda hardcodeado
  como el flyer individual actual.
- Publicación directa a Instagram (API de Meta) — el pedido es descargar
  para subir manualmente, no auto-publicar.

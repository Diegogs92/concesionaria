# Product

## Register

brand

## Users

Compradores de vehículos usados (autos y motos) en Argentina, mayormente desde el celular. Llegan por un link compartido en WhatsApp o Instagram, o buscando un modelo puntual en Google. Desconfían por defecto: vienen quemados de avisos viejos, precios ocultos y fotos truchas. Su trabajo: ver qué hay disponible, a qué precio, y decidir si vale la pena escribir o ir a ver el vehículo.

Superficie secundaria (registro product, override por tarea): la app de gestión interna en `src/` que usa el equipo de la concesionaria (stock, ventas, finanzas).

## Product Purpose

Vitrina pública del stock real de ICY Automotores, alimentada en vivo por el sistema de gestión interno (vista `autos_publicos` de Supabase). Éxito = el visitante confía en lo que ve y inicia contacto (WhatsApp) o comparte un vehículo. Cada vehículo publicado tiene su página propia, indexable y compartible con preview.

## Brand Personality

Moderno, tecnológico, preciso. Se siente plataforma digital, no aviso clasificado: la sensación de Kavak/plataformas digital-first, con identidad propia. Tres palabras: limpio, confiable, ágil. El nombre ICY habilita una identidad fría/helada (hielo, precisión) como gancho visual propio.

## Anti-references

- Concesionaria web de los 2000: banners girando, texto con sombras, GIFs, fotos pixeladas, contadores de visitas, autoplay de música.
- Grilla de clasificados genérica (MercadoLibre): sensación de mercado de pulgas, aviso entre miles.
- Landing SaaS genérica: gradientes violetas, cards idénticas con iconitos, hero-metric template.

## Design Principles

1. El stock es el protagonista: fotos y datos reales por delante de cualquier decoración.
2. Precisión transmite confianza: alineación, tipografía y datos exactos valen más que adjetivos ("excelente estado").
3. Movimiento con propósito: la animación dirige la mirada al inventario, nunca compite con él.
4. Un toque de identidad fría (ICY) usado con intención, no como gimmick repetido en cada esquina.
5. Mobile primero de verdad: el 80%+ llega desde WhatsApp/Instagram en un teléfono.

## Accessibility & Inclusion

Estándar razonable sin certificación formal: contraste AA en texto, `prefers-reduced-motion` respetado en toda animación (el hero animado se congela a escena estática), targets táctiles ≥44px, semántica HTML correcta.

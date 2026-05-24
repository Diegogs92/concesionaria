# Supabase schema workflow

Este repo ya quedó vinculado al proyecto remoto `hwlzycxbcbtktobogurr`.

## Objetivo

Gestionar cambios estructurales de la base remota mediante migraciones versionadas, sin ejecutar SQL manualmente en el dashboard.

## Scripts disponibles

- `npm run db:new -- nombre_del_cambio`
- `npm run db:pull`
- `npm run db:push`
- `npm run db:list`
- `npm run db:status`

## Flujo correcto

1. Crear migración nueva:

```bash
npm run db:new -- agregar_columna_estado_autos
```

2. Editar el archivo SQL generado en `supabase/migrations/`.

3. Aplicar cambios estructurales al proyecto remoto:

```bash
npm run db:push
```

4. Si alguien cambió el schema remoto fuera de este repo, traer esos cambios:

```bash
npm run db:pull
```

## Regla importante

`db:push` cambia la estructura remota. No lo uses para datos de prueba.

Usá migraciones para:

- tablas
- columnas
- índices
- constraints
- policies
- funciones
- triggers

No lo uses para sincronizar datos.

## Autenticación

La CLI necesita sesión iniciada o `SUPABASE_ACCESS_TOKEN` configurado.

Ejemplo temporal:

```bash
SUPABASE_ACCESS_TOKEN="tu_token" npm run db:push
```

## Seguridad

- No guardes el access token en el repo.
- Como compartiste un token en esta sesión, conviene revocarlo y crear uno nuevo cuando terminemos.

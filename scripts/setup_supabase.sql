-- ============================================================
-- Ejecutar este SQL en Supabase → SQL Editor → New query
-- ============================================================

-- AUTOS
create table if not exists autos (
  id uuid primary key default gen_random_uuid(),
  marca text,
  modelo text,
  version text,
  anio integer,
  condicion text,
  precio integer,
  "precioCompra" integer,
  kilometraje integer,
  combustible text,
  transmision text,
  puertas integer,
  carroceria text,
  traccion text,
  color text,
  foto text,
  descripcion text,
  estado text default 'disponible',
  "createdAt" text
);
alter table autos disable row level security;

-- CLIENTES
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  telefono text,
  email text,
  dni text,
  "createdAt" text
);
alter table clientes disable row level security;

-- VENTAS
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  "autoId" text,
  "clienteId" text,
  "vendedorId" text,
  "tipoPago" text,
  cuotas integer,
  "precioFinal" integer,
  ganancia integer,
  "comisionVendedor" integer,
  fecha text,
  "createdAt" text
);
alter table ventas disable row level security;

-- EGRESOS
create table if not exists egresos (
  id uuid primary key default gen_random_uuid(),
  tipo text,
  descripcion text,
  monto integer,
  fecha text,
  "createdAt" text
);
alter table egresos disable row level security;

-- TEST DRIVES
create table if not exists test_drives (
  id uuid primary key default gen_random_uuid(),
  "autoId" text,
  "clienteId" text,
  "vendedorId" text,
  fecha text,
  horario text,
  estado text,
  notas text,
  "createdAt" text
);
alter table test_drives disable row level security;

-- HISTORIAL DE PRECIOS
create table if not exists historial_precios (
  id uuid primary key default gen_random_uuid(),
  "autoId" text,
  campo text,
  "valorAnterior" integer,
  "valorNuevo" integer,
  fecha text,
  "createdAt" text
);
alter table historial_precios disable row level security;

-- USUARIOS
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  username text unique,
  password text,
  rol text,
  comision float,
  "createdAt" text
);
alter table usuarios disable row level security;

-- Usuario gerente inicial (cambiar contraseña después)
insert into usuarios (nombre, username, password, rol, comision, "createdAt")
values ('Gerente', 'gerente', '1234', 'gerente', 0, current_date::text)
on conflict (username) do nothing;

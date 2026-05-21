create table if not exists public.deudas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('personal', 'negocio')),
  concepto text not null check (length(trim(concepto)) > 0),
  observaciones text,
  monto numeric(14, 2) not null check (monto > 0),
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'PAGADA')),
  "createdAt" date not null default current_date
);

create index if not exists deudas_tipo_idx on public.deudas (tipo);
create index if not exists deudas_estado_idx on public.deudas (estado);

create table if not exists public.deuda_conceptos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('personal', 'negocio')),
  nombre text not null check (length(trim(nombre)) > 0),
  "createdAt" date not null default current_date,
  constraint deuda_conceptos_tipo_nombre_key unique (tipo, nombre)
);

create index if not exists deuda_conceptos_tipo_idx on public.deuda_conceptos (tipo);

grant select, insert, update, delete on public.deudas to anon, authenticated;
grant select, insert, update, delete on public.deuda_conceptos to anon, authenticated;

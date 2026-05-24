-- Expande el constraint de estado para incluir PAGO_PARCIAL
alter table public.deudas drop constraint if exists deudas_estado_check;
alter table public.deudas add constraint deudas_estado_check
  check (estado in ('PENDIENTE', 'PAGADA', 'PAGO_PARCIAL'));

-- Tabla de pagos parciales de deudas
create table if not exists public.deuda_pagos (
  id uuid primary key default gen_random_uuid(),
  deuda_id uuid not null references public.deudas(id) on delete cascade,
  monto numeric(14, 2) not null check (monto > 0),
  "createdAt" date not null default current_date
);

create index if not exists deuda_pagos_deuda_idx on public.deuda_pagos (deuda_id);

grant select, insert, delete on public.deuda_pagos to anon, authenticated;

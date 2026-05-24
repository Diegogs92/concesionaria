alter table public.deudas
  add column if not exists moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  add column if not exists cotizacion_blue numeric(10, 2);

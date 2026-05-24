alter table public.deuda_pagos
  add column if not exists fecha date not null default current_date;

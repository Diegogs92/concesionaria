delete from public.deuda_conceptos concepto
where not exists (
  select 1
  from public.deudas deuda
  where deuda.tipo = concepto.tipo
    and deuda.concepto = concepto.nombre
);

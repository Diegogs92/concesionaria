create or replace function public.remove_orphan_deuda_concepto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.deuda_conceptos concepto
  where concepto.tipo = old.tipo
    and concepto.nombre = old.concepto
    and not exists (
      select 1
      from public.deudas deuda
      where deuda.tipo = old.tipo
        and deuda.concepto = old.concepto
    );

  return old;
end;
$$;

drop trigger if exists remove_orphan_deuda_concepto_after_delete on public.deudas;

create trigger remove_orphan_deuda_concepto_after_delete
after delete on public.deudas
for each row
execute function public.remove_orphan_deuda_concepto();

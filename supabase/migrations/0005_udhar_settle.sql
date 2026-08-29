-- Allow logging udhar repayments (returned borrowed / collected lent).
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'transactions'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%udhar_taken%'
  loop
    execute format('alter table public.transactions drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.transactions
  add constraint transactions_type_check
  check (type in (
    'spend',
    'udhar_taken',
    'udhar_given',
    'emergency',
    'udhar_repay',
    'udhar_collect'
  ));

-- Cash on hand, separate from bank / UPI / card balance.
alter table profiles
  add column if not exists cash_balance numeric(12,2) not null default 0;

alter table balance_log
  add column if not exists wallet text not null default 'bank';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'balance_log_wallet_check'
  ) then
    alter table balance_log
      add constraint balance_log_wallet_check check (wallet in ('bank', 'cash'));
  end if;
end $$;

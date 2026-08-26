-- Profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date,
  bank_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  type text not null check (type in ('spend','udhar_taken','udhar_given','emergency')) default 'spend',
  tags text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on transactions (user_id, occurred_at desc);

-- Balance history (every manual add/adjust to bank_balance)
create table balance_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_amount numeric(12,2) not null,
  reason text,
  balance_after numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- Investments
create table investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount_invested numeric(12,2) not null,
  current_value numeric(12,2) not null,
  notes text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table transactions enable row level security;
alter table balance_log enable row level security;
alter table investments enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid());
create policy "own transactions" on transactions for all using (user_id = auth.uid());
create policy "own balance_log" on balance_log for all using (user_id = auth.uid());
create policy "own investments" on investments for all using (user_id = auth.uid());

-- ASSUMPTION: create a profile row on signup so GET /api/profile and balance work immediately.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

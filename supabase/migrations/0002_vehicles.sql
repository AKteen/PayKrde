-- Vehicles
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('2w','4w')),
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists vehicles_user_id_idx on vehicles (user_id);

create table if not exists vehicle_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  tags text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists vehicle_expenses_vehicle_occurred_idx
  on vehicle_expenses (vehicle_id, occurred_at desc);

alter table vehicles enable row level security;
alter table vehicle_expenses enable row level security;

drop policy if exists "own vehicles" on vehicles;
create policy "own vehicles" on vehicles for all using (user_id = auth.uid());
drop policy if exists "own vehicle_expenses" on vehicle_expenses;
create policy "own vehicle_expenses" on vehicle_expenses for all using (user_id = auth.uid());

-- Optional registration / number plate on vehicles.
alter table vehicles
  add column if not exists number_plate text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_number_plate_len'
  ) then
    alter table vehicles
      add constraint vehicles_number_plate_len
      check (number_plate is null or char_length(number_plate) between 1 and 16);
  end if;
end $$;

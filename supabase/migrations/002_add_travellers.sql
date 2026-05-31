alter table public.profiles
  add column if not exists travellers integer not null default 1;

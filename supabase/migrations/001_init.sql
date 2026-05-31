create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  home_airport text not null default 'PER',
  created_at timestamptz default now()
);

create table public.rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null default 'My Roster',
  pattern_type text not null check (pattern_type in ('swing', 'manual')),
  days_on integer,
  days_off integer,
  cycle_start_date date,
  manual_days jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  deal_type text not null check (deal_type in ('flight', 'hotel', 'package')),
  destination text not null,
  start_date date not null,
  end_date date,
  affiliate_url text not null,
  metadata jsonb,
  saved_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.rosters enable row level security;
alter table public.saved_deals enable row level security;

create policy "Users own their profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users own their rosters" on public.rosters
  for all using (auth.uid() = user_id);

create policy "Users own their saved deals" on public.saved_deals
  for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

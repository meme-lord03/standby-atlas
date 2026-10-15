-- AUS Standby Atlas: shared ratings, notes and flight counts for two people.
-- Paste this into Supabase > SQL Editor and click Run.
-- Then change the two emails at the bottom to yours and your girlfriend's, and run that part.

create table if not exists public.allowed_users (email text primary key);

create table if not exists public.ratings (code text primary key, v numeric, at bigint not null);
create table if not exists public.notes   (code text primary key, text text not null default '', at bigint not null);
create table if not exists public.plan    (code text primary key, "out" int, back int, at bigint not null);

alter table public.allowed_users enable row level security;
alter table public.ratings enable row level security;
alter table public.notes   enable row level security;
alter table public.plan    enable row level security;

-- Only signed-in people whose email is on the list can read or change anything.
create or replace function public.is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_users where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

do $$
declare t text;
begin
  foreach t in array array['ratings','notes','plan'] loop
    execute format('drop policy if exists "allowed read" on public.%I', t);
    execute format('drop policy if exists "allowed write" on public.%I', t);
    execute format('create policy "allowed read" on public.%I for select to authenticated using (public.is_allowed())', t);
    execute format('create policy "allowed write" on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
  end loop;
end $$;

-- >>> Change these two emails, then run:
insert into public.allowed_users (email) values
  ('you@example.com'),
  ('her@example.com')
on conflict do nothing;

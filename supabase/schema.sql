-- AUS Standby Atlas: shared ratings, notes and flight counts behind one trip password.
-- Paste this into Supabase > SQL Editor, change the email at the bottom to the shared login you created, and click Run.

create table if not exists public.allowed_users (email text primary key);

create table if not exists public.ratings (code text primary key, v numeric, at bigint not null);
create table if not exists public.notes   (code text primary key, text text not null default '', at bigint not null);
create table if not exists public.plan    (code text primary key, "out" int, back int, at bigint not null);
create table if not exists public.marks   (code text primary key, visited boolean, fav boolean not null default false, at bigint not null);

alter table public.allowed_users enable row level security;
alter table public.ratings enable row level security;
alter table public.notes   enable row level security;
alter table public.plan    enable row level security;
alter table public.marks   enable row level security;

-- Only signed-in people whose email is on the list can read or change anything.
create or replace function public.is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_users where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

do $$
declare t text;
begin
  foreach t in array array['ratings','notes','plan','marks'] loop
    execute format('drop policy if exists "allowed read" on public.%I', t);
    execute format('drop policy if exists "allowed write" on public.%I', t);
    execute format('create policy "allowed read" on public.%I for select to authenticated using (public.is_allowed())', t);
    execute format('create policy "allowed write" on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
  end loop;
end $$;

-- >>> Change this to the shared login's email (the one you created under Authentication > Users):
insert into public.allowed_users (email) values
  ('trips@example.com')
on conflict do nothing;

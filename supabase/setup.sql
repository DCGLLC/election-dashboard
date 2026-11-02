-- Run once in your Supabase project's SQL Editor. No passwords or private keys here.
begin;
create table if not exists public.dashboard_races (
 user_id uuid not null references auth.users(id) on delete cascade,
 race_id text not null check (length(race_id) between 1 and 160 and race_id ~ '^[a-z0-9-]+$'),
 created_at timestamptz not null default now(),
 primary key (user_id,race_id)
);
alter table public.dashboard_races enable row level security;
revoke all on public.dashboard_races from public,anon,authenticated;
grant usage on schema public to authenticated;
grant select,insert,delete on public.dashboard_races to authenticated;
drop policy if exists "Read own dashboard" on public.dashboard_races;
create policy "Read own dashboard" on public.dashboard_races for select to authenticated
 using ((select auth.uid()) = user_id);
drop policy if exists "Add own races" on public.dashboard_races;
create policy "Add own races" on public.dashboard_races for insert to authenticated
 with check ((select auth.uid()) = user_id);
drop policy if exists "Remove own races" on public.dashboard_races;
create policy "Remove own races" on public.dashboard_races for delete to authenticated
 using ((select auth.uid()) = user_id);
commit;

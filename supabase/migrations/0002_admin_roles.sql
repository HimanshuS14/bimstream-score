-- BIMstream SCORE - admin roles (Admin / Reviewer) and team management.
--
-- IMPORTANT ROLLOUT NOTE: this migration tightens the sessions/candidates
-- SELECT policies to require a row in admin_profiles (previously ANY signed-in
-- Supabase user could read all candidate data). Your existing admin account
-- will temporarily lose dashboard access after running this until you also
-- run the backfill INSERT described in the README / rollout notes - do that
-- immediately after this file.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'reviewer' check (role in ('admin', 'reviewer')),
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

-- security definer helpers so RLS policies on admin_profiles (and other
-- tables) can check membership/role without infinite self-recursion.
create or replace function public.is_known_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.admin_profiles where id = uid);
$$;

create or replace function public.is_admin_role(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.admin_profiles where id = uid and role = 'admin');
$$;

-- Any signed-in team member (admin or reviewer) can see the team list.
drop policy if exists "admin_profiles_select_authenticated" on public.admin_profiles;
create policy "admin_profiles_select_authenticated" on public.admin_profiles
  for select to authenticated
  using (public.is_known_admin(auth.uid()));

-- Only an existing Admin may add, edit, or remove team members. (The app's
-- invite/remove server actions additionally use the service-role key and
-- re-check role server-side before calling the Supabase Auth admin API, so
-- this policy is a defense-in-depth backstop, not the only gate.)
drop policy if exists "admin_profiles_insert_admin_only" on public.admin_profiles;
create policy "admin_profiles_insert_admin_only" on public.admin_profiles
  for insert to authenticated
  with check (public.is_admin_role(auth.uid()));

drop policy if exists "admin_profiles_update_admin_only" on public.admin_profiles;
create policy "admin_profiles_update_admin_only" on public.admin_profiles
  for update to authenticated
  using (public.is_admin_role(auth.uid()));

drop policy if exists "admin_profiles_delete_admin_only" on public.admin_profiles;
create policy "admin_profiles_delete_admin_only" on public.admin_profiles
  for delete to authenticated
  using (public.is_admin_role(auth.uid()));

revoke all on public.admin_profiles from anon;

-- Tighten candidate-data visibility: previously any authenticated Supabase
-- user (i.e. anyone with valid login credentials at all) could view every
-- session/candidate row. Now it requires a row in admin_profiles (either
-- role) - this is what makes "removing" a team member in the app actually
-- revoke their access to candidate data, rather than merely hiding a UI link.
drop policy if exists "sessions_select_authenticated" on public.sessions;
create policy "sessions_select_authenticated" on public.sessions
  for select to authenticated
  using (public.is_known_admin(auth.uid()));

drop policy if exists "candidates_select_authenticated" on public.candidates;
create policy "candidates_select_authenticated" on public.candidates
  for select to authenticated
  using (public.is_known_admin(auth.uid()));

-- tests keeps its existing broad anon+authenticated select policy untouched -
-- candidates taking a test (anon) still need to read the question bank.

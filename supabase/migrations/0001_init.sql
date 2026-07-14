-- BIMstream SCORE recruitment assessment - initial schema
-- Run this once against your Supabase project (SQL editor or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- tests: the question bank for each assessment ("modeler" / "leadership").
-- The full section/question/option/trait_delta structure lives in `schema`
-- (jsonb) rather than a deep relational model, matching content/*.json 1:1.
-- ---------------------------------------------------------------------------
create table if not exists public.tests (
  id text primary key,
  title text not null,
  duration_minutes integer not null,
  schema jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- candidates: one row per person who starts an assessment.
-- ---------------------------------------------------------------------------
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  target_role text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sessions: one attempt at a test by a candidate.
-- `answers` is an array of {questionId, selectedIndex}.
-- `scores`, `flags`, `recommendation` are null until the candidate submits and
-- the server-side scoring engine (service-role only) computes them.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  test_id text not null references public.tests (id),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '[]'::jsonb,
  scores jsonb,
  flags jsonb,
  recommendation text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_candidate_id_idx on public.sessions (candidate_id);
create index if not exists sessions_test_id_idx on public.sessions (test_id);
create index if not exists sessions_status_idx on public.sessions (status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tests enable row level security;
alter table public.candidates enable row level security;
alter table public.sessions enable row level security;

-- tests: readable by anyone (anon + authenticated) so the candidate-facing
-- /take/[testId] pages can render the question bank (both tests are now 100%
-- situational-judgment - no "correct answer" exists to leak client-side, since
-- every option only carries a trait_deltas vector). Scoring itself is still
-- never done client-side regardless.
drop policy if exists "tests_select_all" on public.tests;
create policy "tests_select_all" on public.tests
  for select
  to anon, authenticated
  using (true);

-- candidates: anon may create a candidate row (start of the flow). Only an
-- authenticated (admin) user may read candidate data. No update/delete for anon.
drop policy if exists "candidates_insert_anon" on public.candidates;
create policy "candidates_insert_anon" on public.candidates
  for insert
  to anon
  with check (true);

drop policy if exists "candidates_select_authenticated" on public.candidates;
create policy "candidates_select_authenticated" on public.candidates
  for select
  to authenticated
  using (true);

-- sessions: anon may create a session (their own attempt) and may update it
-- while still in_progress (e.g. autosave from the browser, if ever added).
-- There is no candidate auth, so the session UUID itself acts as a bearer
-- secret - it is never listable by anon (no anon select policy exists), it is
-- only reachable if you already hold the id (as returned at creation time).
-- Only an authenticated (admin) user may read across all sessions.
drop policy if exists "sessions_insert_anon" on public.sessions;
create policy "sessions_insert_anon" on public.sessions
  for insert
  to anon
  with check (true);

drop policy if exists "sessions_update_anon_in_progress" on public.sessions;
create policy "sessions_update_anon_in_progress" on public.sessions
  for update
  to anon
  using (status = 'in_progress')
  with check (true);

drop policy if exists "sessions_select_authenticated" on public.sessions;
create policy "sessions_select_authenticated" on public.sessions
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Column-level grants (defense in depth on top of RLS).
-- Even though the app always writes scores via the service-role key from a
-- trusted server action, we additionally revoke the ability for the anon key
-- to ever write scores/flags/recommendation directly, so a candidate can never
-- forge their own result by calling the Supabase REST API directly with the
-- anon key. Anon may only ever touch answers/status/submitted_at on sessions.
-- ---------------------------------------------------------------------------
revoke update on public.sessions from anon;
grant update (answers, status, submitted_at) on public.sessions to anon;

revoke all on public.candidates from anon;
grant insert on public.candidates to anon;

revoke all on public.tests from anon;
grant select on public.tests to anon;

-- authenticated (admin) role keeps full select access; writes to tests/
-- candidates/sessions from the admin UI are not part of this MVP, so no
-- additional grants are required beyond the default authenticated select.

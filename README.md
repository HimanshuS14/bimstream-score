# BIMstream SCORE — Recruitment Assessment Tool

**BIMstream SCORE** (**S**ituational **C**ompetency & **O**rganizational **R**eadiness
**E**valuation) is a production-ready Next.js (App Router, TypeScript) application, backed by
Supabase, that runs two role-fit assessments for a BIM coordination studio. Both are **100%
situational-judgment instruments** (no technical/analytical MCQ section - technical/software
skill is assessed separately, by a dedicated technical test and the Personal Interview):

- **Modeler / Senior Modeler** (`/take/modeler`) - 30 situational-judgment questions (30 minutes).
- **Assistant Manager / Manager** (`/take/leadership`) - 30 situational-judgment questions
  (30 minutes).

Every question is scored across **7 behavioral trait dimensions**: Leadership & Decision-Making
(LD), Team Play (TP), Communication (CM), Problem-Solving (PS), Dispute Resolution (DR),
Organizational Mindset (OM), and Ethics & Integrity (ET) - see `content/traits.json`. Each test
rolls these up into its own primary composite score: **Team & Delivery Fit** for the Modeler test,
**Leadership Readiness** for the Leadership test (formulas in `content/scoring-methodology.md` and
`lib/scoring.ts`).

Candidates take the test anonymously via a link; scoring and role-fit recommendations are computed
**server-side only** (never trusting a client-submitted score) and reviewed by admins signed in
through Supabase Auth.

Since the same 30-question bank is reused across many candidates over time, **question order and
option order are shuffled per candidate** as an anti-cheating measure: on `/take/<test>/<sessionId>`,
both the order questions are presented in and the order each question's options are presented in
are deterministically shuffled using a seeded PRNG keyed off the session's UUID (see
`lib/shuffle.ts`, used by `TestRunner.tsx`). This means a candidate reloading the page mid-test
always sees their own questions/options in the same order, but two different candidates (different
session ids) get different orders, so "pick the 3rd option" style notes don't transfer between
candidates. The candidate's selection is always recorded against the option's *original* schema
index (never its shuffled display position), so this is purely a presentation change - scoring
(`lib/scoring.ts`) re-fetches the authoritative schema server-side and is completely unaffected.

## Branding

Every test schema (`content/modeler-test.json`, `content/leadership-test.json`) carries two
platform-level fields in addition to its own `title`:

- `program`: `"BIMstream SCORE"` - the platform/product name shown across the app's headers.
- `programFullName`: `"Situational Competency & Organizational Readiness Evaluation"` - the
  tagline/expansion, used under the logo on the landing page and as a subtitle on the test intro
  page.

`title` stays test-specific (e.g. `"SCORE — Modeler / Senior Modeler Assessment"`) and is what's
shown on that test's own pages - never a hardcoded generic string. `lib/types.ts`'s `TestSchema`
type includes both `program` and `programFullName`.

The BIMstream mark is `public/logo-mark.svg` - a hexagon construction (outer hexagon perimeter,
two internal vertical chords splitting the left/right tip triangles, plus a horizontal line and
two diagonals crossing through the center) matching the real BIMstream icon geometry. The
"BIMstream" wordmark is **not** baked into an SVG: `components/Logo.tsx` renders it as real
HTML/CSS text (`<span className="font-bold">BIM</span><span className="font-medium">stream</span>`)
next to the icon, styled with `color: currentColor` and the `--font-brand` font (see "Design
system" below). This means the wordmark always matches the surrounding text color - light header,
dark header, hover states, anything - instead of being locked to whatever fill color was baked into
an SVG `<text>` element, and it never depends on a font being embedded in the SVG itself.
`components/Logo.tsx` wraps the icon (+ wordmark, for `variant="full"`) as one component
(`variant="full" | "mark"`, icon-only, used where space is tight, e.g. the sticky test-runner
header and the admin nav). The favicon is generated from `logo-mark.svg`: `app/icon.svg` (Next.js
App Router's file-based favicon convention, a square version with a white rounded-square background
so the mark stays visible in dark browser chrome) and `app/favicon.ico` (a multi-resolution .ico
fallback for older browsers), both regenerated from the same mark - not a leftover default Next.js
icon.

## Design system

The UI follows a Material Design 3–inspired treatment, defined once in `app/globals.css`:

- **Tokens**: a refined neutral surface palette (`--md-surface`, `--md-surface-variant`,
  `--md-outline`, ...), a single accent color (`--md-primary: #1a73e8`, a Google-blue-esque blue
  used sparingly for primary actions/links/focus rings), semantic success/warning/error colors,
  a 3-level elevation system (`--elevation-1/2/3`, layered shadows rather than flat drop-shadows),
  and a consistent radius scale (`--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`).
- **Components**: reusable classes (`.btn`/`.btn-primary`/`.btn-outline`, `.input`, `.surface-card`,
  `.option-card` for SJT answer choices, `.progress-track`/`.progress-fill`, `.badge-*`) give
  buttons, inputs, the SJT option cards, progress bars, and recommendation-band/ethics-flag badges
  consistent hover/focus/active/disabled states across every page.
- **Icons**: [`lucide-react`](https://lucide.dev) is used selectively (timer icon on the countdown,
  check/warning/flag icons on recommendation bands and ethics flags, arrow icons on primary
  actions) rather than everywhere.
- **Typography**: ships by default with a carefully tuned system font stack
  (`--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
  sans-serif` in `globals.css`, with deliberate letter-spacing/line-height/weight choices) rather
  than `next/font/google` Inter. This is a deliberate choice, not an oversight: `next/font/google`
  fetches font files from Google Fonts **at `next build` time** and hard-fails the *entire* build
  (not a soft warning) if that fetch can't complete - which reliably happens in network-isolated
  CI/build sandboxes (this repo was verified with `npm run build` in exactly such a sandbox, and
  confirmed `next/font/google` with Inter fails there with `Failed to fetch \`Inter\` from Google
  Fonts`). Shipping the system stack by default means `npm run build` succeeds everywhere,
  including offline/restricted CI, with no surprise failures.

  On Vercel (which has outbound internet access during builds) you can switch to real
  self-hosted Inter in a couple of lines - in `app/layout.tsx`:

  ```tsx
  import { Inter } from "next/font/google";
  const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
  // ...
  <html lang="en" className={`h-full antialiased ${inter.variable}`}>
  ```

  `globals.css` already reads typography from the `--font-sans` custom property, so this is the
  only change needed - no other file changes required.

  The same tradeoff applies to the **brand wordmark font** used only by "BIMstream" in
  `components/Logo.tsx`. The real logo's wordmark is a clean geometric sans - bold "BIM", a
  lighter/regular "stream" in the same family - and [Poppins](https://fonts.google.com/specimen/Poppins)
  is the closest widely-available Google Font match (rounded terminals, single-story lowercase
  "a", geometric proportions). `app/layout.tsx` ships with `next/font/google` Poppins commented out
  for the exact same reason as Inter above (verified failing the same way in this sandbox), and
  `globals.css` defines `--font-brand: "Poppins", "Century Gothic", "Futura", -apple-system,
  "Segoe UI", sans-serif` so the wordmark still renders with a reasonable geometric-sans
  approximation when Poppins isn't available. On Vercel, uncomment the Poppins import/instantiation
  in `app/layout.tsx` (weights `500` and `700`, matching the "stream"/"BIM" weights) and add
  `poppins.variable` to the `<html>` className next to `inter.variable` - no other file changes
  required, same as Inter.

None of this changes any business logic, scoring, routes, or data model - it is a
styling/presentation-layer pass only.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project.
2. Note your **Project URL** and **anon public key** (Project Settings → API).
3. Note your **service_role key** from the same page (Project Settings → API → `service_role`
   secret). **Never expose this key to the browser** - it is only used server-side.

## 2. Run the migration + seed SQL

The schema lives in `supabase/migrations/0001_init.sql` and the question-bank seed data lives in
`supabase/seed.sql` (it embeds the real content of `content/modeler-test.json` and
`content/leadership-test.json` verbatim as jsonb).

**Option A - Supabase SQL Editor (simplest, works for any hosted project):**

1. Open your project → SQL Editor → New query.
2. Paste the entire contents of `supabase/migrations/0001_init.sql`, run it.
3. Paste the entire contents of `supabase/seed.sql`, run it.

**Option B - Supabase CLI:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push               # applies supabase/migrations/0001_init.sql
psql "$(supabase db url)" -f supabase/seed.sql   # or paste seed.sql in the SQL editor
```

Re-running `seed.sql` is safe - it upserts the two `tests` rows on conflict.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` for local development:

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where it's used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server (RLS-scoped) | No (but treat carefully) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only - scoring engine | **Yes, keep secret** |

For production, set the same three variables in **Vercel → Project → Settings → Environment
Variables** (Production and Preview environments).

## 4. Create the first admin user

The `/admin` dashboard is gated behind Supabase Auth (email/password). There is no public sign-up
flow by design - create the first reviewer account directly in Supabase:

**Option A - Dashboard:** Authentication → Users → Add user → set email + password → make sure
"Auto Confirm User" is checked (or confirm via the emailed link).

**Option B - SQL** (Supabase's `auth.users` table needs the `auth` schema helper, so the dashboard
method above is simpler and recommended). Alternatively, use the Supabase CLI/Admin API:

```bash
curl -X POST 'https://YOUR-PROJECT-REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR-SERVICE-ROLE-KEY" \
  -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewer@yourstudio.com","password":"a-strong-password","email_confirm":true}'
```

Any additional reviewers can be added the same way. There is no in-app admin user management UI in
this MVP - add/remove reviewers directly in Supabase.

## 5. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 6. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, "Add New… → Project" → import the GitHub repo.
3. Framework preset: Next.js (auto-detected).
4. Add the three environment variables from step 3 under Project Settings → Environment Variables.
5. Deploy. Vercel will run `npm run build` automatically.

## 7. Send a candidate their test link

Once deployed, share:

- `https://yourapp.vercel.app/take/modeler` for Modeler / Senior Modeler candidates.
- `https://yourapp.vercel.app/take/leadership` for Assistant Manager / Manager candidates.

The candidate enters their name + email, the app creates a `candidates` row and an `in_progress`
`sessions` row, and redirects them into the timed test at
`/take/[testId]/[sessionId]`. On submit (or when the timer hits zero), the server recomputes their
score from scratch and the candidate sees a simple "thank you" confirmation - never their own
score, flags, or recommendation.

## Architecture / design decisions

- **Question bank as JSON, not deep relational tables.** `tests.schema` (jsonb) stores the entire
  section/question/option/trait-delta structure from `content/*.json` verbatim. This keeps the
  schema simple and means adding/editing questions is just editing JSON and re-running
  `supabase/seed.sql` - no migrations needed for content changes.
- **Scoring is 100% server-side.** `lib/scoring.ts` implements `content/scoring-methodology.md`
  exactly: per-trait normalization across all 7 dimensions using the min/max achievable delta
  *only over questions where that trait has a nonzero delta on at least one option* (this is fully
  dynamic - nothing is hardcoded to "30 questions" or a fixed per-trait quota); verbatim
  ethics-flag capture (a flag can appear on any question, not just the dedicated Ethics ones);
  and per-test-type composite scores (Team & Delivery Fit for Modeler, Leadership Readiness for
  Leadership) and recommendation bands. It runs only inside the `submitSession` Server Action
  (`lib/actions/session.ts`), which uses the **service-role** Supabase client to re-fetch the
  authoritative test schema and recompute from the candidate's raw selected option indices - a
  candidate can never submit a forged score.
- **"Session UUID as bearer secret."** There is no candidate authentication. `sessions.id` (a
  random UUID) doubles as the only credential a candidate holds. RLS on `sessions` has **no** anon
  `SELECT` policy at all, so a session row can never be listed or read back by the anon key - it
  can only be inserted (once) and updated (while `status = 'in_progress'`). Only an authenticated
  Supabase user (an admin who signed in via `/admin/login`) can `SELECT` across `candidates` and
  `sessions`.
- **Column-level grants as defense-in-depth.** Even though the real scoring write goes through the
  service-role key (which bypasses RLS/grants entirely), the migration additionally revokes the
  anon role's ability to write `scores` / `flags` / `recommendation` on `sessions` at all
  (`grant update (answers, status, submitted_at) on sessions to anon`). So even if someone called
  the Supabase REST API directly with the public anon key, they could not forge their own result.
- **Ethics flag severity.** `scoring-methodology.md` distinguishes "critical" ethics_concern flags
  (falsifying hours, hiding errors, complying with fraud) from a hypothetical "non-critical" flag
  for the Conditional band, but the JSON schema only has a single `flag: "ethics_concern"` tag with
  no severity sub-field, and every flagged option in both question banks matches the explicitly
  "critical" categories. This implementation therefore treats **every** ethics_concern flag as
  critical: any flag forces "Not Recommended" + "Manual review recommended" for both tests. If you
  later want a genuinely non-critical flag tier, add a `severity` field to the option JSON and
  branch on it in `lib/scoring.ts` (`hasCriticalFlag`).
- **One option per SJT question.** Although the content notes "multiple answers can be correct"
  (i.e. no single right answer), the UI enforces exactly one radio-button selection per situational
  question - the whole point is that the single choice reveals the candidate's tendency, not a
  best-effort combination. (Options render as clean selectable "cards" - see `.option-card` in
  `app/globals.css` - instead of bare browser radio buttons, for a better hit target across a
  30-question test.)
- **Single scrollable test page**, not one-question-at-a-time, with a sticky header showing a live
  countdown and progress bar, prioritizing being able to skim/revisit earlier answers before
  submitting - trades off a slightly longer initial page load for clarity.
- **Auto-submit on timeout** is implemented as a client-side countdown that calls the same
  `su
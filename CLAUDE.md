# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test:e2e     # Build + run Playwright E2E tests
npm run test:api     # Build + run Playwright API tests
```

Tests run against a production build on port 3100. To run a single test file:
```bash
npx playwright test tests/e2e/forms.spec.ts
```

## Architecture

**Next.js 16 App Router** with TypeScript, Supabase (PostgreSQL), TailwindCSS v4, and Sentry.

### Route Groups

- `src/app/(site)/` — Public website (route group, no URL prefix)
- `src/app/admin/` — Admin dashboard; `login/` is public, `(shell)/` routes are protected
- `src/app/api/` — REST API endpoints

### Auth Flow

- Middleware in `src/proxy.ts` guards all `/admin/*` routes using JWT cookies
- API endpoints call `requireAdminApi()` from `src/lib/api-auth.ts`
- Tokens signed with `ADMIN_JWT_SECRET`, admin login uses `ADMIN_PASSWORD`

### Data Access

- `src/lib/supabase.ts` — Client-side Supabase client + shared TypeScript types
- `src/lib/supabase-admin.ts` — Server-side admin client (uses `SUPABASE_SERVICE_ROLE_KEY`)
- Use the admin client in API routes and Server Components that need elevated privileges

### Live Match Center

The live match feature (`src/components/MatchCenterClient.tsx`) polls for real-time updates. Match state is tracked via `status` (scheduled|live|finished), `live_phase`, `live_minute`, and a server-maintained clock (`live_clock_running`, `live_clock_started_at`, `live_clock_accumulated_seconds`). Logic for clock management lives in `src/lib/live-clock.ts`.

### Database Schema

Key tables in Supabase (full schema in `supabase-schema.sql`):
- `articles` — News posts (category: KAMP|KLUB|UNGDOM)
- `matches` — Schedule + live match state
- `match_events` — Goals, cards, substitutions
- `match_lineups` — Starting XI and bench (stored as JSONB)
- `players` — First team roster (position: MÅLMÆND|FORSVAR|MIDTBANE|ANGREB)
- `standings` — League table
- `contact_submissions`, `volunteer_submissions`, `membership_submissions` — Form inboxes (status: new|handled)

### Path Alias

`@/*` maps to `src/*`.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
ADMIN_JWT_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_PLAUSIBLE_DOMAIN
NEXT_PUBLIC_SENTRY_DSN
```

# Utopians Core

A tutoring marketplace built with Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase. Students discover mentors and book sessions; teachers manage availability and incoming requests. Live sessions use browser WebRTC with Supabase Realtime signaling.

## Run locally

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, anonymous key, and server-only service-role key.
3. Apply the SQL files in `supabase/migrations/` in filename order to a new Supabase project. Do not use `reset_database.sql` on a database you want to keep.
4. Enable email/password authentication in Supabase. Add `http://localhost:3000/auth/callback` and the production callback URL to the allowed redirect URLs if email confirmation is enabled.
5. Run `npm run dev` and open `http://localhost:3000`.

Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable.

## Routes

- `/`: choose the student or teacher portal.
- `/student/login`, `/student/signup`: the only student authentication screens.
- `/teacher/login`, `/teacher/signup`: the only teacher authentication screens.
- `/student/dashboard`, `/student/discover`, `/student/history`, `/student/mentors/[id]`: student workspace.
- `/teacher/dashboard`, `/teacher/availability`, `/teacher/history`, `/teacher/profile/settings`: teacher workspace.
- `/session/[id]`, `/session/[id]/review`: shared session and feedback screens.
- `/for-students`, `/for-teachers`: role-specific guides.
- `/api/auth`: the single email/password login and registration endpoint.
- `/auth/callback`: exchanges email-confirmation auth codes.

Old `/students`, `/teachers`, role root URLs, `/teacher/edit-profile`, and UUID teacher-profile URLs redirect through `next.config.ts`. They do not render additional pages. Google login is not advertised because it is not enabled in the connected Supabase project.

## Authentication

The server validates credentials and the stored profile role before returning a dashboard destination. Supabase cookies are preserved across proxy redirects. Client auth context synchronizes profile state without issuing requests inside the auth callback lock. Wrong-role login does not reveal the other account's profile. Session-management APIs authenticate the caller separately from page-level route protection.

## Checks

- `npm run lint`
- `npm test`: isolated route, form, and authentication regression tests; no external accounts are created.
- `npm run build`
- Optional live integration test: start the production build on port 3007 and run `node --env-file=.env.local scripts/verify-auth.mjs`. This explicitly creates and cleans up two disposable Supabase accounts. Set `AUTH_TEST_ORIGIN` to check another deployment.

## Deploy

The GitHub repository is connected to the Vercel project `utopians1/utopians-core`. Pushing `main` triggers production deployment. Configure the three variables from `.env.example` in Vercel and keep Supabase redirect URLs aligned with the production domain.

## Source layout

- `src/app`: route pages, route handlers, global styles, and error/loading screens.
- `src/components/features`: shared auth form, portal guide, and session rating dialog.
- `src/components/layout`: role-specific workspace navigation.
- `src/context`: client authentication state.
- `src/lib/supabase`: browser and server Supabase clients.
- `src/types`: shared database types.
- `supabase/migrations`: schema, row-level policies, storage, and realtime setup.

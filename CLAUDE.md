# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**No application code exists yet.** This repository currently holds only two files:

- `claude-code-prompt.md` — the **authoritative build spec** for the app. Read it in full before doing any implementation work; it defines the data model, screen layout, API contracts, and a phased implementation plan.
- `preview-main-v4.html` — a self-contained **design reference** (static HTML/CSS mockup of the main screen). The real UI should match this layout, colors, spacing, and component structure as closely as possible.

When asked to build the project, follow Phase 1 → 2 → 3 in `claude-code-prompt.md` in order. The spec instructs: ask when blocked, do not guess.

## What is being built

**RE:LAY** — a mobile-first web app for a 119 emergency call center (~120 staff in three roles: 접수/관제/보고). Staff type work know-how ("tacit knowledge") in free-form Korean; Gemini structures it into a title, summary, tags, and categories.

## Planned stack & commands

The spec mandates **Vite + React + TypeScript + Tailwind CSS**, Supabase (PostgreSQL) backend, deployed on Vercel. Once the Vite project is scaffolded, the standard commands apply (`npm run dev`, `npm run build`, `npm run preview`). No test setup is specified — do not assume one exists.

The mockup uses Pretendard via CDN and a fixed color token set — both must be ported into `tailwind.config` (token list is in the spec's "디자인 시스템" section).

## Architecture — the non-obvious parts

These cross-cutting rules are easy to get wrong; the full SQL and prompt text live in `claude-code-prompt.md`.

- **AI dynamic categories.** Categories are not a fixed enum. Before each Gemini call, query the existing `categories` table and inject the list into the prompt so the AI reuses an existing category when one fits, or coins a new 2–4 char Korean noun otherwise. On post creation, increment `post_count` for matched categories or `INSERT` new ones. A category created within the last 24h renders a `NEW` badge.

- **The 🌉 "bridge" concept.** A reaction is a "bridge" when the reacting user's `role` differs from the post's `author_role` (cross-role knowledge transfer). This is detected by a `BEFORE INSERT` Postgres trigger (`check_bridge_reaction`), which sets `reactions.is_bridge` and bumps `posts.bridge_count`. Do not compute this in the frontend.

- **Reaction integrity.** One user may give at most one of each reaction type per post (`UNIQUE(post_id, user_id, type)`). ⭐ and ✅ can coexist; pressing ❓ must first `DELETE` any existing ⭐ for that user/post (handled in the frontend, before the ❓ insert). Reaction writes are also toggles — pressing an existing reaction removes it.

- **Denormalized counters.** `posts.star_count / verified_count / question_count / bridge_count` and `users.total_*` are maintained alongside reaction inserts/deletes (bridge_count via the trigger above). Keep them in sync on every reaction change.

- **`ai_result` JSONB.** The whole Gemini JSON response (title, summary, categories, category_emojis, tags, is_new_category) is stored verbatim in `posts.ai_result`. The `post_categories` join table is the normalized source for category filtering/counts.

- **No auth in the MVP.** First visit shows a name + role modal; the resulting `user_id` is kept in `localStorage`. Supabase RLS is intentionally **disabled** for the MVP.

- **No ranking by design.** The "내 성장" section deliberately shows "N명에게 도움" (distinct users helped) instead of a leaderboard, to avoid fostering competition.

## Conventions & gotchas

- Use **optimistic UI updates** for reactions — reflect the change before the API responds.
- Use `100dvh` (not `100vh`) for full-height layouts due to mobile Safari.
- Gemini is called via a Vercel serverless function (`api/structure.ts`, route `/api/structure`) so the key stays server-side; env var `GEMINI_API_KEY` (no `VITE_` prefix). Model `gemini-2.5-flash`, `temperature 0.3`, `responseMimeType: "application/json"`. In local dev a Vite middleware plugin (`vite.config.ts`) serves the same `/api/structure` route so `npm run dev` works without the Vercel CLI.
- Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) belong in `.env.local`, never committed; register them as Vercel env vars.
- Seed Supabase with the dummy data described in the spec so demos are not empty (3 users, ~10 posts, 6–8 categories, reactions, 1 notice, 1 weekly topic).

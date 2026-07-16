# Guiding Mentor — Clean-Slate Rebuild Plan

This is a full re-architecture. The current app is an LMS with wellness bolted on; the brief inverts that. I will delete the existing routes, reset the schema, and rebuild in 7 reviewable phases, stopping after each.

## Non-negotiables baked into every phase
- No red, no leaderboards, no streak-shaming, no peer comparison.
- Palette: `--ink #1B2430`, `--paper #FBF7F2`, `--surface #FFFFFF`, `--sage #4F7C6D`, `--sage-soft #E3EFE9`, `--dusk #5B5BD6`, `--apricot #E8A33D`, `--slate #8A94A6`. Dark mode required.
- Type: Fraunces (headings, 500–600 only) + Inter Tight (body). Loaded via `<link>` in root head — not CSS `@import`.
- Radius 16/12/999, soft shadows, 180ms ease-out transitions, respect `prefers-reduced-motion`.
- Buddy the owl only on wellness surfaces; never in Learn/Focus/Admin.
- Parent RLS boundary is load-bearing: parents cannot read `journal_entries` or `mood_checkins` rows — enforced in policies, not UI.

## Phase 1 — Foundation
- Reset schema: drop the LMS-heavy tables (classes/chapters/subjects/assignments/assessments-as-LMS, class_progress, pomodoro_sessions repurposed, etc.) and rebuild the data model in the brief.
- Create tables (all RLS-on, GRANTs in same migration): `profiles` (with cohort_id, class_level, quiet hours, consent, timezone, opt-ins), `user_roles` (restrictive no-self-escalate), `cohorts`, `parent_links`, `meditation_tracks`, `affirmations`, `journal_entries` (is_private default true, shared_with_mentor_id), `mood_checkins`, `breathing_sessions`, `sleep_logs`, `focus_sessions`, `todos`, `ambient_tracks`, `assessments`, `assessment_responses`, `wellness_scores` (service-role write only), `agent_events`, `nudges`, `live_sessions`, `session_attendance`, `mentors`, `mentor_availability`, `bookings`, `mentor_messages`, `reminder_rules`, `reminder_log`, `announcements`.
- Rewrite `src/styles.css` with the dawn palette + Fraunces/Inter Tight tokens; load fonts via `<link>` in `__root.tsx`. Add dark mode via `@custom-variant`.
- Build `<WellnessRing />` once (SVG, four arcs Focus/Rest/Reflection/Connection, non-monotonic, breathes when balanced, reduced-motion aware).
- Two shells: student (bottom tabs Home/Practice/Focus/Learn/Me) and admin (dense sidebar, no Buddy). `/admin-login` branded page (same Supabase auth, rejects non-admin/counsellor via `has_role`).
- Onboarding flow: exam track, class level, baseline assessment (validated-style stress/sleep/focus/mood), parental consent capture (`parental_consent_at/by`), transparency screen ("who sees what").

## Phase 2 — The core loop (the demo)
Practice tab, built beautifully:
- Guided meditations (morning/evening, coach-recorded audio URL), player with soft bloom on completion.
- Affirmations (short cards, mark as spoken).
- Journal — private vault by default, per-entry mentor share toggle, warm empty state.
- Mood check-in (1–5 + energy + tags).
- Breathe (box / 4-7-8 / coherent animations).
- Home hero: WellnessRing + Buddy + today's four core prompts + concern grid.

## Phase 3 — Add-ons
- Focus timer (5/25/45/90/custom) with **enforced non-skippable break** offering 2-min breathe/stretch; logs breaks + interruptions.
- Ambient audio picker (plain "calm ambient audio" copy, no health claims).
- To-do list.
- Learn tab: upcoming live sessions (Zoom URL), past recordings appearing after session, minimal.

## Phase 4 — Wellness Agent
- **Supabase Edge Function** on `pg_cron` (not a TanStack route — the brief is explicit; service-role reads have failed before here). Verify with a live query that the function reads rows before wiring UI.
- Job A nightly 21:30 IST: compute Focus/Rest/Reflection/Connection sub-scores. Focus is **non-monotonic** — falls above ~10h/day sustained. Composite weights Rest 0.30, Focus 0.25, Reflection 0.25, Connection 0.20.
- Risk bands from pattern rules (low mood streak, 4-day silence, focus↑/rest↓, <5h sleep 3x, break-skip >70%, composite drop >20). Store `reasons[]` in plain English.
- Job B 21:45 IST: Anthropic API (needs `ANTHROPIC_API_KEY` secret — I'll request it when we reach this phase; Buddy system prompt verbatim, 2 sentences, 1/24h, quiet-hours aware).
- Job C Sunday 19:00 IST: weekly recap card + email.
- In-app nudge card on Home under Buddy (soft dismissible, not toast/modal).
- Safety: crisis-signal check on journal/mood save → helpline card (Tele-MANAS 14416, Kiran 1800-599-0019), `crisis_flag` event, pin to admin top.

## Phase 5 — Admin
- Overview: cohort distribution, crisis flags pinned, needs-attention list with agent's reason, **Burnout Scatter** (engagement × wellness).
- Students 360°: ring over time, mood trend, habit consistency, baseline→now deltas, full `agent_events` timeline, bookings. Counsellors see raw journal only if student explicitly shared.
- Agent control room: thresholds, quiet hours, nudge log, one-off send, dry-run any rule.
- Content CRUD, mentors, announcements, flagged-journal queue.

## Phase 6 — Transformation Report
- Student's own arc view on `/me`.
- Parent-facing arc-only report (printable): consistency counts, mood trend direction, focus/calm improvement, baseline→checkpoint→outcome deltas, warm coach note. **No raw journal text, no daily moods** — RLS enforced.
- Checkpoint + outcome assessment flows using same baseline questions.

## Phase 7 — Channels
- Native email nudges + weekly recap.
- Twilio WhatsApp adapter `sendWhatsApp(to, body)`. Until Twilio connector linked, log `status: 'stubbed'` — never fake sends.

## Delivery
Reply **"go phase 1"** to start. I will delete the existing app scaffolding, run the schema reset migration, and rebuild the shells + WellnessRing + onboarding, then stop and show you.

One flag: the brief says Anthropic for nudges. Lovable AI Gateway does not carry Anthropic — I can either (a) add `ANTHROPIC_API_KEY` as a user-provided secret when we reach Phase 4, or (b) use `google/gemini-2.5-flash` through Lovable AI (no key, no cost surprise). Tell me which at Phase 4; either works with the same Buddy system prompt.

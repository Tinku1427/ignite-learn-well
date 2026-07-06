
# Guiding Mentor — v1 Build Plan

A wellness + LMS platform for JEE/NEET aspirants, with a Student panel and an Admin panel. WhatsApp sending is stubbed (reminder engine, admin config, and delivery log UI all built; no external send). Recorded classes are embedded YouTube/Vimeo URLs.

## Design system

- Calming palette (oklch tokens in `src/styles.css`): teal/indigo primary, warm coral accent, soft neutrals, generous rounding.
- Typography: Figtree (body) + Outfit (display) via `@fontsource`.
- Mobile-first layouts, soft rounded cards, subtle shadows, no harsh reds (destructive muted).
- Single semantic token set — no hardcoded colors in components.

## Backend (Lovable Cloud / Supabase)

Enable Cloud, then create schema + RLS + GRANTs in one migration.

Tables:
- `profiles` (id → auth.users, name, phone, exam JEE/NEET, target_year, daily_goal_hours, break_pref, whatsapp_opt_in, onboarded_at)
- `app_role` enum (`student`, `admin`, `mentor`) + `user_roles` + `has_role()` SECURITY DEFINER
- `subjects`, `chapters`
- `classes` (subject, chapter, title, video_url, attachments[], duration_min, published)
- `class_progress` (user, class, watched_seconds, completed_at)
- `assignments` (subject, chapter, title, instructions, due_at, attachment_url)
- `assignment_submissions` (assignment, user, file_url / text, status, grade, feedback, submitted_at)
- `pomodoro_sessions` (user, duration_min, completed_at)
- `journal_entries` (user, date, prompt_response) — private, admin sees completion only
- `mood_logs` (user, date, score 1–5)
- `todos` (user, title, done, is_mandatory, source: user/admin, date)
- `meditations` (title, category, audio_url, duration_min, tags[])
- `meditation_plays` (user, meditation, played_at)
- `assessments` (title, questions jsonb) + `assessment_responses` (user, answers, score, interpretation)
- `mentors` (profile fk, bio, specialties) + `mentor_availability` + `bookings` (student, mentor, slot, status, notes)
- `mentor_messages` (thread: student↔mentor, body, sent_at)
- `announcements` (title, body, image_url, cta_url, starts_at, ends_at, active)
- `reminder_rules` (activity type, time_of_day, template, active)
- `reminder_log` (user, rule, channel: whatsapp/in_app, status: queued/sent/failed/stubbed, sent_at, payload)
- `streaks_view` (SQL view: per-user daily completion → streak count)

RLS:
- Students: read/write only own rows for progress/journal/mood/todos/submissions/bookings/messages.
- Admins (`has_role(auth.uid(),'admin')`): full read across, plus content writes.
- Mentors: read assigned students, write bookings/notes.
- Public read on `classes`, `meditations`, `announcements` (published/active) to `authenticated` only (no anon).
- GRANTs on every public.* table per platform rules.

Triggers:
- `on_auth_user_created` → insert profile + default `student` role.
- Post-completion trigger recomputes streak counter.

## Frontend architecture (TanStack Start)

Public:
- `/` marketing landing (calming hero, exam badges, feature strip, CTA to /auth)
- `/auth` sign-in / sign-up with onboarding fields
- `/reset-password`

Authenticated student (`_authenticated/`):
- `/dashboard` — greeting, today's snapshot (study min, pomodoros, assignments due, streak), quick-launch tiles, announcement carousel
- `/classes`, `/classes/$subject`, `/classes/$subject/$chapter`, `/classes/watch/$classId` (embed player + notes + mark complete)
- `/assignments` list + `/assignments/$id` (submit upload/text, see feedback, monthly progress bar)
- `/focus` Pomodoro (5/25/45/90 presets + custom; break screen with ambient audio player + breathing animation; auto-log)
- `/journal` daily prompt (private)
- `/mood` emoji/slider check-in + 30-day trend chart
- `/meditate` library with "recommended today" tag from latest mood
- `/todo` merged admin-mandatory + personal
- `/assessments` list + take + results
- `/mentors` list, availability slots, booking + `/mentors/$id/chat`
- `/support` always-visible urgent contact card
- `/progress` personal analytics + badges

Authenticated admin (`_authenticated/admin/`, gated by `has_role admin`):
- `/admin` overview: active students, completion %, avg mood trend, at-risk list
- `/admin/students`, `/admin/students/$id` full 360° profile
- `/admin/classes` CRUD, `/admin/assignments` CRUD + submission review
- `/admin/meditations` CRUD, `/admin/announcements` CRUD
- `/admin/assessments` CRUD + aggregate results w/ high-stress flagging
- `/admin/mentors` mentor + availability mgmt, bookings view
- `/admin/reminders` rule config + delivery log + manual one-off send (stubbed)
- CSV export per-student / per-batch

Shared:
- `AppShell` with side nav (desktop) / bottom nav (mobile), role-aware links.
- `useCurrentUser` hook + role guard for `/admin/*`.
- All data via `createServerFn` + TanStack Query (`ensureQueryData` in loaders, `useSuspenseQuery` in components); no admin/service-role reads leaked to client.

## Nudge engine (stubbed sending)

- Server fn `evaluateReminders` iterates active `reminder_rules` for the current user, checks whether the mandatory activity is complete today, and inserts `reminder_log` rows with `status='stubbed'` + in-app notification.
- Admin can trigger manual sends → same log path.
- `sendWhatsApp()` is a single function with a TODO for provider — swap later without touching callers.

## Build order (single pass, batched edits)

1. Enable Cloud, apply full migration (schema + roles + RLS + GRANTs + triggers).
2. Design tokens + fonts + AppShell + auth pages + role guard + onboarding.
3. Student: dashboard, classes, assignments, focus timer w/ break, journal, mood, todo, meditate.
4. Assessments + mentors/booking/chat + progress/badges.
5. Admin: overview + students 360 + content CRUD + submissions review + assessments + mentors + announcements.
6. Reminder rules UI + delivery log + manual send + evaluator server fn.
7. SEO metadata per public route, sitemap.xml, robots.txt.
8. Placeholder replacement, mobile pass, security scan.

## Explicit non-goals (v2)

AI chatbot, gamified leaderboard, browser push, parent view, real WhatsApp send.

## Notes for you

- WhatsApp: everything is wired end-to-end except the actual HTTP call. When you pick a provider, we add one function body + one secret.
- Videos: admin pastes YouTube/Vimeo unlisted URLs; player uses an iframe embed.
- Journals stay private; admins only see "completed today" boolean unless the student explicitly flags an entry for mentor review.

This is a large build — expect several minutes of edits. Approve and I'll ship it end to end.

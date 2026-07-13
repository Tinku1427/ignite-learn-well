# Wellness Agent

A background layer that scores each student's mental wellness daily, flags burnout risk, and sends one personalized nudge. Existing features stay untouched.

Shipped in 5 phases. I stop and report after each so you can steer.

---

## Phase 0 — Small fixes (bundled with Phase 1)

- Fix `GOOD AFTERNOON, REVANTHAI` — the greeting concatenates `hello` + name without the comma/space in the uppercase chip. Repair the template.
- Add a **Sleep log** 15-second input on `/mood` (hours + quality 1–5).
- Point the "Sleep trouble" concern card at `/mood#sleep` so it lands on the sleep input.

---

## Phase 1 — Data foundation

New tables (RLS on; students read their own rows; admins read all via `has_role`):

- `sleep_logs` — one row per user per day. Students insert/update their own.
- `wellness_scores` — daily per-student; **service-role writes only**, clients read-only.
- `agent_events` — audit log (`score_computed | nudge_sent | risk_change | crisis_flag`).
- `nudges` — messages the agent has sent; student can mark seen/dismissed.

Extend `profiles` with `quiet_hours_start` (22:30), `quiet_hours_end` (07:00), `agent_enabled` (true).

Deliverable: migration + Sleep UI + greeting fix + concern-card fix.

---

## Phase 2 — Scoring engine

Edge function `wellness-score`, cron **21:30 IST daily**. For each opted-in student, over the last 7 days:

- **Focus** (0.25) — focus sessions, class watch time, on-time assignments. Non-monotonic: penalizes >10h/day sustained.
- **Rest** (0.30, highest weight) — sleep hours+quality, meditations, pomodoro breaks actually taken, longest quiet gap.
- **Reflection** (0.25) — journal entries, mood check-ins.
- **Connection** (0.20) — mentor bookings attended, messages, entries shared with mentors.

`composite` = weighted mean.

`risk_band` is **not** derived from composite alone. Any of these trip amber/watch and push a human-readable string into `reasons[]`:

- mood ≤ 2 on 3+ of last 5 check-ins → **watch**
- zero activity 4+ days after being active → **watch**
- focus hours +40% WoW while rest score falls → **amber**
- sleep < 5h on 3+ nights → **amber**
- >70% pomodoro breaks skipped → **amber**
- journal flagged for mentor → **amber**
- composite drop >20 pts vs last week → **amber**

Writes: one `wellness_scores` + one `agent_events(score_computed)` per student per day; `risk_change` when band flips.

---

## Phase 3 — Nudge engine

Edge function `wellness-nudge`, cron **21:45 IST** (after scoring).

Assembles each student's actual week and calls **Lovable AI (`google/gemini-2.5-flash`)** with the exact Buddy system prompt from your spec (no guilt, no comparison, no "should", rest > grind).

Hard rules:
- 1 nudge per student per 24h.
- Never during quiet hours.
- Every send → row in `nudges` + `agent_events(nudge_sent)` with the triggering reason.

Channels:
- **In-app** — soft dismissible card on `/dashboard` under the Buddy hero (not toast, not modal).
- **Email** — Lovable native email (best-effort, non-blocking).
- **WhatsApp** — `sendWhatsApp()` adapter that logs `status: 'stubbed'` until a key exists. No fake sends.

> Note on model: your spec says Anthropic. Lovable AI has no Anthropic. I'll use `google/gemini-2.5-flash` (fast, cheap, no key needed). Say the word if you'd rather bring your own Anthropic key.

---

## Phase 4 — Safety layer

On every journal save and mood check-in, run a crisis-signal check (self-harm / hopelessness / suicidal ideation — keyword pre-filter + Lovable AI classifier for ambiguous cases).

If triggered:
- Calm in-place card with **Tele-MANAS 14416** and **Kiran 1800-599-0019**. Warm, not scary.
- `agent_events(crisis_flag)` row.
- Student pinned to the top of Admin Overview with a high-priority marker.

Plus a permanent low-key "Need to talk to someone right now?" link in the student footer.

The agent never counsels — it notices and routes to a human.

---

## Phase 5 — Admin Wellness command centre (`/admin/wellness`)

- **Cohort distribution** — green/amber/watch counts + 30-day trend.
- **Needs attention** — ranked list, each row shows the agent's plain-English reason. Crisis flags pinned above everything.
- **The Burnout Scatter** — engagement (x) vs wellness (y). Centrepiece chart; high-effort / low-wellness quadrant is the whole point.
- **Student 360** — wellness ring over time, mood trend, focus/rest balance, full `agent_events` timeline.
- **Agent control room** — edit thresholds & quiet hours, nudge delivery log, one-off nudge send, dry-run any rule against the live cohort.

Admin stays cool and dense — no Buddy, no confetti in admin.

---

## Technical notes

- Scoring & nudge functions run as **service role** to write `wellness_scores` and read across all students. Crisis check runs from the student's own server function using their session.
- `pg_cron` + `pg_net` schedules both edge functions against stable published URLs. Cron SQL runs via `supabase--insert` (not migration), since it holds env-specific URLs.
- Thresholds live in a small `agent_config` table so admins can edit without a code change (added in Phase 5).
- Nothing in existing student features changes behaviour — the new card on `/dashboard` is additive and only appears when a nudge exists.

---

## Delivery order

1. Phase 1 (schema + fixes) → report.
2. Phase 2 (scoring + cron) → report.
3. Phase 3 (nudge + in-app card) → report.
4. Phase 4 (safety) → report.
5. Phase 5 (admin) → report.

Reply "go" to start Phase 1, or tell me what to adjust.
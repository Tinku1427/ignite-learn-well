# Guiding Mind

Guiding Mentor — Lovable Build Prompt

Paste everything below into Lovable as your build prompt. It's organized so you can also trim sections if you want a smaller v1.

1. Product Summary

Build a web application called "Guiding Mentor" — a mental wellness + learning platform for students preparing for JEE and NEET. The platform combines an LMS (recorded classes, assignments) with a daily wellness routine (Pomodoro study timer, journaling, meditation, mood tracking) and a nudging system (WhatsApp/in-app reminders) that keeps students consistent. It has two panels:

Student Panel — where students study, track wellness habits, and submit work.

Admin Panel — where the team uploads content, manages assignments, and monitors every student's academic + wellness engagement.

Reference product for feature inspiration: peakmind.in (mood tracking, assessments, guided meditation, habit challenges, 1:1 counselling booking, chat-based support, engagement analytics for institutions). Build a version of this tailored specifically to JEE/NEET aspirants, merged with an LMS.

2. Tech & Auth Notes

Use Supabase for auth, database, and file storage (Lovable's native integration).

Auth: email + password login and registration. Add a role field (student / admin) on the users table to control panel access and route protection.

Store recorded class videos either as Supabase Storage files or as embedded links (YouTube/Vimeo unlisted) — default to embedded links for v1 to keep storage costs low.

Design for mobile-first responsiveness — most students will use this on a phone between study sessions.

Keep a clean, calming visual identity (soft rounded cards, generous whitespace, a warm/calm color palette — avoid anything visually stressful like harsh reds; use a primary calming color like teal/indigo with a warm accent for CTAs).

3. STUDENT PANEL

3.1 Auth & Onboarding

Register with name, email, password, phone number (for WhatsApp), target exam (JEE / NEET), target year.

Login with registered email + password.

On first login, short onboarding: set a daily study goal (hours), preferred break activity (music / breathing / stretch), and WhatsApp opt-in for reminders.

3.2 Dashboard (Home)

Greeting + today's snapshot: study time logged today, Pomodoro sessions completed, assignments due, streak counter (consecutive days of completing mandatory activities).

Quick-launch tiles: Start Study Timer, Today's To-Do, Daily Journal, Recorded Classes, Assignments.

A rotating announcements/advertisement banner slot (admin-controlled) for promos, upcoming workshops, or offers.

3.3 LMS — Recorded Classes

Library of recorded classes organized by Subject → Chapter → Topic (Physics/Chemistry/Maths for JEE; Physics/Chemistry/Biology for NEET).

Each class card shows thumbnail, duration, "watched / not watched" status, and a progress bar.

Video player page with the video, chapter notes/attachments (PDF download), and a "mark as complete" button.

3.4 Assignments

List of assignments per subject/chapter with due dates and status tags: Not Started / Submitted / Reviewed / Late.

Upload submission (file upload — PDF/image of handwritten work, or text answer).

A visible counter: "You've submitted X out of Y assignments this month" with a simple progress bar, plus per-subject breakdown.

Feedback/grade visible once admin reviews it.

3.5 Pomodoro / Focus Timer

Preset session lengths: 5, 25, 45, 90 minutes (custom duration input also allowed).

Break logic tied to session length:

25 min session → 5 min break

45 min session → 10 min break

90 min session → longer break (e.g., 15–20 min, configurable)

When a break starts, show a prompt: "Take a break — want some relaxation music or a short breathing exercise?" with options to play ambient/relaxation audio (looping tracks: rain, lo-fi, binaural, guided breathing) or skip.

Log every completed session automatically into the student's daily activity (feeds the streak counter and admin analytics).

Optional: a subtle full-screen "focus mode" during the study session (blocks nothing, just visually removes distraction).

3.6 Daily Wellness Routine

Daily Journal: a simple prompt-based entry (e.g., "How did today go? One thing that stressed you, one thing that went well") saved with a timestamp. Private to the student (admin sees completion, not content, unless the student flags for counsellor review).

Mood Tracker: quick daily check-in (emoji scale or 1–5 slider: stressed → calm) logged each day, shown as a simple mood-over-time chart to the student.

Guided Meditation Library: short audio/video sessions (5, 10, 15 min) for breathing, sleep, exam-anxiety, focus. Tag one as "recommended today" based on mood check-in.

To-Do List: student-added tasks plus admin/mentor-assigned mandatory daily activities (e.g., "Complete journal," "10-min meditation," "Watch today's class") shown as checkboxes.

3.7 Reminders & Nudges (WhatsApp + In-App)

If a student hasn't completed a mandatory activity (journal, meditation, study goal) by a set time in the evening, trigger:

An in-app notification banner.

A WhatsApp message via automation, e.g.: "Hi [Name], you haven't done your journal or meditation today. There's still time — just 5 minutes can help. 💙"

Reminder rules should be configurable per activity from the admin side (time of day, message template, which activities trigger a nudge).

3.8 Self-Assessments

Periodic short assessments (exam stress scale, motivation check, sleep quality) — simple multiple-choice forms.

Results shown to the student as a simple score/interpretation, and logged for admin/mentor visibility so they can flag students who may need extra support.

3.9 1:1 Mentor/Counsellor Support

"Book a Session" page — student picks a mentor/counsellor and an available slot; confirmation via WhatsApp/email.

Option to start a chat thread with an assigned mentor for quick questions (can be simple in-app messaging for v1; can integrate live chat later).

A visible, always-accessible "Need to talk to someone now?" support contact option (for students who are struggling and don't want to wait for a scheduled session).

3.10 Progress & Streaks

Personal analytics page: study hours over time, assignments completed, Pomodoro sessions, mood trend, journal/meditation streak.

Simple badges/milestones for streaks (e.g., "7-day journal streak," "50 Pomodoro sessions completed") to keep it motivating without being gimmicky.

4. ADMIN PANEL

4.1 Content Management

Upload/manage recorded classes: add title, subject, chapter, video link, attachments (notes/PDFs), and publish/unpublish.

Manage the guided meditation/relaxation audio library (add/tag/categorize).

Manage announcement/advertisement banners shown on the student dashboard (schedule start/end dates).

4.2 Assignment Management

Create assignments (subject, chapter, due date, instructions, attachment).

Review submissions: view student uploads, grade/mark reviewed, leave feedback.

Bulk view: submission status across all students for a given assignment (submitted / pending / late).

4.3 Student Management & Analytics

Full student directory with filters: active / inactive, by exam (JEE/NEET), by batch/cohort.

Per-student detail view: assignment completion %, class-watch %, study hours, Pomodoro consistency, mood trend, journal/meditation streak, assessment scores — all in one profile so a mentor can see the full picture before a 1:1 session.

Aggregate dashboard: total active students, completion rates across the batch, average mood score trend, "at-risk" flag list (students with dropping engagement or consistently low mood scores) so mentors know who to check in on first.

Export reports (CSV) for a student or batch.

4.4 Reminder & WhatsApp Automation Config

Configure which mandatory activities trigger a WhatsApp nudge, at what time, and the message template.

View delivery logs (sent / delivered / failed) for reminders.

Manually trigger a one-off message to a student or group (e.g., "reminder about tomorrow's mock test").

4.5 Mentor/Counsellor Management

Add mentors/counsellors with their availability slots.

View and manage session bookings; mark sessions completed with private notes.

4.6 Assessment Management

Create/edit self-assessment question sets.

View aggregate results and flag students whose responses indicate high stress for mentor follow-up.

5. Nice-to-Have (v2, mention but don't block v1 on these)

AI chatbot for instant mood check-ins / first-line support (text-based, calming tone, escalates to a human counsellor for anything serious).

Leaderboard/gamification across a batch (optional — some students find this stressful, so make it opt-in).

Push notifications (browser) in addition to WhatsApp.

Parent view (read-only progress summary) — PeakMind offers this to its institutional clients; consider for a future paid tier.

6. Build Priority (suggested order for Lovable)

Auth + role-based routing (student/admin split)

Admin: upload classes + assignments → Student: view classes + submit assignments

Pomodoro timer with break logic + relaxation prompt

Daily journal + mood tracker + to-do list

Admin analytics dashboard (student directory + per-student view)

WhatsApp/reminder automation config + trigger logic

Assessments + 1:1 session booking

Polish: streaks, badges, announcement banners

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ignite-learn-well.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5353825-a476-4a3b-98fc-212c6386b5ad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

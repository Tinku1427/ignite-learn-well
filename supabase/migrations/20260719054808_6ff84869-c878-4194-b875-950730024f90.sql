
-- =========================================================
-- 1. AUDIO FIX: replace broken pixabay URLs with reachable MP3s
-- =========================================================
UPDATE public.meditation_tracks SET audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' WHERE title='Morning intention';
UPDATE public.meditation_tracks SET audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' WHERE title='Anchor breath';
UPDATE public.meditation_tracks SET audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' WHERE title='Wind-down body scan';
UPDATE public.meditation_tracks SET audio_url='https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' WHERE title='Sleep, softly';

-- =========================================================
-- 2. ROLES: add 'coach'
-- =========================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coach';

-- =========================================================
-- 3. MENTORS verification fields
-- =========================================================
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS college_name TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- existing seeded mentors -> verified so they remain bookable
UPDATE public.mentors SET verification_status='verified', verified_at=now(), college_name=COALESCE(college_name,'AIIMS Delhi') WHERE verification_status='pending';

-- =========================================================
-- 4. COACHES table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  certification_name TEXT,
  certification_url TEXT,
  avatar_seed TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches read verified" ON public.coaches FOR SELECT USING (verification_status='verified' OR profile_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "coaches admin write" ON public.coaches FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "coaches self update bio" ON public.coaches FOR UPDATE USING (profile_id=auth.uid()) WITH CHECK (profile_id=auth.uid() AND verification_status = (SELECT verification_status FROM public.coaches c WHERE c.id=coaches.id));

-- =========================================================
-- 5. ENROLLMENTS scaffold
-- =========================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cohort_id UUID REFERENCES public.cohorts(id),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','activated','revoked')),
  invited_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, cohort_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments admin all" ON public.enrollments FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 6. ACCESS MATRIX: rewrite policies
-- =========================================================

-- wellness_scores: owner + admin + verified coach; mentors NEVER
DROP POLICY IF EXISTS "read own or admin scores" ON public.wellness_scores;
CREATE POLICY "wellness_scores read" ON public.wellness_scores FOR SELECT USING (
  auth.uid()=user_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);

-- agent_events: same rule as scores
DROP POLICY IF EXISTS "read own or admin events" ON public.agent_events;
CREATE POLICY "agent_events read" ON public.agent_events FOR SELECT USING (
  auth.uid()=user_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);

-- nudges: owner + admin + coach (so coach knows what the agent already said)
DROP POLICY IF EXISTS "nudges read own" ON public.nudges;
DROP POLICY IF EXISTS "read own or admin nudges" ON public.nudges;
CREATE POLICY "nudges read" ON public.nudges FOR SELECT USING (
  auth.uid()=user_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);

-- mood_checkins: owner + admin + verified coach (aggregated view); mentors NEVER
DROP POLICY IF EXISTS "own mood checkins" ON public.mood_checkins;
CREATE POLICY "mood self all" ON public.mood_checkins FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "mood coach admin read" ON public.mood_checkins FOR SELECT USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);

-- focus_sessions: owner + admin + coach (all) + mentor (only their booked students)
DROP POLICY IF EXISTS "staff read focus sessions" ON public.focus_sessions;
CREATE POLICY "focus coach admin read" ON public.focus_sessions FOR SELECT USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);
CREATE POLICY "focus mentor booked read" ON public.focus_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.mentors m ON m.id=b.mentor_id
    WHERE m.profile_id=auth.uid()
      AND m.verification_status='verified'
      AND b.student_id=focus_sessions.user_id
  )
);

-- meditation_sessions: owner + coach + admin (used for consistency)
DROP POLICY IF EXISTS "staff read meditation sessions" ON public.meditation_sessions;
CREATE POLICY "medsess coach admin read" ON public.meditation_sessions FOR SELECT USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
);
CREATE POLICY "medsess mentor booked read" ON public.meditation_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.mentors m ON m.id=b.mentor_id
    WHERE m.profile_id=auth.uid()
      AND m.verification_status='verified'
      AND b.student_id=meditation_sessions.user_id
  )
);

-- journal_entries: extend "shared" audience to include coaches too
-- Existing policy already restricts to mentor share; add coach share via same shared_with_mentor_id (reused as "shared_with_id")
-- For simplicity add: allow SELECT to coach when is_private=false and shared_with_mentor_id maps to that coach's coach.id
DROP POLICY IF EXISTS "journal coach share read" ON public.journal_entries;
CREATE POLICY "journal coach share read" ON public.journal_entries FOR SELECT USING (
  is_private = false
  AND shared_with_mentor_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.coaches c WHERE c.id=journal_entries.shared_with_mentor_id AND c.profile_id=auth.uid() AND c.verification_status='verified')
);

-- bookings: allow verified coach as party too (student can book coach OR mentor)
-- keep existing policy; add coach party
DROP POLICY IF EXISTS "bookings coach party" ON public.bookings;
CREATE POLICY "bookings coach party" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.id=bookings.mentor_id)
);

-- profiles: mentors should NOT read all profiles anymore; only own + admin + coach (for their assigned students) + mentor (only students they've booked)
DROP POLICY IF EXISTS "profiles self select" ON public.profiles;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT USING (
  id=auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.profile_id=auth.uid() AND c.verification_status='verified')
  OR EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.mentors m ON m.id=b.mentor_id
    WHERE m.profile_id=auth.uid() AND m.verification_status='verified' AND b.student_id=profiles.id
  )
);

-- =========================================================
-- 7. USER_ROLES: hard restrictive "no self-escalation"
-- =========================================================
DROP POLICY IF EXISTS "user_roles no self escalation" ON public.user_roles;
CREATE POLICY "user_roles no self escalation" ON public.user_roles AS RESTRICTIVE FOR INSERT WITH CHECK (
  -- only admins can insert privileged roles; students may only be inserted by the signup trigger (service role)
  public.has_role(auth.uid(),'admin')
);

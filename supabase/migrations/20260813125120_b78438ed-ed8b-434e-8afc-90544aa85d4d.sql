-- caseload helper
CREATE OR REPLACE FUNCTION public.is_my_caseload(_student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid() AND ca.student_id = _student
  )
$$;

-- wellness_scores
DROP POLICY IF EXISTS "wellness_scores read" ON public.wellness_scores;
CREATE POLICY "wellness_scores read" ON public.wellness_scores
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.is_my_caseload(user_id));

-- mood_checkins
DROP POLICY IF EXISTS "mood coach admin read" ON public.mood_checkins;
CREATE POLICY "mood staff read" ON public.mood_checkins
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_my_caseload(user_id));

-- agent_events
DROP POLICY IF EXISTS "agent_events read" ON public.agent_events;
CREATE POLICY "agent_events read" ON public.agent_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.is_my_caseload(user_id));

-- nudges
DROP POLICY IF EXISTS "nudges read" ON public.nudges;
CREATE POLICY "nudges read" ON public.nudges
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.is_my_caseload(user_id));

-- profiles: coach branch scoped to caseload
DROP POLICY IF EXISTS "profiles self select" ON public.profiles;
CREATE POLICY "profiles self select" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_my_caseload(id)
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.mentors m ON m.id = b.mentor_id
    WHERE m.profile_id = auth.uid()
      AND m.verification_status = 'verified'
      AND b.student_id = profiles.id
  )
);

-- mentor-safe trend: direction only, never a number
CREATE OR REPLACE FUNCTION public.student_trend_direction(_student uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE recent numeric; prior numeric; allowed boolean;
BEGIN
  SELECT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_my_caseload(_student)
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.mentors m ON m.id = b.mentor_id
      WHERE m.profile_id = auth.uid()
        AND m.verification_status = 'verified'
        AND b.student_id = _student
    )
  ) INTO allowed;
  IF NOT allowed THEN RETURN NULL; END IF;

  SELECT avg(composite) INTO recent FROM public.wellness_scores
   WHERE user_id = _student AND score_date >= current_date - 3;
  SELECT avg(composite) INTO prior FROM public.wellness_scores
   WHERE user_id = _student AND score_date >= current_date - 10 AND score_date < current_date - 3;

  IF recent IS NULL OR prior IS NULL THEN RETURN 'flat'; END IF;
  IF recent - prior > 3 THEN RETURN 'up'; END IF;
  IF prior - recent > 3 THEN RETURN 'down'; END IF;
  RETURN 'flat';
END;$$;

REVOKE ALL ON FUNCTION public.student_trend_direction(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.student_trend_direction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_caseload(uuid) TO authenticated;

-- suspension (reversible account disable; data preserved)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid;

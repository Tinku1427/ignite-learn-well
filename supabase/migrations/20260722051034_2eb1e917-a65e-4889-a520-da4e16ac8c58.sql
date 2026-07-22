
-- Plan Your Day: single row per (user, date) with an ordered JSON blocks array
CREATE TABLE IF NOT EXISTS public.day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_plans TO authenticated;
GRANT ALL ON public.day_plans TO service_role;
ALTER TABLE public.day_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own day plans" ON public.day_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER day_plans_updated_at BEFORE UPDATE ON public.day_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Coach caseload assignments (explicit scoping — a coach never sees the whole cohort)
CREATE TABLE IF NOT EXISTS public.coach_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_assignments TO authenticated;
GRANT ALL ON public.coach_assignments TO service_role;
ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach reads own caseload" ON public.coach_assignments FOR SELECT
  USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage caseloads" ON public.coach_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Detach any external audio URLs. Player and admin content upload only serve
-- files that live in the meditation-audio storage bucket from now on.
UPDATE public.meditation_tracks
  SET is_published = false
  WHERE audio_url IS NULL
     OR audio_url NOT LIKE '%/storage/v1/object/public/meditation-audio/%';

UPDATE public.ambient_tracks
  SET is_published = false
  WHERE audio_url IS NULL
     OR audio_url NOT LIKE '%/storage/v1/object/public/meditation-audio/%';

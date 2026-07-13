
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_start time NOT NULL DEFAULT '22:30',
  ADD COLUMN IF NOT EXISTS quiet_hours_end time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS agent_enabled boolean NOT NULL DEFAULT true;

-- sleep_logs
CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  hours numeric(4,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  quality smallint NOT NULL CHECK (quality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep read" ON public.sleep_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own sleep write" ON public.sleep_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sleep update" ON public.sleep_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sleep delete" ON public.sleep_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_sleep_updated BEFORE UPDATE ON public.sleep_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- wellness_scores (service-role writes only)
CREATE TABLE public.wellness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  focus_score numeric(5,2) NOT NULL,
  rest_score numeric(5,2) NOT NULL,
  reflection_score numeric(5,2) NOT NULL,
  connection_score numeric(5,2) NOT NULL,
  composite numeric(5,2) NOT NULL,
  risk_band text NOT NULL CHECK (risk_band IN ('green','amber','watch')),
  reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);
GRANT SELECT ON public.wellness_scores TO authenticated;
GRANT ALL ON public.wellness_scores TO service_role;
ALTER TABLE public.wellness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin scores" ON public.wellness_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- agent_events (service-role writes; students read own; admins read all)
CREATE TABLE public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('score_computed','nudge_sent','risk_change','crisis_flag')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_events TO authenticated;
GRANT ALL ON public.agent_events TO service_role;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin events" ON public.agent_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
-- Allow authenticated users to insert their own crisis_flag events (from client crisis check)
CREATE POLICY "self insert own event" ON public.agent_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- nudges
CREATE TABLE public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  tone text,
  source_event_id uuid REFERENCES public.agent_events(id) ON DELETE SET NULL,
  seen_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.nudges TO authenticated;
GRANT ALL ON public.nudges TO service_role;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin nudges" ON public.nudges FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "update own nudge" ON public.nudges FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

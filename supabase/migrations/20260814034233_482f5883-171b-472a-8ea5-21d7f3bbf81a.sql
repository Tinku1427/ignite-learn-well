-- ============ 1. Announcement audience targeting ============
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_audience_chk;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_audience_chk
  CHECK (audience IN ('everyone','students','mentors','coaches','cohort'));

DROP POLICY IF EXISTS "ann read" ON public.announcements;
CREATE POLICY "ann read" ON public.announcements
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    active
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
    AND (
      audience = 'everyone'
      OR (audience = 'students' AND public.has_role(auth.uid(), 'student'::app_role))
      OR (audience = 'mentors'  AND public.has_role(auth.uid(), 'mentor'::app_role))
      OR (audience = 'coaches'  AND (public.has_role(auth.uid(), 'coach'::app_role) OR public.has_role(auth.uid(), 'counsellor'::app_role)))
      OR (audience = 'cohort' AND cohort_id IS NOT NULL
          AND cohort_id = (SELECT p.cohort_id FROM public.profiles p WHERE p.id = auth.uid()))
    )
  )
);

-- ============ 2. Per-person read / dismiss state for broadcasts ============
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reads own" ON public.announcement_reads
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ 3. Direct messages (admin -> one person) ============
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_idx ON public.direct_messages (recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm recipient read" ON public.direct_messages
FOR SELECT TO authenticated
USING (recipient_id = auth.uid() OR sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "dm admin send" ON public.direct_messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "dm recipient mark" ON public.direct_messages
FOR UPDATE TO authenticated
USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- ============ 4. Agent settings (admin editable) ============
CREATE TABLE IF NOT EXISTS public.agent_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT true,
  quiet_start time NOT NULL DEFAULT '22:00',
  quiet_end time NOT NULL DEFAULT '07:00',
  amber_threshold numeric NOT NULL DEFAULT 60,
  watch_threshold numeric NOT NULL DEFAULT 45,
  low_mood_days integer NOT NULL DEFAULT 3,
  silence_days integer NOT NULL DEFAULT 4,
  low_sleep_nights integer NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.agent_settings TO authenticated;
GRANT ALL ON public.agent_settings TO service_role;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent settings admin" ON public.agent_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.agent_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
DROP TRIGGER IF EXISTS agent_settings_updated_at ON public.agent_settings;
CREATE TRIGGER agent_settings_updated_at BEFORE UPDATE ON public.agent_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 5. Scheduler token (backend only, no client access) ============
CREATE TABLE IF NOT EXISTS public.agent_secrets (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  cron_token text NOT NULL
);
GRANT ALL ON public.agent_secrets TO service_role;
ALTER TABLE public.agent_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.agent_secrets (id, cron_token)
VALUES (true, 'f1dc35273b48b8735534349688bc9e31c8e67b2ee3350334')
ON CONFLICT (id) DO UPDATE SET cron_token = EXCLUDED.cron_token;

-- ============ 6. Nightly schedule (21:30 / 21:45 IST = 16:00 / 16:15 UTC) ============
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('gm-agent-score') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gm-agent-score');
SELECT cron.unschedule('gm-agent-nudge') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gm-agent-nudge');

SELECT cron.schedule('gm-agent-score', '0 16 * * *', $cron$
  SELECT net.http_post(
    url := 'https://project--d5353825-a476-4a3b-98fc-212c6386b5ad.lovable.app/api/public/agent/nightly',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-agent-token', (SELECT cron_token FROM public.agent_secrets WHERE id)
    ),
    body := jsonb_build_object('task', 'score')
  );
$cron$);

SELECT cron.schedule('gm-agent-nudge', '15 16 * * *', $cron$
  SELECT net.http_post(
    url := 'https://project--d5353825-a476-4a3b-98fc-212c6386b5ad.lovable.app/api/public/agent/nightly',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-agent-token', (SELECT cron_token FROM public.agent_secrets WHERE id)
    ),
    body := jsonb_build_object('task', 'nudge')
  );
$cron$);
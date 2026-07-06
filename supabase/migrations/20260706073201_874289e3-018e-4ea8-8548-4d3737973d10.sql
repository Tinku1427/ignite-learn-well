
-- 1. has_role: switch to SECURITY INVOKER (user_roles self read policy allows users to see own rows)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- 2. bookings: restrict mentor writes to own bookings
DROP POLICY IF EXISTS "bookings self" ON public.bookings;
CREATE POLICY "bookings student read/write own"
ON public.bookings FOR ALL TO authenticated
USING (
  student_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())
)
WITH CHECK (
  student_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())
);

-- 3. mentor_availability: restrict mentor writes to own slots
DROP POLICY IF EXISTS "avail admin write" ON public.mentor_availability;
CREATE POLICY "avail admin or own mentor write"
ON public.mentor_availability FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())
);

-- 4. mentor_messages: restrict mentor reads to own conversations
DROP POLICY IF EXISTS "msg read" ON public.mentor_messages;
CREATE POLICY "msg read own"
ON public.mentor_messages FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())
);

-- 5. user_roles: explicit deny of self-insert by non-admins (defense in depth).
-- Current 'user_roles admin write' already restricts to admins; make it explicit with a restrictive policy.
DROP POLICY IF EXISTS "user_roles no self escalation" ON public.user_roles;
CREATE POLICY "user_roles no self escalation"
ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

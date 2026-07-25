CREATE OR REPLACE FUNCTION public.find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users
  WHERE lower(email) = lower(_email)
  AND public.has_role(auth.uid(), 'admin'::app_role)
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;
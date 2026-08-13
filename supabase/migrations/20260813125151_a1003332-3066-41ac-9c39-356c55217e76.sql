REVOKE ALL ON FUNCTION public.is_my_caseload(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.student_trend_direction(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_caseload(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_trend_direction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;

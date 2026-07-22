
CREATE POLICY "signed-in can read meditation-audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meditation-audio');

CREATE POLICY "admins upload meditation-audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meditation-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update meditation-audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'meditation-audio' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'meditation-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete meditation-audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meditation-audio' AND public.has_role(auth.uid(), 'admin'));

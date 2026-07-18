-- Tighten journal_entries: strict self-only for ALL, plus narrow mentor-share SELECT.
DROP POLICY IF EXISTS "journal self" ON public.journal_entries;
DROP POLICY IF EXISTS "Mentors read entries shared with them" ON public.journal_entries;

CREATE POLICY "journal owner all"
  ON public.journal_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "journal mentor read shared only"
  ON public.journal_entries FOR SELECT
  USING (
    shared_with_mentor_id IS NOT NULL
    AND is_private = false
    AND EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = journal_entries.shared_with_mentor_id
        AND m.profile_id = auth.uid()
    )
  );

-- Fix the demo profile row directly.
UPDATE public.profiles SET full_name = 'Revanth' WHERE id = '360e29ff-078d-4f58-90a4-be6c40fa51d8';
-- Journal templates
CREATE TABLE public.journal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.journal_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.journal_templates TO authenticated;
GRANT ALL ON public.journal_templates TO service_role;

ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read published templates"
  ON public.journal_templates FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage templates insert"
  ON public.journal_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage templates update"
  ON public.journal_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage templates delete"
  ON public.journal_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER journal_templates_updated_at
  BEFORE UPDATE ON public.journal_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.journal_templates (title, prompt, sort_order) VALUES
  ('Free write', 'Write whatever is on your mind. No structure, no editing.', 1),
  ('Three good things', 'Name three things that went well today, however small. Why did each one matter?', 2),
  ('What I am carrying', 'What are you carrying today that is not yours to carry? What would you put down first?', 3),
  ('Study reflection', 'What did you study today? What felt easy, what felt heavy, and what will you change tomorrow?', 4),
  ('Wind down', 'How does your body feel right now? What is one kind thing you can say to yourself before sleep?', 5);

-- Coach check-in notes
CREATE TABLE public.coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  follow_up_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_notes TO authenticated;
GRANT ALL ON public.coach_notes TO service_role;

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches read their own caseload notes"
  ON public.coach_notes FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches write notes for their caseload"
  ON public.coach_notes FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid() AND public.is_my_caseload(student_id));

CREATE POLICY "Coaches edit their own notes"
  ON public.coach_notes FOR UPDATE TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches delete their own notes"
  ON public.coach_notes FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

CREATE TRIGGER coach_notes_updated_at
  BEFORE UPDATE ON public.coach_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX coach_notes_student_idx ON public.coach_notes (student_id, created_at DESC);
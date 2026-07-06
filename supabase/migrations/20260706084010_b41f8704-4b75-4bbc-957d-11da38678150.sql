
CREATE TABLE public.audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('focus','relax')),
  url text NOT NULL,
  description text,
  license text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audio_tracks TO anon, authenticated;
GRANT ALL ON public.audio_tracks TO service_role;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audio_tracks readable by everyone" ON public.audio_tracks FOR SELECT USING (true);
CREATE POLICY "audio_tracks admin manage" ON public.audio_tracks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.audio_tracks (title, category, url, description, license) VALUES
 ('Lo-fi Study', 'focus', 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_8fdc1e9b7d.mp3?filename=lofi-study-112191.mp3', 'Warm lo-fi beats for study sessions', 'Pixabay'),
 ('Light Rain', 'focus', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8e5fc1a4c.mp3?filename=light-rain-109591.mp3', 'Gentle rain ambience', 'Pixabay'),
 ('Flowing Water', 'focus', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3', 'Flowing water for deep concentration', 'Pixabay'),
 ('Forest Ambience', 'focus', 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_2f8b9c02d1.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3', 'Birds and leaves', 'Pixabay'),
 ('Calm Meditation', 'relax', 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_270f49b83f.mp3?filename=meditation-amp-relaxation-music-22174.mp3', 'Soft pads for winding down', 'Pixabay'),
 ('Ocean Waves', 'relax', 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_ac1bdec4f4.mp3?filename=ocean-waves-112631.mp3', 'Slow ocean waves', 'Pixabay'),
 ('Deep Breath Pad', 'relax', 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_d16737dc28.mp3?filename=relaxing-145038.mp3', 'Ambient pads for breathing', 'Pixabay'),
 ('Soft Piano', 'relax', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1eef.mp3?filename=relaxing-mood-127520.mp3', 'Gentle piano for rest', 'Pixabay');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_focus_track_id uuid REFERENCES public.audio_tracks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_relax_track_id uuid REFERENCES public.audio_tracks(id) ON DELETE SET NULL;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS shared_with_mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS journal_entries_shared_mentor_idx
  ON public.journal_entries(shared_with_mentor_id) WHERE shared_with_mentor_id IS NOT NULL;

CREATE POLICY "Mentors read entries shared with them" ON public.journal_entries FOR SELECT TO authenticated
  USING (
    shared_with_mentor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = shared_with_mentor_id AND m.profile_id = auth.uid()
    )
  );

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS avatar_seed text;

CREATE POLICY "Mentors and admins read submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignments' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'mentor')));

CREATE POLICY "Students upload own submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students read own submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);

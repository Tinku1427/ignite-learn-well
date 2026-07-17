
-- Baseline assessment
INSERT INTO public.assessments (kind, title, questions, is_active)
VALUES (
  'baseline',
  'Where are you today?',
  '[
    {"id":"stress","q":"Right now, how heavy does the load feel?","lo":"Very heavy","hi":"Manageable"},
    {"id":"sleep","q":"How well did you sleep this past week?","lo":"Poorly","hi":"Well"},
    {"id":"focus","q":"Confidence in your ability to focus?","lo":"Low","hi":"High"},
    {"id":"mood","q":"Your general mood these past 7 days?","lo":"Low","hi":"Good"}
  ]'::jsonb,
  true
);

-- Meditation tracks (placeholder audio; admins can replace URLs)
INSERT INTO public.meditation_tracks (title, description, audio_url, duration_seconds, time_of_day, coach_name) VALUES
('Morning intention', 'Five gentle minutes to arrive in your day.', 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc39b8b.mp3', 300, 'morning', 'Coach Ananya'),
('Anchor breath', 'A settling practice before study.', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2ca9414c34.mp3', 420, 'morning', 'Coach Rohan'),
('Wind-down body scan', 'Release the day, one breath at a time.', 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3', 480, 'evening', 'Coach Meera'),
('Sleep, softly', 'A slow guide toward rest.', 'https://cdn.pixabay.com/download/audio/2023/06/11/audio_8ce78aa4a4.mp3', 600, 'evening', 'Coach Meera');

-- Affirmations (a small starter library)
INSERT INTO public.affirmations (body, category) VALUES
('I am allowed to move at my own pace.', 'self-compassion'),
('One honest hour is worth more than a scattered day.', 'focus'),
('My worth is not my rank.', 'exam-pressure'),
('I can hold both effort and rest.', 'balance'),
('Today, I show up. That is enough.', 'consistency'),
('Small steps in the same direction still get me there.', 'consistency'),
('I am learning, not performing.', 'growth'),
('My breath is always here.', 'grounding'),
('The syllabus is not my identity.', 'exam-pressure'),
('I can ask for help without shrinking.', 'connection');

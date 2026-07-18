
INSERT INTO public.ambient_tracks (title, audio_url, category, is_published) VALUES
('Soft rain', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2ca9414c34.mp3', 'rain', true),
('Forest morning', 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc39b8b.mp3', 'nature', true),
('Warm hum', 'https://cdn.pixabay.com/download/audio/2023/06/11/audio_8ce78aa4a4.mp3', 'ambient', true),
('Slow river', 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3', 'nature', true);

INSERT INTO public.live_sessions (title, description, zoom_url, scheduled_at, duration_minutes) VALUES
('NEET Biology Q&A with Aarav', 'Open house — bring your toughest chapters.', 'https://zoom.us/j/1234567890', now() + interval '2 days', 60),
('Managing exam-day anxiety', 'A calm, practical session before the mocks.', 'https://zoom.us/j/2345678901', now() + interval '5 days', 45),
('How toppers actually study (recording)', 'Not a lecture — a real conversation.', NULL, now() - interval '3 days', 50);

UPDATE public.live_sessions
SET recording_url = 'https://www.youtube.com/embed/inpok4MKVLM'
WHERE title = 'How toppers actually study (recording)';

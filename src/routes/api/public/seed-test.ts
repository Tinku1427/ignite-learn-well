import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/seed-test')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get('x-seed-token');
        if (token !== (process.env.SEED_TOKEN ?? 'guiding-mentor-seed-2026')) {
          return new Response('Unauthorized', { status: 401 });
        }
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const users = [
          { email: 'admin@test.guidingmentor.app',  password: 'TestPass!2026', name: 'Admin Tester',  role: 'admin'   as const },
          { email: 'coach@test.guidingmentor.app',  password: 'TestPass!2026', name: 'Coach Tester',  role: 'coach'   as const },
          { email: 'mentor@test.guidingmentor.app', password: 'TestPass!2026', name: 'Mentor Tester', role: 'mentor'  as const },
          { email: 'student@test.guidingmentor.app',password: 'TestPass!2026', name: 'Student Tester',role: 'student' as const },
        ];

        const ids: Record<string, string> = {};
        for (const u of users) {
          // Create or fetch
          let userId: string | null = null;
          const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email: u.email, password: u.password, email_confirm: true,
            user_metadata: { full_name: u.name },
          });
          if (created?.user) {
            userId = created.user.id;
          } else if (cErr && /registered|exists/i.test(cErr.message)) {
            const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            const found = list.data?.users.find((x) => x.email === u.email);
            if (found) userId = found.id;
          } else if (cErr) {
            return new Response(`createUser failed: ${cErr.message}`, { status: 500 });
          }
          if (!userId) return new Response(`no id for ${u.email}`, { status: 500 });
          ids[u.role] = userId;

          // Ensure profile
          await supabaseAdmin.from('profiles').upsert({
            id: userId, full_name: u.name,
            onboarding_complete: true,
            parental_consent_at: new Date().toISOString(),
            parental_consent_by: 'seed',
            exam_track: 'JEE',
          }, { onConflict: 'id' });

          // Roles: assign requested role; also always keep student for testing
          await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id,role' });
          if (u.role !== 'student') {
            await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: 'student' }, { onConflict: 'user_id,role' });
          }
        }

        // Mentor row (verified)
        const { data: mentorRow } = await supabaseAdmin.from('mentors').upsert({
          profile_id: ids.mentor, active: true,
          verification_status: 'verified', verified_at: new Date().toISOString(),
          college_name: 'IIT Bombay', bio: 'Friendly mentor.',
        }, { onConflict: 'profile_id' }).select().maybeSingle();
        // Coach row (verified)
        await supabaseAdmin.from('coaches').upsert({
          profile_id: ids.coach, active: true,
          verification_status: 'verified', verified_at: new Date().toISOString(),
          certification_name: 'RCI-Certified Counsellor', bio: 'Warm wellness coach.',
        }, { onConflict: 'profile_id' });

        // Coach caseload = student user
        await supabaseAdmin.from('coach_assignments').upsert({
          coach_id: ids.coach, student_id: ids.student,
        }, { onConflict: 'coach_id,student_id' });

        // Booking mentor <-> student
        if (mentorRow?.id) {
          await supabaseAdmin.from('bookings').insert({
            mentor_id: mentorRow.id, student_id: ids.student, status: 'confirmed', notes: 'Seed booking',
          });
        }

        // Sample student data
        const sid = ids.student;
        const now = Date.now();
        const days = 7;
        // moods
        for (let i = 0; i < days; i++) {
          const at = new Date(now - i * 86400000).toISOString();
          await supabaseAdmin.from('mood_checkins').insert({
            user_id: sid, mood_score: 3 + ((i % 3)), energy: 3, tags: ['study'], note: null, created_at: at,
          });
        }
        // journal entries (one shared with mentor)
        await supabaseAdmin.from('journal_entries').insert([
          { user_id: sid, entry_date: new Date().toISOString().slice(0,10), body: 'Private thought.', is_private: true, flag_for_mentor: false },
          { user_id: sid, entry_date: new Date(now - 86400000).toISOString().slice(0,10), body: 'Shared with my mentor.', is_private: false, flag_for_mentor: true, shared_with_mentor_id: mentorRow?.id ?? null },
        ]);
        // focus sessions
        for (let i = 0; i < 5; i++) {
          await supabaseAdmin.from('focus_sessions').insert({
            user_id: sid, planned_minutes: 25, actual_minutes: 20 + i,
            completed: true, breaks_taken: 1, interruptions: 0,
            created_at: new Date(now - i * 86400000).toISOString(),
          });
        }
        // meditation sessions
        for (let i = 0; i < 4; i++) {
          await supabaseAdmin.from('meditation_sessions').insert({
            user_id: sid, duration_seconds: 300, completed: true, time_of_day: i % 2 === 0 ? 'morning' : 'evening',
            created_at: new Date(now - i * 86400000).toISOString(),
          });
        }
        // wellness scores (7 days)
        for (let i = 0; i < days; i++) {
          const d = new Date(now - i * 86400000).toISOString().slice(0,10);
          const composite = 55 + i * 3;
          await supabaseAdmin.from('wellness_scores').upsert({
            user_id: sid, score_date: d, composite,
            focus_score: 50 + i * 3, rest_score: 55 + i * 2,
            reflection_score: 60 + i, connection_score: 45 + i * 2,
            risk_band: composite < 50 ? 'watch' : composite < 65 ? 'amber' : 'green',
            reasons: ['sample seed'],
          }, { onConflict: 'user_id,score_date' });
        }

        return new Response(JSON.stringify({
          ok: true, ids,
          credentials: users.map((u) => ({ email: u.email, password: u.password, role: u.role })),
        }), { headers: { 'content-type': 'application/json' } });
      }
    }
  }
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affirmation_completions: {
        Row: {
          affirmation_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          affirmation_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          affirmation_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affirmation_completions_affirmation_id_fkey"
            columns: ["affirmation_id"]
            isOneToOne: false
            referencedRelation: "affirmations"
            referencedColumns: ["id"]
          },
        ]
      }
      affirmations: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ambient_tracks: {
        Row: {
          audio_url: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          audio_url: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          audio_url?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          body: string | null
          created_at: string
          cta_url: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          starts_at: string
          title: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          created_at?: string
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string | null
          created_at?: string
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          answers: Json
          assessment_id: string
          id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          answers: Json
          assessment_id: string
          id?: string
          taken_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: string
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          questions: Json
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          availability_id: string | null
          created_at: string
          id: string
          mentor_id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Insert: {
          availability_id?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Update: {
          availability_id?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "mentor_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      breathing_sessions: {
        Row: {
          created_at: string
          cycles: number
          duration_seconds: number
          id: string
          pattern: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycles?: number
          duration_seconds?: number
          id?: string
          pattern: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycles?: number
          duration_seconds?: number
          id?: string
          pattern?: string
          user_id?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          active: boolean
          avatar_seed: string | null
          bio: string | null
          certification_name: string | null
          certification_url: string | null
          created_at: string
          id: string
          profile_id: string
          specialties: string[] | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          certification_name?: string | null
          certification_url?: string | null
          created_at?: string
          id?: string
          profile_id: string
          specialties?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          certification_name?: string | null
          certification_url?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          specialties?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          created_at: string
          id: string
          institute_name: string | null
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          institute_name?: string | null
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          institute_name?: string | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          activated_at: string | null
          cohort_id: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          cohort_id?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          cohort_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_minutes: number
          breaks_taken: number
          completed: boolean
          created_at: string
          id: string
          interruptions: number
          planned_minutes: number
          user_id: string
        }
        Insert: {
          actual_minutes?: number
          breaks_taken?: number
          completed?: boolean
          created_at?: string
          id?: string
          interruptions?: number
          planned_minutes: number
          user_id: string
        }
        Update: {
          actual_minutes?: number
          breaks_taken?: number
          completed?: boolean
          created_at?: string
          id?: string
          interruptions?: number
          planned_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          entry_date: string
          flag_for_mentor: boolean
          id: string
          is_private: boolean
          shared_with_mentor_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entry_date?: string
          flag_for_mentor?: boolean
          id?: string
          is_private?: boolean
          shared_with_mentor_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_date?: string
          flag_for_mentor?: boolean
          id?: string
          is_private?: boolean
          shared_with_mentor_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_shared_with_mentor_id_fkey"
            columns: ["shared_with_mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          cohort_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          recording_url: string | null
          scheduled_at: string
          title: string
          zoom_url: string | null
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_at: string
          title: string
          zoom_url?: string | null
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_at?: string
          title?: string
          zoom_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number
          id: string
          time_of_day: string | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          id?: string
          time_of_day?: string | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          id?: string
          time_of_day?: string | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meditation_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "meditation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_tracks: {
        Row: {
          audio_url: string
          coach_name: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_published: boolean
          time_of_day: string
          title: string
        }
        Insert: {
          audio_url: string
          coach_name?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_published?: boolean
          time_of_day?: string
          title: string
        }
        Update: {
          audio_url?: string
          coach_name?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_published?: boolean
          time_of_day?: string
          title?: string
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          booked: boolean
          id: string
          mentor_id: string
          slot_end: string
          slot_start: string
        }
        Insert: {
          booked?: boolean
          id?: string
          mentor_id: string
          slot_end: string
          slot_start: string
        }
        Update: {
          booked?: boolean
          id?: string
          mentor_id?: string
          slot_end?: string
          slot_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          mentor_id: string
          sender_id: string
          student_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          mentor_id: string
          sender_id: string
          student_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          mentor_id?: string
          sender_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          active: boolean
          avatar_seed: string | null
          bio: string | null
          college_name: string | null
          created_at: string
          id: string
          profile_id: string
          specialties: string[] | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          college_name?: string | null
          created_at?: string
          id?: string
          profile_id: string
          specialties?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          college_name?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          specialties?: string[] | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          created_at: string
          energy: number | null
          id: string
          mood_score: number
          note: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy?: number | null
          id?: string
          mood_score: number
          note?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: number | null
          id?: string
          mood_score?: number
          note?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      nudges: {
        Row: {
          body: string
          created_at: string
          dismissed_at: string | null
          id: string
          seen_at: string | null
          source_event_id: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          seen_at?: string | null
          source_event_id?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          seen_at?: string | null
          source_event_id?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudges_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "agent_events"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          parent_email: string
          parent_name: string | null
          student_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parent_email: string
          parent_name?: string | null
          student_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parent_email?: string
          parent_name?: string | null
          student_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_enabled: boolean
          break_pref: string | null
          class_level: string | null
          cohort_id: string | null
          created_at: string
          daily_goal_hours: number | null
          email_opt_in: boolean
          exam: Database["public"]["Enums"]["exam_type"] | null
          exam_track: string
          full_name: string
          id: string
          onboarded_at: string | null
          onboarding_complete: boolean
          parent_contact: string | null
          parental_consent_at: string | null
          parental_consent_by: string | null
          phone: string | null
          preferred_focus_track_id: string | null
          preferred_relax_track_id: string | null
          quiet_hours_end: string
          quiet_hours_start: string
          target_year: number | null
          timezone: string
          updated_at: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          agent_enabled?: boolean
          break_pref?: string | null
          class_level?: string | null
          cohort_id?: string | null
          created_at?: string
          daily_goal_hours?: number | null
          email_opt_in?: boolean
          exam?: Database["public"]["Enums"]["exam_type"] | null
          exam_track?: string
          full_name?: string
          id: string
          onboarded_at?: string | null
          onboarding_complete?: boolean
          parent_contact?: string | null
          parental_consent_at?: string | null
          parental_consent_by?: string | null
          phone?: string | null
          preferred_focus_track_id?: string | null
          preferred_relax_track_id?: string | null
          quiet_hours_end?: string
          quiet_hours_start?: string
          target_year?: number | null
          timezone?: string
          updated_at?: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          agent_enabled?: boolean
          break_pref?: string | null
          class_level?: string | null
          cohort_id?: string | null
          created_at?: string
          daily_goal_hours?: number | null
          email_opt_in?: boolean
          exam?: Database["public"]["Enums"]["exam_type"] | null
          exam_track?: string
          full_name?: string
          id?: string
          onboarded_at?: string | null
          onboarding_complete?: boolean
          parent_contact?: string | null
          parental_consent_at?: string | null
          parental_consent_by?: string | null
          phone?: string | null
          preferred_focus_track_id?: string | null
          preferred_relax_track_id?: string | null
          quiet_hours_end?: string
          quiet_hours_start?: string
          target_year?: number | null
          timezone?: string
          updated_at?: string
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at: string
          id: string
          message: string | null
          rule_id: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          message?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          message?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          active: boolean
          activity: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at: string
          id: string
          template: string
          time_of_day: string
        }
        Insert: {
          active?: boolean
          activity: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          template: string
          time_of_day?: string
        }
        Update: {
          active?: boolean
          activity?: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          template?: string
          time_of_day?: string
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          attended: boolean
          created_at: string
          id: string
          session_id: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          attended?: boolean
          created_at?: string
          id?: string
          session_id: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          attended?: boolean
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          created_at: string
          hours: number
          id: string
          log_date: string
          quality: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hours: number
          id?: string
          log_date?: string
          quality: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          log_date?: string
          quality?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          is_mandatory: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_scores: {
        Row: {
          composite: number
          connection_score: number
          created_at: string
          focus_score: number
          id: string
          reasons: string[]
          reflection_score: number
          rest_score: number
          risk_band: string
          score_date: string
          user_id: string
        }
        Insert: {
          composite: number
          connection_score: number
          created_at?: string
          focus_score: number
          id?: string
          reasons?: string[]
          reflection_score: number
          rest_score: number
          risk_band: string
          score_date?: string
          user_id: string
        }
        Update: {
          composite?: number
          connection_score?: number
          created_at?: string
          focus_score?: number
          id?: string
          reasons?: string[]
          reflection_score?: number
          rest_score?: number
          risk_band?: string
          score_date?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin" | "mentor" | "counsellor" | "coach"
      booking_status: "requested" | "confirmed" | "completed" | "cancelled"
      exam_type: "JEE" | "NEET"
      reminder_channel: "whatsapp" | "in_app"
      reminder_status: "queued" | "stubbed" | "sent" | "failed"
      submission_status: "submitted" | "reviewed" | "late"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "admin", "mentor", "counsellor", "coach"],
      booking_status: ["requested", "confirmed", "completed", "cancelled"],
      exam_type: ["JEE", "NEET"],
      reminder_channel: ["whatsapp", "in_app"],
      reminder_status: ["queued", "stubbed", "sent", "failed"],
      submission_status: ["submitted", "reviewed", "late"],
    },
  },
} as const

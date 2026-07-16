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
          created_at: string
          id: string
          interpretation: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          answers: Json
          assessment_id: string
          created_at?: string
          id?: string
          interpretation?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          created_at?: string
          id?: string
          interpretation?: string | null
          score?: number | null
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
          active: boolean
          created_at: string
          description: string | null
          id: string
          questions: Json
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          questions?: Json
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          grade: string | null
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          text_answer: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          text_answer?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          text_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_url: string | null
          chapter_id: string | null
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          subject_id: string | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          chapter_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          subject_id?: string | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          chapter_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          subject_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_tracks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          license: string | null
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          license?: string | null
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          license?: string | null
          title?: string
          url?: string
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
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number | null
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_progress: {
        Row: {
          class_id: string
          completed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          completed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          completed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_progress_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          chapter_id: string | null
          created_at: string
          description: string | null
          duration_min: number | null
          id: string
          notes_url: string | null
          published: boolean
          subject_id: string | null
          title: string
          video_url: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          notes_url?: string | null
          published?: boolean
          subject_id?: string | null
          title: string
          video_url: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          notes_url?: string | null
          published?: boolean
          subject_id?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          entry_date: string
          flag_for_mentor: boolean
          id: string
          shared_with_mentor_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entry_date?: string
          flag_for_mentor?: boolean
          id?: string
          shared_with_mentor_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_date?: string
          flag_for_mentor?: boolean
          id?: string
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
      meditations: {
        Row: {
          audio_url: string
          category: string | null
          created_at: string
          duration_min: number | null
          id: string
          tags: string[] | null
          title: string
        }
        Insert: {
          audio_url: string
          category?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          audio_url?: string
          category?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          tags?: string[] | null
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
          created_at: string
          id: string
          profile_id: string
          specialties: string[] | null
        }
        Insert: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          profile_id: string
          specialties?: string[] | null
        }
        Update: {
          active?: boolean
          avatar_seed?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          specialties?: string[] | null
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
      mood_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          note: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          note?: string | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          note?: string | null
          score?: number
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
      pomodoro_sessions: {
        Row: {
          completed_at: string
          duration_min: number
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_min: number
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_min?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_enabled: boolean
          break_pref: string | null
          created_at: string
          daily_goal_hours: number | null
          exam: Database["public"]["Enums"]["exam_type"] | null
          full_name: string
          id: string
          onboarded_at: string | null
          phone: string | null
          preferred_focus_track_id: string | null
          preferred_relax_track_id: string | null
          quiet_hours_end: string
          quiet_hours_start: string
          target_year: number | null
          updated_at: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          agent_enabled?: boolean
          break_pref?: string | null
          created_at?: string
          daily_goal_hours?: number | null
          exam?: Database["public"]["Enums"]["exam_type"] | null
          full_name?: string
          id: string
          onboarded_at?: string | null
          phone?: string | null
          preferred_focus_track_id?: string | null
          preferred_relax_track_id?: string | null
          quiet_hours_end?: string
          quiet_hours_start?: string
          target_year?: number | null
          updated_at?: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          agent_enabled?: boolean
          break_pref?: string | null
          created_at?: string
          daily_goal_hours?: number | null
          exam?: Database["public"]["Enums"]["exam_type"] | null
          full_name?: string
          id?: string
          onboarded_at?: string | null
          phone?: string | null
          preferred_focus_track_id?: string | null
          preferred_relax_track_id?: string | null
          quiet_hours_end?: string
          quiet_hours_start?: string
          target_year?: number | null
          updated_at?: string
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_focus_track_id_fkey"
            columns: ["preferred_focus_track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_relax_track_id_fkey"
            columns: ["preferred_relax_track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
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
      subjects: {
        Row: {
          created_at: string
          exam: Database["public"]["Enums"]["exam_type"]
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          exam: Database["public"]["Enums"]["exam_type"]
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          exam?: Database["public"]["Enums"]["exam_type"]
          id?: string
          name?: string
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
      app_role: "student" | "admin" | "mentor" | "counsellor"
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
      app_role: ["student", "admin", "mentor", "counsellor"],
      booking_status: ["requested", "confirmed", "completed", "cancelled"],
      exam_type: ["JEE", "NEET"],
      reminder_channel: ["whatsapp", "in_app"],
      reminder_status: ["queued", "stubbed", "sent", "failed"],
      submission_status: ["submitted", "reviewed", "late"],
    },
  },
} as const

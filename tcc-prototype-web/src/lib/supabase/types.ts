// Placeholder Database types for Supabase.
// Recommended: generate real types with the Supabase CLI:
// npx supabase gen types typescript --project-ref <REF> > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          fullName: string
          birthDate: string
          email: string
          phone: string
          lgpdConsentAccepted: boolean
          lgpdConsentAt: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          fullName: string
          birthDate: string
          email: string
          phone: string
          lgpdConsentAccepted?: boolean
          lgpdConsentAt: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          fullName?: string
          birthDate?: string
          email?: string
          phone?: string
          lgpdConsentAccepted?: boolean
          lgpdConsentAt?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pomodoros: {
        Row: {
          pomodoroId: string
          userId: string | null
          title: string
          durationMinutes: number | null
          startedAt: string | null
          endedAt: string | null
          isComplete: boolean | null
          metadata: Json | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          pomodoroId?: string
          userId?: string | null
          title: string
          durationMinutes?: number | null
          startedAt?: string | null
          endedAt?: string | null
          isComplete?: boolean | null
          metadata?: Json | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          pomodoroId?: string
          userId?: string | null
          title?: string
          durationMinutes?: number | null
          startedAt?: string | null
          endedAt?: string | null
          isComplete?: boolean | null
          metadata?: Json | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoros_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pomodoroSessions: {
        Row: {
          sessionId: string
          userId: string
          phaseType: string
          startedAt: string
          endedAt: string
          plannedDurationSeconds: number
          actualDurationSeconds: number
          status: string
          completedAt: string | null
          focusSequenceIndex: number | null
          cycleIndex: number | null
          sourcePomodoroId: string
          metadata: Json | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          sessionId?: string
          userId: string
          phaseType: string
          startedAt: string
          endedAt: string
          plannedDurationSeconds: number
          actualDurationSeconds: number
          status: string
          completedAt?: string | null
          focusSequenceIndex?: number | null
          cycleIndex?: number | null
          sourcePomodoroId: string
          metadata?: Json | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          sessionId?: string
          userId?: string
          phaseType?: string
          startedAt?: string
          endedAt?: string
          plannedDurationSeconds?: number
          actualDurationSeconds?: number
          status?: string
          completedAt?: string | null
          focusSequenceIndex?: number | null
          cycleIndex?: number | null
          sourcePomodoroId?: string
          metadata?: Json | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoroSessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      userPomodoroSettings: {
        Row: {
          userId: string
          focusDurationMinutes: number
          shortBreakDurationMinutes: number
          longBreakDurationMinutes: number
          cyclesBeforeLongBreak: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          userId: string
          focusDurationMinutes?: number
          shortBreakDurationMinutes?: number
          longBreakDurationMinutes?: number
          cyclesBeforeLongBreak?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          userId?: string
          focusDurationMinutes?: number
          shortBreakDurationMinutes?: number
          longBreakDurationMinutes?: number
          cyclesBeforeLongBreak?: number
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "userPomodoroSettings_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resolve_login_email_by_phone: {
        Args: {
          p_phone: string
        }
        Returns: string | null
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type { Database as DB };

export type PomodoroRow = Database['public']['Tables']['pomodoros']['Row'];
export type PomodoroInsert = Database['public']['Tables']['pomodoros']['Insert'];
export type PomodoroUpdate = Database['public']['Tables']['pomodoros']['Update'];
export type PomodoroSessionRow = Database['public']['Tables']['pomodoroSessions']['Row'];
export type PomodoroSessionInsert = Database['public']['Tables']['pomodoroSessions']['Insert'];
export type PomodoroSessionUpdate = Database['public']['Tables']['pomodoroSessions']['Update'];
export type UserPomodoroSettingsRow = Database['public']['Tables']['userPomodoroSettings']['Row'];
export type UserPomodoroSettingsInsert = Database['public']['Tables']['userPomodoroSettings']['Insert'];
export type UserPomodoroSettingsUpdate = Database['public']['Tables']['userPomodoroSettings']['Update'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];


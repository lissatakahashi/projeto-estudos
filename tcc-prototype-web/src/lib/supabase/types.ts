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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];


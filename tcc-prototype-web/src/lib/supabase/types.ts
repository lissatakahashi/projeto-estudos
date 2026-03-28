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
      shopItems: {
        Row: {
          itemId: string
          name: string
          slug: string
          description: string
          price: number
          category: string
          rarity: string
          imageUrl: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          itemId?: string
          name: string
          slug: string
          description?: string
          price: number
          category: string
          rarity?: string
          imageUrl?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          itemId?: string
          name?: string
          slug?: string
          description?: string
          price?: number
          category?: string
          rarity?: string
          imageUrl?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      userInventory: {
        Row: {
          inventoryEntryId: string
          userId: string
          itemId: string
          quantity: number
          isEquipped: boolean
          equipSlot: string | null
          appliedTarget: string | null
          createdAt: string
          purchaseId: string
          walletTransactionId: string
          acquiredAt: string
          updatedAt: string
        }
        Insert: {
          inventoryEntryId?: string
          userId: string
          itemId: string
          quantity?: number
          isEquipped?: boolean
          equipSlot?: string | null
          appliedTarget?: string | null
          createdAt?: string
          purchaseId: string
          walletTransactionId: string
          acquiredAt?: string
          updatedAt?: string
        }
        Update: {
          inventoryEntryId?: string
          userId?: string
          itemId?: string
          quantity?: number
          isEquipped?: boolean
          equipSlot?: string | null
          appliedTarget?: string | null
          createdAt?: string
          purchaseId?: string
          walletTransactionId?: string
          acquiredAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "userInventory_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "userInventory_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: false
            referencedRelation: "shopItems"
            referencedColumns: ["itemId"]
          },
          {
            foreignKeyName: "userInventory_walletTransactionId_fkey"
            columns: ["walletTransactionId"]
            isOneToOne: true
            referencedRelation: "walletTransactions"
            referencedColumns: ["transactionId"]
          }
        ]
      }
      wallets: {
        Row: {
          walletId: string
          userId: string
          balance: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          walletId?: string
          userId: string
          balance?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          walletId?: string
          userId?: string
          balance?: number
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      walletTransactions: {
        Row: {
          transactionId: string
          userId: string
          amount: number
          transactionType: string
          reason: string
          referenceType: string
          referenceId: string | null
          description: string | null
          createdAt: string
        }
        Insert: {
          transactionId?: string
          userId: string
          amount: number
          transactionType: string
          reason: string
          referenceType: string
          referenceId?: string | null
          description?: string | null
          createdAt?: string
        }
        Update: {
          transactionId?: string
          userId?: string
          amount?: number
          transactionType?: string
          reason?: string
          referenceType?: string
          referenceId?: string | null
          description?: string | null
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "walletTransactions_userId_fkey"
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
      resolve_login_email_by_phone: {
        Args: {
          p_phone: string
        }
        Returns: string | null
      }
      award_focus_session_coins: {
        Args: {
          p_focus_session_id: string
          p_planned_duration_seconds: number
        }
        Returns: {
          awarded: boolean
          awarded_amount: number
          new_balance: number
          transaction_id: string | null
        }[]
      }
      purchase_shop_item: {
        Args: {
          p_item_id: string
        }
        Returns: {
          purchased: boolean
          reason: string
          new_balance: number
          transaction_id: string | null
          inventory_entry_id: string | null
          purchase_id: string | null
        }[]
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
export type ShopItemRow = Database['public']['Tables']['shopItems']['Row'];
export type ShopItemInsert = Database['public']['Tables']['shopItems']['Insert'];
export type ShopItemUpdate = Database['public']['Tables']['shopItems']['Update'];
export type UserInventoryRow = Database['public']['Tables']['userInventory']['Row'];
export type UserInventoryInsert = Database['public']['Tables']['userInventory']['Insert'];
export type UserInventoryUpdate = Database['public']['Tables']['userInventory']['Update'];
export type WalletRow = Database['public']['Tables']['wallets']['Row'];
export type WalletInsert = Database['public']['Tables']['wallets']['Insert'];
export type WalletUpdate = Database['public']['Tables']['wallets']['Update'];
export type WalletTransactionRow = Database['public']['Tables']['walletTransactions']['Row'];
export type WalletTransactionInsert = Database['public']['Tables']['walletTransactions']['Insert'];
export type WalletTransactionUpdate = Database['public']['Tables']['walletTransactions']['Update'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];


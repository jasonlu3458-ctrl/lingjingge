export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: string
          created_at: string
          updated_at: string | null
          subscription_status: string | null
          subscription_start: string | null
          subscription_end: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email?: string | null
          role?: string
          created_at?: string
          updated_at?: string | null
          subscription_status?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: string
          created_at?: string
          updated_at?: string | null
          subscription_status?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          stripe_customer_id?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          stripe_subscription_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status: string
          stripe_subscription_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
          Row: {
            id: string
            slug: string
            title: string
            content: string
            source: string | null
            category: 'classics' | 'treasure' | 'essay' | null
            created_at: string
          }
          Insert: {
            id?: string
            slug: string
            title: string
            content: string
            source?: string | null
            category?: 'classics' | 'treasure' | 'essay' | null
            created_at?: string
          }
          Update: {
            id?: string
            slug?: string
            title?: string
            content?: string
            source?: string | null
            category?: 'classics' | 'treasure' | 'essay' | null
            created_at?: string
          }
        }
        topics: {
          Row: {
            id: number
            user_id: string
            title: string
            content: string
            created_at: string
          }
          Insert: {
            id?: number
            user_id: string
            title: string
            content: string
            created_at?: string
          }
          Update: {
            id?: number
            user_id?: string
            title?: string
            content?: string
            created_at?: string
          }
        }
        checkins: {
          Row: {
            id: number
            user_id: string
            type: string
            created_at: string
          }
          Insert: {
            id?: number
            user_id: string
            type: string
            created_at?: string
          }
          Update: {
            id?: number
            user_id?: string
            type?: string
            created_at?: string
          }
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
  }
}
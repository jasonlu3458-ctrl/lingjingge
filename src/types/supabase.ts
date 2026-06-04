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
          id: number
          title: string
          slug: string
          excerpt: string
          content: string
          author: string
          published_at: string
          status: string
        }
        Insert: {
          id?: number
          title: string
          slug: string
          excerpt: string
          content: string
          author: string
          published_at?: string
          status?: string
        }
        Update: {
          id?: number
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          author?: string
          published_at?: string
          status?: string
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
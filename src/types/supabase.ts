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
          id: string;
          email: string | null;
          role: string;
          created_at: string;
          updated_at: string | null;
          subscription_status: string | null;
          subscription_start: string | null;
          subscription_end: string | null;
          polar_customer_id: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string | null;
          subscription_status?: string | null;
          subscription_start?: string | null;
          subscription_end?: string | null;
          polar_customer_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string | null;
          subscription_status?: string | null;
          subscription_start?: string | null;
          subscription_end?: string | null;
          polar_customer_id?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          polar_subscription_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          status: string;
          polar_subscription_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          status?: string;
          polar_subscription_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          source: string | null;
          category: 'classics' | 'treasure' | 'essay' | null;
          translation: string | null;
          translated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: string;
          source?: string | null;
          category?: 'classics' | 'treasure' | 'essay' | null;
          translation?: string | null;
          translated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          source?: string | null;
          category?: 'classics' | 'treasure' | 'essay' | null;
          translation?: string | null;
          translated_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: number;
          user_id: string | null;
          title: string;
          content: string;
          created_at: string;
          tag: string | null;
          is_pinned: boolean | null;
          is_daily: boolean | null;
          is_weekly: boolean | null;
          is_guide: boolean | null;
          parent_topic_id: number | null;
          is_ai_reply: boolean | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          title: string;
          content: string;
          created_at?: string;
          tag?: string | null;
          is_pinned?: boolean | null;
          is_daily?: boolean | null;
          is_weekly?: boolean | null;
          is_guide?: boolean | null;
          parent_topic_id?: number | null;
          is_ai_reply?: boolean | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          title?: string;
          content?: string;
          created_at?: string;
          tag?: string | null;
          is_pinned?: boolean | null;
          is_daily?: boolean | null;
          is_weekly?: boolean | null;
          is_guide?: boolean | null;
          parent_topic_id?: number | null;
          is_ai_reply?: boolean | null;
        };
        Relationships: [];
      };
      checkins: {
        Row: {
          id: number;
          user_id: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          type: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

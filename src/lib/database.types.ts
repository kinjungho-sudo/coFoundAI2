export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          earlybird_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          earlybird_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          earlybird_expires_at?: string | null;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          messages: Json;
          scores: Json;
          status: "in_progress" | "completed" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          messages?: Json;
          scores?: Json;
          status?: "in_progress" | "completed" | "abandoned";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          messages?: Json;
          scores?: Json;
          status?: "in_progress" | "completed" | "abandoned";
          created_at?: string;
          updated_at?: string;
        };
      };
      outputs: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          type: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy" | "jtbd_analysis" | "business_plan_review";
          content: string | null;
          credits_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          type: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy" | "jtbd_analysis" | "business_plan_review";
          content?: string | null;
          credits_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          type?: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy" | "jtbd_analysis" | "business_plan_review";
          content?: string | null;
          credits_used?: number | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string | null;
          order_id: string;
          package: "starter" | "basic" | "pro";
          amount: number;
          credits: number;
          status: "pending" | "success" | "failed" | "cancelled";
          toss_payment_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          order_id: string;
          package: "starter" | "basic" | "pro";
          amount: number;
          credits: number;
          status?: "pending" | "success" | "failed" | "cancelled";
          toss_payment_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          order_id?: string;
          package?: "starter" | "basic" | "pro";
          amount?: number;
          credits?: number;
          status?: "pending" | "success" | "failed" | "cancelled";
          toss_payment_key?: string | null;
          created_at?: string;
        };
      };
      rag_documents: {
        Row: {
          id: string;
          source_id: string;
          category: "gov_official" | "methodology" | "case_study";
          title: string;
          content: string;
          content_summary: string | null;
          metadata: Json;
          embedding: unknown;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          category: "gov_official" | "methodology" | "case_study";
          title: string;
          content: string;
          content_summary?: string | null;
          metadata?: Json;
          embedding?: unknown;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          category?: "gov_official" | "methodology" | "case_study";
          title?: string;
          content?: string;
          content_summary?: string | null;
          metadata?: Json;
          embedding?: unknown;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      rag_update_logs: {
        Row: {
          id: string;
          source_id: string;
          status: "success" | "failed" | "no_change";
          documents_added: number;
          documents_updated: number;
          documents_deleted: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          status: "success" | "failed" | "no_change";
          documents_added?: number;
          documents_updated?: number;
          documents_deleted?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          status?: "success" | "failed" | "no_change";
          documents_added?: number;
          documents_updated?: number;
          documents_deleted?: number;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_credit: {
        Args: { p_user_id: string; p_amount: number };
        Returns: boolean;
      };
      add_credit: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
      search_rag_documents: {
        Args: {
          query_embedding: unknown;
          match_count?: number;
          filter_category?: string | null;
        };
        Returns: Array<{
          id: string;
          source_id: string;
          category: string;
          title: string;
          content: string;
          metadata: Json;
          similarity: number;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
}

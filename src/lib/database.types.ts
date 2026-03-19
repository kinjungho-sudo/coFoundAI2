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
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
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
          type: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy";
          content: string | null;
          credits_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          type: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy";
          content?: string | null;
          credits_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          type?: "business_plan" | "gov_match" | "interview_analysis" | "landing_copy";
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
    };
    Enums: Record<string, never>;
  };
}

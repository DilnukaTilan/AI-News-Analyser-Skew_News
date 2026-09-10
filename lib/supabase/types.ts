export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      article_analyses: {
        Row: {
          article_id: string;
          bias_label: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score: number;
          center_percentage: number;
          confidence: number;
          created_at: string;
          disclaimer: string;
          embedding: number[] | null;
          framing_notes: string;
          left_percentage: number;
          loaded_terms: string[];
          model: string;
          right_percentage: number;
          sentiment_label: "positive" | "neutral" | "negative";
          sentiment_score: number;
          summary: string;
          updated_at: string;
        };
        Insert: {
          article_id: string;
          bias_label: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score: number;
          center_percentage: number;
          confidence: number;
          created_at?: string;
          disclaimer: string;
          embedding?: number[] | null;
          framing_notes: string;
          left_percentage: number;
          loaded_terms?: string[];
          model: string;
          right_percentage: number;
          sentiment_label: "positive" | "neutral" | "negative";
          sentiment_score: number;
          summary: string;
          updated_at?: string;
        };
        Update: {
          article_id?: string;
          bias_label?: "left" | "center" | "right" | "mixed" | "unclear";
          bias_score?: number;
          center_percentage?: number;
          confidence?: number;
          created_at?: string;
          disclaimer?: string;
          embedding?: number[] | null;
          framing_notes?: string;
          left_percentage?: number;
          loaded_terms?: string[];
          model?: string;
          right_percentage?: number;
          sentiment_label?: "positive" | "neutral" | "negative";
          sentiment_score?: number;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_analyses_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          analyzed_at: string | null;
          canonical_url: string | null;
          created_at: string;
          id: string;
          image_url: string;
          original_url: string;
          published_at: string;
          raw_text: string;
          scraped_at: string;
          source_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          analyzed_at?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          original_url: string;
          published_at: string;
          raw_text: string;
          scraped_at?: string;
          source_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          analyzed_at?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          original_url?: string;
          published_at?: string;
          raw_text?: string;
          scraped_at?: string;
          source_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          article_id: string | null;
          context: Json;
          created_at: string;
          event: string;
          id: string;
          level: "debug" | "info" | "warn" | "error";
          message: string;
          source_id: string | null;
        };
        Insert: {
          article_id?: string | null;
          context?: Json;
          created_at?: string;
          event: string;
          id?: string;
          level?: "debug" | "info" | "warn" | "error";
          message: string;
          source_id?: string | null;
        };
        Update: {
          article_id?: string | null;
          context?: Json;
          created_at?: string;
          event?: string;
          id?: string;
          level?: "debug" | "info" | "warn" | "error";
          message?: string;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "logs_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedule_runs: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          job_id: string;
          metadata: Json;
          processed_at: string | null;
          processing_status: "pending" | "processing" | "processed" | "failed" | "skipped";
          result_created_at: string | null;
          result_status: "pending" | "done" | "faulted" | "unknown";
          run_id: string | null;
          schedule_record_id: string;
          summary: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          job_id: string;
          metadata?: Json;
          processed_at?: string | null;
          processing_status?: "pending" | "processing" | "processed" | "failed" | "skipped";
          result_created_at?: string | null;
          result_status?: "pending" | "done" | "faulted" | "unknown";
          run_id?: string | null;
          schedule_record_id: string;
          summary?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          job_id?: string;
          metadata?: Json;
          processed_at?: string | null;
          processing_status?: "pending" | "processing" | "processed" | "failed" | "skipped";
          result_created_at?: string | null;
          result_status?: "pending" | "done" | "faulted" | "unknown";
          run_id?: string | null;
          schedule_record_id?: string;
          summary?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedule_runs_schedule_record_id_fkey";
            columns: ["schedule_record_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedules: {
        Row: {
          created_at: string;
          id: string;
          last_error: string | null;
          last_run_at: string | null;
          last_synced_at: string;
          metadata: Json;
          schedule_id: string;
          source_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_run_at?: string | null;
          last_synced_at?: string;
          metadata?: Json;
          schedule_id: string;
          source_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_run_at?: string | null;
          last_synced_at?: string;
          metadata?: Json;
          schedule_id?: string;
          source_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedules_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          listing_url: string;
          logo_url: string | null;
          name: string;
          parser_strategy: Json | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          listing_url: string;
          logo_url?: string | null;
          name: string;
          parser_strategy?: Json | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          listing_url?: string;
          logo_url?: string | null;
          name?: string;
          parser_strategy?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];

export type Article = Tables<"articles">;
export type ArticleAnalysis = Tables<"article_analyses">;
export type Log = Tables<"logs">;
export type OxylabsSchedule = Tables<"oxylabs_schedules">;
export type OxylabsScheduleRun = Tables<"oxylabs_schedule_runs">;
export type Source = Tables<"sources">;

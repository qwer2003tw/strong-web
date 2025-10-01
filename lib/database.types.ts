export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UnitSystem = "metric" | "imperial";
export type ThemePreference = "light" | "dark" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          locale: string | null;
          theme: ThemePreference | null;
          unit_preference: UnitSystem | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
          theme?: ThemePreference | null;
          unit_preference?: UnitSystem | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          muscle_group?: string | null;
          equipment?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          scheduled_for: string | null;
          status: "draft" | "scheduled" | "completed";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          scheduled_for?: string | null;
          status?: "draft" | "scheduled" | "completed";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
      };
      workout_entries: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          sets: number;
          reps: number | null;
          weight: number | null;
          unit: UnitSystem | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          sets: number;
          reps?: number | null;
          weight?: number | null;
          unit?: UnitSystem | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["workout_entries"]["Insert"]>;
      };
    };
  };
}

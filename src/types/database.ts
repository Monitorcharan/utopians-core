export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "teacher";

export interface Database {
  public: {
    Tables: {
      session_changes: {
        Row: {
          id: string; session_id: string; actor_id: string; kind: "cancelled" | "rescheduled";
          previous_start_time: string; new_start_time: string | null; created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          is_online: boolean;
          skills: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_online?: boolean;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_online?: boolean;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          room_url: string;
          availability_slot_id: string | null;
          started_at: string;
          ended_at: string | null;
          status: SessionStatus;
          scheduled_start_time: string | null;
          scheduled_end_time: string | null;
          amount: number | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          room_url: string;
          availability_slot_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          status?: SessionStatus;
          scheduled_start_time?: string | null;
          scheduled_end_time?: string | null;
          amount?: number | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          room_url?: string;
          availability_slot_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          status?: SessionStatus;
          scheduled_start_time?: string | null;
          scheduled_end_time?: string | null;
          amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          teacher_id: string;
          student_rating: number | null;
          teacher_rating: number | null;
          student_comment: string | null;
          teacher_comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          teacher_id: string;
          student_rating?: number | null;
          teacher_rating?: number | null;
          student_comment?: string | null;
          teacher_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          teacher_id?: string;
          student_rating?: number | null;
          teacher_rating?: number | null;
          student_comment?: string | null;
          teacher_comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      availability_slots: {
        Row: {
          id: string;
          teacher_id: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          start_time?: string;
          end_time?: string;
          is_booked?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_slots_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      change_scheduled_session: {
        Args: { p_session_id: string; p_action: string; p_expected_start_time: string; p_slot_id?: string };
        Returns: string;
      };
      book_available_slot: {
        Args: { p_slot_id: string; p_teacher_id: string };
        Returns: { session_id: string; scheduled_start_time: string; scheduled_end_time: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type SessionStatus = "pending" | "active" | "completed" | "cancelled" | "scheduled";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type AvailabilitySlot = Database["public"]["Tables"]["availability_slots"]["Row"];
export type AvailabilitySlotInsert = Database["public"]["Tables"]["availability_slots"]["Insert"];
export type AvailabilitySlotUpdate = Database["public"]["Tables"]["availability_slots"]["Update"];


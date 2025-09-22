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
      performance_metrics: {
        Row: {
          id: string
          session_id: string
          timestamp: string
          fps: number
          memory_usage: number
          cpu_usage: number
          load_time: number
          screen_name: string
          device_model: string
          platform: string
          app_version: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          timestamp: string
          fps: number
          memory_usage: number
          cpu_usage: number
          load_time: number
          screen_name: string
          device_model: string
          platform: string
          app_version: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          timestamp?: string
          fps?: number
          memory_usage?: number
          cpu_usage?: number
          load_time?: number
          screen_name?: string
          device_model?: string
          platform?: string
          app_version?: string
          created_at?: string
        }
      }
      performance_sessions: {
        Row: {
          id: string
          user_id: string | null
          device_id: string
          start_time: string
          end_time: string | null
          duration: number | null
          total_metrics: number
          avg_fps: number | null
          avg_memory: number | null
          avg_cpu: number | null
          platform: string
          app_version: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          device_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
          total_metrics?: number
          avg_fps?: number | null
          avg_memory?: number | null
          avg_cpu?: number | null
          platform: string
          app_version: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          device_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
          total_metrics?: number
          avg_fps?: number | null
          avg_memory?: number | null
          avg_cpu?: number | null
          platform?: string
          app_version?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

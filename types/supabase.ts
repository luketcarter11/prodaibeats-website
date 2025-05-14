export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          response: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          response?: string | null
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          license: string | null
          order_id: string | null
          price: number | null
          quantity: number | null
          track_id: string | null
          track_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license?: string | null
          order_id?: string | null
          price?: number | null
          quantity?: number | null
          track_id?: string | null
          track_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license?: string | null
          order_id?: string | null
          price?: number | null
          quantity?: number | null
          track_id?: string | null
          track_name?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: string | null
          customer_email: string | null
          discount: number | null
          id: string
          license: string
          license_file: string | null
          order_date: string
          status: string
          stripe_session_id: string | null
          total_amount: number
          track_id: string
          track_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          discount?: number | null
          id?: string
          license: string
          license_file?: string | null
          order_date: string
          status: string
          stripe_session_id?: string | null
          total_amount: number
          track_id: string
          track_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          discount?: number | null
          id?: string
          license?: string
          license_file?: string | null
          order_date?: string
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          track_id?: string
          track_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_address: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_picture_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_backup: {
        Row: {
          billing_address: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          profile_picture_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduler_state: {
        Row: {
          created_at: string | null
          id: string
          json_state: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          json_state: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          json_state?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      tracks: {
        Row: {
          artist: string | null
          audio_url: string | null
          bpm: number | null
          cover_url: string | null
          created_at: string | null
          duration: string | null
          genre: string | null
          id: string
          price: number | null
          slug: string | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          artist?: string | null
          audio_url?: string | null
          bpm?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          price?: number | null
          slug?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          artist?: string | null
          audio_url?: string | null
          bpm?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          price?: number | null
          slug?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          license_type: string | null
          metadata: Json | null
          order_id: string | null
          payment_method: string | null
          status: string
          stripe_transaction_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          status: string
          stripe_transaction_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          status?: string
          stripe_transaction_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_function_exists: {
        Args: { function_name: string }
        Returns: {
          exists: boolean
        }[]
      }
      check_rls_policies: {
        Args: { table_name: string }
        Returns: {
          policyname: string
          permissive: string
          roles: string[]
          cmd: string
          qual: string
          with_check: string
        }[]
      }
      check_scheduler_state_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_contact_messages_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_profile: {
        Args:
          | {
              user_id: string
              full_name?: string
              display_name?: string
              billing_address?: string
              country?: string
              phone?: string
            }
          | {
              user_id: string
              full_name?: string
              display_name?: string
              billing_address?: string
              country?: string
              phone?: string
              profile_picture_url?: string
            }
        Returns: boolean
      }
      create_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_service_role_check_function: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      debug_table_structure: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
          column_default: string
        }[]
      }
      initialize_scheduler_source: {
        Args: { source_url: string; source_type: string }
        Returns: Json
      }
      update_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: undefined
      }
      verify_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      order_status: "pending" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "completed", "failed"],
    },
  },
} as const

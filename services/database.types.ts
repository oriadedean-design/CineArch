export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agency_invites: {
        Row: {
          agency_id: string
          created_at: string
          email: string
          id: string
          name: string | null
          province: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          email: string
          id?: string
          name?: string | null
          province?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          province?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_invites_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          add_back_amount: number | null
          amount_before_tax: number
          business_use_percent: number
          category: string
          client_id: string | null
          created_at: string
          date_incurred: string
          date_paid: string | null
          deductible_amount: number | null
          description: string
          id: string
          job_id: string | null
          rule_tags: string[] | null
          synced_at: string | null
          tax_amount: number
          total_amount: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          add_back_amount?: number | null
          amount_before_tax?: number
          business_use_percent?: number
          category: string
          client_id?: string | null
          created_at?: string
          date_incurred: string
          date_paid?: string | null
          deductible_amount?: number | null
          description: string
          id?: string
          job_id?: string | null
          rule_tags?: string[] | null
          synced_at?: string | null
          tax_amount?: number
          total_amount?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          add_back_amount?: number | null
          amount_before_tax?: number
          business_use_percent?: number
          category?: string
          client_id?: string | null
          created_at?: string
          date_incurred?: string
          date_paid?: string | null
          deductible_amount?: number | null
          description?: string
          id?: string
          job_id?: string | null
          rule_tags?: string[] | null
          synced_at?: string | null
          tax_amount?: number
          total_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_id: string | null
          company_name: string
          created_at: string
          credit_type: string | null
          department: string | null
          days_worked: number
          document_ids: string[] | null
          end_date: string | null
          genre: string | null
          gross_earnings: number | null
          hourly_rate: number | null
          hours_per_day: number | null
          id: string
          image_url: string | null
          is_union: boolean
          is_upgrade: boolean | null
          meal_break_minutes: number
          notes: string | null
          overtime_hours: number
          production_name: string
          production_tier: string | null
          province: string | null
          rate_position: string | null
          role: string
          start_date: string
          status: string
          synced_at: string | null
          total_hours: number
          union_deductions: number | null
          union_minimum_rate: number | null
          union_name: string | null
          union_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          company_name?: string
          created_at?: string
          credit_type?: string | null
          department?: string | null
          days_worked?: number
          document_ids?: string[] | null
          end_date?: string | null
          genre?: string | null
          gross_earnings?: number | null
          hourly_rate?: number | null
          hours_per_day?: number | null
          id?: string
          image_url?: string | null
          is_union?: boolean
          is_upgrade?: boolean | null
          meal_break_minutes?: number
          notes?: string | null
          overtime_hours?: number
          production_name: string
          production_tier?: string | null
          province?: string | null
          rate_position?: string | null
          role: string
          start_date: string
          status?: string
          synced_at?: string | null
          total_hours?: number
          union_deductions?: number | null
          union_minimum_rate?: number | null
          union_name?: string | null
          union_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          company_name?: string
          created_at?: string
          credit_type?: string | null
          department?: string | null
          days_worked?: number
          document_ids?: string[] | null
          end_date?: string | null
          genre?: string | null
          gross_earnings?: number | null
          hourly_rate?: number | null
          hours_per_day?: number | null
          id?: string
          image_url?: string | null
          is_union?: boolean
          is_upgrade?: boolean | null
          meal_break_minutes?: number
          notes?: string | null
          overtime_hours?: number
          production_name?: string
          production_tier?: string | null
          province?: string | null
          rate_position?: string | null
          role?: string
          start_date?: string
          status?: string
          synced_at?: string | null
          total_hours?: number
          union_deductions?: number | null
          union_minimum_rate?: number | null
          union_name?: string | null
          union_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          agent_fee_pct: number | null
          business_structure: string | null
          career_focus: string | null
          cohort_year: string | null
          country: string | null
          created_at: string
          department: string | null
          email: string
          entity_type: string | null
          goals: string[] | null
          has_agent_fee: boolean | null
          id: string
          is_onboarded: boolean
          is_premium: boolean
          language: string | null
          managed_by_agency_id: string | null
          member_status: string | null
          name: string | null
          organization_name: string | null
          phone: string | null
          plan: string
          primary_industry: string | null
          program_name: string | null
          province: string | null
          region: string | null
          role: string | null
          selected_roles: string[] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          agent_fee_pct?: number | null
          business_structure?: string | null
          career_focus?: string | null
          cohort_year?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email: string
          entity_type?: string | null
          goals?: string[] | null
          has_agent_fee?: boolean | null
          id: string
          is_onboarded?: boolean
          is_premium?: boolean
          language?: string | null
          managed_by_agency_id?: string | null
          member_status?: string | null
          name?: string | null
          organization_name?: string | null
          phone?: string | null
          plan?: string
          primary_industry?: string | null
          program_name?: string | null
          province?: string | null
          region?: string | null
          role?: string | null
          selected_roles?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          agent_fee_pct?: number | null
          business_structure?: string | null
          career_focus?: string | null
          cohort_year?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email?: string
          entity_type?: string | null
          goals?: string[] | null
          has_agent_fee?: boolean | null
          id?: string
          is_onboarded?: boolean
          is_premium?: boolean
          language?: string | null
          managed_by_agency_id?: string | null
          member_status?: string | null
          name?: string | null
          organization_name?: string | null
          phone?: string | null
          plan?: string
          primary_industry?: string | null
          program_name?: string | null
          province?: string | null
          region?: string | null
          role?: string | null
          selected_roles?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_managed_by_agency_id_fkey"
            columns: ["managed_by_agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      residency_documents: {
        Row: {
          client_id: string | null
          file_name: string
          id: string
          storage_path: string
          synced_at: string | null
          type: string
          updated_at: string
          uploaded_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          client_id?: string | null
          file_name: string
          id?: string
          storage_path: string
          synced_at?: string | null
          type: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          client_id?: string | null
          file_name?: string
          id?: string
          storage_path?: string
          synced_at?: string | null
          type?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "residency_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          attempted_at: string | null
          created_at: string
          error: string | null
          id: string
          operation: string
          payload: Json
          record_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          operation: string
          payload: Json
          record_id: string
          table_name: string
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          operation?: string
          payload?: Json
          record_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      union_tracking: {
        Row: {
          client_id: string | null
          created_at: string
          department: string | null
          id: string
          starting_value: number
          synced_at: string | null
          target_type: string
          target_value: number
          tier_label: string
          union_name: string
          union_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          starting_value?: number
          synced_at?: string | null
          target_type: string
          target_value: number
          tier_label: string
          union_name: string
          union_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          starting_value?: number
          synced_at?: string | null
          target_type?: string
          target_value?: number
          tier_label?: string
          union_name?: string
          union_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_label: string | null
          id: string
          ip_address: unknown
          last_active: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          id?: string
          ip_address?: unknown
          last_active?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          id?: string
          ip_address?: unknown
          last_active?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finance_stats: {
        Args: { p_user_id: string; p_year?: number }
        Returns: {
          deductible_expenses: number
          gross_income: number
          gst_collected: number
          gst_paid: number
          total_expenses: number
        }[]
      }
      is_agent: { Args: never; Returns: boolean }
      rate_schedule_lines: { Args: { p_schedule_ids: string[] }; Returns: Json }
      union_engine_snapshot: { Args: never; Returns: Json }
      union_engine_version: { Args: never; Returns: number }
      is_agent_of: { Args: { p_client: string }; Returns: boolean }
      leave_agency: { Args: never; Returns: undefined }
      my_agency: {
        Args: never
        Returns: {
          id: string
          name: string
          organization_name: string
        }[]
      }
      my_pending_invites: {
        Args: never
        Returns: {
          agency_id: string
          agency_name: string
          created_at: string
          id: string
        }[]
      }
      register_user_session: {
        Args: { p_device_label?: string; p_session_token: string }
        Returns: undefined
      }
      release_client: { Args: { p_client: string }; Returns: undefined }
      respond_to_agency_invite: {
        Args: { p_accept: boolean; p_invite_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

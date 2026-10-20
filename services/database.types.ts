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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      deadlines: {
        Row: {
          applies_to: string
          checked_on: string
          day: number
          detail: string | null
          id: string
          month: number
          province: string | null
          source_url: string
          title: string
          union_id: string | null
          updated_at: string
        }
        Insert: {
          applies_to: string
          checked_on: string
          day: number
          detail?: string | null
          id: string
          month: number
          province?: string | null
          source_url: string
          title: string
          union_id?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          checked_on?: string
          day?: number
          detail?: string | null
          id?: string
          month?: number
          province?: string | null
          source_url?: string
          title?: string
          union_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      department_coverage: {
        Row: {
          department_id: string
          id: number
          notes: string | null
          province: string
          region: string | null
          relationship: string
          sort_order: number
          union_id: string
          updated_at: string
        }
        Insert: {
          department_id: string
          id?: never
          notes?: string | null
          province: string
          region?: string | null
          relationship?: string
          sort_order?: number
          union_id: string
          updated_at?: string
        }
        Update: {
          department_id?: string
          id?: never
          notes?: string | null
          province?: string
          region?: string | null
          relationship?: string
          sort_order?: number
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_coverage_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_coverage_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          description?: string | null
          id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fact_checks: {
        Row: {
          checked_at: string
          checked_by: string | null
          id: string
          note: string | null
          outcome: string
          subject: string
          subject_key: string
        }
        Insert: {
          checked_at?: string
          checked_by?: string | null
          id?: string
          note?: string | null
          outcome: string
          subject: string
          subject_key: string
        }
        Update: {
          checked_at?: string
          checked_by?: string | null
          id?: string
          note?: string | null
          outcome?: string
          subject?: string
          subject_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          app_version: string | null
          created_at: string
          id: string
          kind: string
          message: string
          platform: string
          screen: string | null
          status: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          id?: string
          kind: string
          message: string
          platform: string
          screen?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          platform?: string
          screen?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
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
          proof_path: string | null
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
          proof_path?: string | null
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
          proof_path?: string | null
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
          agency_id: string | null
          agent_name: string | null
          client_id: string | null
          company_name: string
          created_at: string
          credit_type: string | null
          days_worked: number
          department: string | null
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
          proof_path: string | null
          province: string | null
          rate_position: string | null
          representative_id: string | null
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
          agency_id?: string | null
          agent_name?: string | null
          client_id?: string | null
          company_name?: string
          created_at?: string
          credit_type?: string | null
          days_worked?: number
          department?: string | null
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
          proof_path?: string | null
          province?: string | null
          rate_position?: string | null
          representative_id?: string | null
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
          agency_id?: string | null
          agent_name?: string | null
          client_id?: string | null
          company_name?: string
          created_at?: string
          credit_type?: string | null
          days_worked?: number
          department?: string | null
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
          proof_path?: string | null
          province?: string | null
          rate_position?: string | null
          representative_id?: string | null
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
            foreignKeyName: "jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_rules: {
        Row: {
          checked_on: string | null
          department_id: string | null
          id: string
          increment_minutes: number | null
          meal_break_notes: string | null
          minimum_call_hours: number | null
          needs_verification: string[]
          notes: string | null
          overtime_after: number[]
          overtime_base: string
          overtime_multipliers: number[]
          seventh_day: Json | null
          sixth_day: Json | null
          sort_order: number
          source_url: string | null
          title: string
          union_id: string
          updated_at: string
          vacation_pay_rate: number | null
        }
        Insert: {
          checked_on?: string | null
          department_id?: string | null
          id: string
          increment_minutes?: number | null
          meal_break_notes?: string | null
          minimum_call_hours?: number | null
          needs_verification?: string[]
          notes?: string | null
          overtime_after?: number[]
          overtime_base?: string
          overtime_multipliers?: number[]
          seventh_day?: Json | null
          sixth_day?: Json | null
          sort_order?: number
          source_url?: string | null
          title: string
          union_id: string
          updated_at?: string
          vacation_pay_rate?: number | null
        }
        Update: {
          checked_on?: string | null
          department_id?: string | null
          id?: string
          increment_minutes?: number | null
          meal_break_notes?: string | null
          minimum_call_hours?: number | null
          needs_verification?: string[]
          notes?: string | null
          overtime_after?: number[]
          overtime_base?: string
          overtime_multipliers?: number[]
          seventh_day?: Json | null
          sixth_day?: Json | null
          sort_order?: number
          source_url?: string | null
          title?: string
          union_id?: string
          updated_at?: string
          vacation_pay_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_rules_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_plans: {
        Row: {
          base_rate: number
          checked_on: string
          code: string
          exemption: number
          first_additional_rate: number
          second_rate: number
          source_url: string
          updated_at: string
          yampe: number
          year: number
          ympe: number
        }
        Insert: {
          base_rate: number
          checked_on: string
          code: string
          exemption: number
          first_additional_rate: number
          second_rate: number
          source_url: string
          updated_at?: string
          yampe: number
          year: number
          ympe: number
        }
        Update: {
          base_rate?: number
          checked_on?: string
          code?: string
          exemption?: number
          first_additional_rate?: number
          second_rate?: number
          source_url?: string
          updated_at?: string
          yampe?: number
          year?: number
          ympe?: number
        }
        Relationships: []
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
          earning_goal: number | null
          email: string
          entity_type: string | null
          goals: string[] | null
          gst_method: string
          has_agent_fee: boolean | null
          id: string
          is_admin: boolean
          is_onboarded: boolean
          is_premium: boolean
          language: string | null
          managed_by_agency_id: string | null
          member_status: string | null
          name: string | null
          organization_name: string | null
          pay_type: string | null
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
          earning_goal?: number | null
          email: string
          entity_type?: string | null
          goals?: string[] | null
          gst_method?: string
          has_agent_fee?: boolean | null
          id: string
          is_admin?: boolean
          is_onboarded?: boolean
          is_premium?: boolean
          language?: string | null
          managed_by_agency_id?: string | null
          member_status?: string | null
          name?: string | null
          organization_name?: string | null
          pay_type?: string | null
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
          earning_goal?: number | null
          email?: string
          entity_type?: string | null
          goals?: string[] | null
          gst_method?: string
          has_agent_fee?: boolean | null
          id?: string
          is_admin?: boolean
          is_onboarded?: boolean
          is_premium?: boolean
          language?: string | null
          managed_by_agency_id?: string | null
          member_status?: string | null
          name?: string | null
          organization_name?: string | null
          pay_type?: string | null
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
      rate_lines: {
        Row: {
          department: string
          department_note: string | null
          id: number
          position: string
          rates: number[]
          role_id: string | null
          schedule_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          department: string
          department_note?: string | null
          id?: never
          position: string
          rates: number[]
          role_id?: string | null
          schedule_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          department?: string
          department_note?: string | null
          id?: never
          position?: string
          rates?: number[]
          role_id?: string | null
          schedule_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_lines_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_lines_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "rate_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_schedules: {
        Row: {
          checked_on: string | null
          columns: string[]
          daily_column: string | null
          effective_from: string
          effective_to: string | null
          hourly_column: string | null
          id: string
          notes: string | null
          production_type: string | null
          rate_unit: string
          source_url: string | null
          title: string
          union_id: string
          updated_at: string
        }
        Insert: {
          checked_on?: string | null
          columns: string[]
          daily_column?: string | null
          effective_from: string
          effective_to?: string | null
          hourly_column?: string | null
          id: string
          notes?: string | null
          production_type?: string | null
          rate_unit?: string
          source_url?: string | null
          title: string
          union_id: string
          updated_at?: string
        }
        Update: {
          checked_on?: string | null
          columns?: string[]
          daily_column?: string | null
          effective_from?: string
          effective_to?: string | null
          hourly_column?: string | null
          id?: string
          notes?: string | null
          production_type?: string | null
          rate_unit?: string
          source_url?: string | null
          title?: string
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_schedules_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      report_runs: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      representatives: {
        Row: {
          agency: string | null
          agency_id: string | null
          applies_to: string
          commission_pct: number
          created_at: string
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency?: string | null
          agency_id?: string | null
          applies_to?: string
          commission_pct: number
          created_at?: string
          id?: string
          kind?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency?: string | null
          agency_id?: string | null
          applies_to?: string
          commission_pct?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "representatives_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representatives_user_id_fkey"
            columns: ["user_id"]
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
      role_coverage: {
        Row: {
          id: number
          needs_verification: boolean
          notes: string | null
          province: string
          region: string | null
          relationship: string
          role_id: string
          sort_order: number
          union_id: string
          updated_at: string
        }
        Insert: {
          id?: never
          needs_verification?: boolean
          notes?: string | null
          province: string
          region?: string | null
          relationship?: string
          role_id: string
          sort_order?: number
          union_id: string
          updated_at?: string
        }
        Update: {
          id?: never
          needs_verification?: boolean
          notes?: string | null
          province?: string
          region?: string | null
          relationship?: string
          role_id?: string
          sort_order?: number
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_coverage_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_coverage_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          aliases: string[]
          code: string | null
          department_id: string
          description: string | null
          id: string
          is_trainee: boolean
          name: string
          requirements: string[]
          sort_order: number
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          code?: string | null
          department_id: string
          description?: string | null
          id: string
          is_trainee?: boolean
          name: string
          requirements?: string[]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          code?: string | null
          department_id?: string
          description?: string | null
          id?: string
          is_trainee?: boolean
          name?: string
          requirements?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_tax: {
        Row: {
          checked_on: string
          gst_hst_rate: number
          notes: string | null
          province: string
          quick_credit_limit: number
          quick_credit_rate: number
          quick_service_rate: number
          source_url: string
          updated_at: string
          year: number
        }
        Insert: {
          checked_on: string
          gst_hst_rate: number
          notes?: string | null
          province: string
          quick_credit_limit?: number
          quick_credit_rate?: number
          quick_service_rate: number
          source_url: string
          updated_at?: string
          year: number
        }
        Update: {
          checked_on?: string
          gst_hst_rate?: number
          notes?: string | null
          province?: string
          quick_credit_limit?: number
          quick_credit_rate?: number
          quick_service_rate?: number
          source_url?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
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
      tax_jurisdictions: {
        Row: {
          basic_amount: number
          basic_amount_phaseout: Json | null
          brackets: Json
          checked_on: string
          code: string
          federal_abatement: number | null
          health_premium: Json | null
          needs_verification: string[]
          notes: string | null
          province: string | null
          source_url: string
          surtax: Json | null
          tax_reduction_base: number | null
          updated_at: string
          year: number
        }
        Insert: {
          basic_amount: number
          basic_amount_phaseout?: Json | null
          brackets: Json
          checked_on: string
          code: string
          federal_abatement?: number | null
          health_premium?: Json | null
          needs_verification?: string[]
          notes?: string | null
          province?: string | null
          source_url: string
          surtax?: Json | null
          tax_reduction_base?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          basic_amount?: number
          basic_amount_phaseout?: Json | null
          brackets?: Json
          checked_on?: string
          code?: string
          federal_abatement?: number | null
          health_premium?: Json | null
          needs_verification?: string[]
          notes?: string | null
          province?: string | null
          source_url?: string
          surtax?: Json | null
          tax_reduction_base?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      union_departments: {
        Row: {
          id: number
          name: string
          sort_order: number
          union_id: string
          updated_at: string
        }
        Insert: {
          id?: never
          name: string
          sort_order?: number
          union_id: string
          updated_at?: string
        }
        Update: {
          id?: never
          name?: string
          sort_order?: number
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_departments_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      union_engine_meta: {
        Row: {
          id: boolean
          updated_at: string
          version: number
        }
        Insert: {
          id?: boolean
          updated_at?: string
          version?: number
        }
        Update: {
          id?: boolean
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      union_jurisdictions: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          id: number
          needs_verification: boolean
          notes: string | null
          province: string
          region: string | null
          union_id: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          id?: never
          needs_verification?: boolean
          notes?: string | null
          province: string
          region?: string | null
          union_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          id?: never
          needs_verification?: boolean
          notes?: string | null
          province?: string
          region?: string | null
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_jurisdictions_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      union_requirements: {
        Row: {
          caucus: string | null
          id: number
          kind: string
          province: string | null
          sort_order: number
          text: string
          union_id: string
          updated_at: string
        }
        Insert: {
          caucus?: string | null
          id?: never
          kind?: string
          province?: string | null
          sort_order?: number
          text: string
          union_id: string
          updated_at?: string
        }
        Update: {
          caucus?: string | null
          id?: never
          kind?: string
          province?: string | null
          sort_order?: number
          text?: string
          union_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_requirements_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      union_tiers: {
        Row: {
          checked_on: string | null
          confirmed: boolean
          counts_work: string
          description: string | null
          exclude_role_ids: string[]
          hours_rule: string | null
          id: number
          min_productions: number | null
          name: string
          province: string | null
          requires_department: boolean
          role_ids: string[]
          short_day_hours: number | null
          short_day_inclusive: boolean
          sort_order: number
          source_url: string | null
          start_label: string | null
          target_type: string
          target_value: number
          union_id: string
          updated_at: string
          window_months: number | null
        }
        Insert: {
          checked_on?: string | null
          confirmed?: boolean
          counts_work?: string
          description?: string | null
          exclude_role_ids?: string[]
          hours_rule?: string | null
          id?: never
          min_productions?: number | null
          name: string
          province?: string | null
          requires_department?: boolean
          role_ids?: string[]
          short_day_hours?: number | null
          short_day_inclusive?: boolean
          sort_order?: number
          source_url?: string | null
          start_label?: string | null
          target_type: string
          target_value: number
          union_id: string
          updated_at?: string
          window_months?: number | null
        }
        Update: {
          checked_on?: string | null
          confirmed?: boolean
          counts_work?: string
          description?: string | null
          exclude_role_ids?: string[]
          hours_rule?: string | null
          id?: never
          min_productions?: number | null
          name?: string
          province?: string | null
          requires_department?: boolean
          role_ids?: string[]
          short_day_hours?: number | null
          short_day_inclusive?: boolean
          sort_order?: number
          source_url?: string | null
          start_label?: string | null
          target_type?: string
          target_value?: number
          union_id?: string
          updated_at?: string
          window_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "union_tiers_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      union_tracking: {
        Row: {
          client_id: string | null
          counts_from: string | null
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
          counts_from?: string | null
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
          counts_from?: string | null
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
      unions: {
        Row: {
          application_fee: number | null
          application_fee_notes: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          dues_notes: string | null
          dues_rate: number | null
          id: string
          is_active: boolean
          jurisdictional_notes: string | null
          last_verified: string | null
          member_benefits: string[]
          name: string
          needs_verification: string[]
          residency_rule: string | null
          scope: string | null
          sort_order: number
          source_urls: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          application_fee?: number | null
          application_fee_notes?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          dues_notes?: string | null
          dues_rate?: number | null
          id: string
          is_active?: boolean
          jurisdictional_notes?: string | null
          last_verified?: string | null
          member_benefits?: string[]
          name: string
          needs_verification?: string[]
          residency_rule?: string | null
          scope?: string | null
          sort_order?: number
          source_urls?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          application_fee?: number | null
          application_fee_notes?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          dues_notes?: string | null
          dues_rate?: number | null
          id?: string
          is_active?: boolean
          jurisdictional_notes?: string | null
          last_verified?: string | null
          member_benefits?: string[]
          name?: string
          needs_verification?: string[]
          residency_rule?: string | null
          scope?: string | null
          sort_order?: number
          source_urls?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
      union_roles: {
        Row: {
          coverage_id: number | null
          department: string | null
          needs_verification: boolean | null
          notes: string | null
          province: string | null
          region: string | null
          relationship: string | null
          role: string | null
          union_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_feedback: {
        Args: { p_status?: string }
        Returns: {
          app_version: string
          created_at: string
          email: string
          id: string
          kind: string
          message: string
          name: string
          platform: string
          screen: string
          status: string
        }[]
      }
      check_fact: {
        Args: {
          p_key: string
          p_note?: string
          p_outcome: string
          p_subject: string
        }
        Returns: undefined
      }
      copy_role_coverage: {
        Args: { p_from_role: string; p_to_role: string }
        Returns: number
      }
      delete_my_account: { Args: never; Returns: undefined }
      documents_used_bytes: { Args: { p_user: string }; Returns: number }
      finance_stats: {
        Args: { p_user_id: string; p_year?: number }
        Returns: {
          deductible_expenses: number
          employment_income: number
          gross_income: number
          gst_collected: number
          gst_paid: number
          total_expenses: number
        }[]
      }
      has_pro: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_agent: { Args: never; Returns: boolean }
      is_agent_of: { Args: { p_client: string }; Returns: boolean }
      is_canadian_province: { Args: { p: string }; Returns: boolean }
      is_engine_region: { Args: { r: string }; Returns: boolean }
      leave_agency: { Args: never; Returns: undefined }
      my_agency: {
        Args: never
        Returns: {
          id: string
          name: string
          organization_name: string
        }[]
      }
      my_documents_usage: { Args: never; Returns: Json }
      my_pending_invites: {
        Args: never
        Returns: {
          agency_id: string
          agency_name: string
          created_at: string
          id: string
        }[]
      }
      my_report_usage: {
        Args: never
        Returns: {
          report_limit: number
          used: number
        }[]
      }
      rate_schedule_lines: { Args: { p_schedule_ids: string[] }; Returns: Json }
      register_user_session: {
        Args: { p_device_label?: string; p_session_token: string }
        Returns: undefined
      }
      release_client: { Args: { p_client: string }; Returns: undefined }
      report_month_start: { Args: never; Returns: string }
      respond_to_agency_invite: {
        Args: { p_accept: boolean; p_invite_id: string }
        Returns: undefined
      }
      start_report: { Args: { p_kind: string }; Returns: number }
      union_engine_snapshot: { Args: never; Returns: Json }
      union_engine_version: { Args: never; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

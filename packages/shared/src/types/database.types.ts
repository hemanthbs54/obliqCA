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
      audit_events: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          actor_name: string
          actor_role: Database["public"]["Enums"]["member_role"] | null
          client_id: string | null
          client_name: string | null
          comment: string | null
          document_id: string | null
          document_name: string | null
          file_name: string | null
          firm_id: string
          from_status: Database["public"]["Enums"]["document_status"] | null
          hash: string
          id: string
          metadata: Json
          occurred_at: string
          prev_hash: string
          seq: number
          to_status: Database["public"]["Enums"]["document_status"] | null
          version_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_name: string
          actor_role?: Database["public"]["Enums"]["member_role"] | null
          client_id?: string | null
          client_name?: string | null
          comment?: string | null
          document_id?: string | null
          document_name?: string | null
          file_name?: string | null
          firm_id: string
          from_status?: Database["public"]["Enums"]["document_status"] | null
          hash?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          prev_hash?: string
          seq?: number
          to_status?: Database["public"]["Enums"]["document_status"] | null
          version_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_name?: string
          actor_role?: Database["public"]["Enums"]["member_role"] | null
          client_id?: string | null
          client_name?: string | null
          comment?: string | null
          document_id?: string | null
          document_name?: string | null
          file_name?: string | null
          firm_id?: string
          from_status?: Database["public"]["Enums"]["document_status"] | null
          hash?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          prev_hash?: string
          seq?: number
          to_status?: Database["public"]["Enums"]["document_status"] | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          assigned_by: string | null
          client_id: string
          created_at: string
          firm_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          client_id: string
          created_at?: string
          firm_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          client_id?: string
          created_at?: string
          firm_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_firm_id_client_id_fkey"
            columns: ["firm_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "client_assignments_firm_id_user_id_fkey"
            columns: ["firm_id", "user_id"]
            isOneToOne: false
            referencedRelation: "firm_memberships"
            referencedColumns: ["firm_id", "user_id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string | null
          firm_id: string
          gstin: string | null
          id: string
          name: string
          pan: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          firm_id: string
          gstin?: string | null
          id?: string
          name: string
          pan?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          firm_id?: string
          gstin?: string | null
          id?: string
          name?: string
          pan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          document_id: string
          file_name: string
          firm_id: string
          id: string
          mime_type: string
          response_note: string | null
          sha256: string
          size_bytes: number
          storage_path: string
          uploaded_at: string
          uploaded_by: string
          version_no: number
        }
        Insert: {
          document_id: string
          file_name: string
          firm_id: string
          id?: string
          mime_type: string
          response_note?: string | null
          sha256: string
          size_bytes: number
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
          version_no: number
        }
        Update: {
          document_id?: string
          file_name?: string
          firm_id?: string
          id?: string
          mime_type?: string
          response_note?: string | null
          sha256?: string
          size_bytes?: number
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_firm_id_document_id_fkey"
            columns: ["firm_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          firm_id: string
          id?: string
          last_review_comment?: string | null
          name: string
          reviewer_id?: string | null
          row_version?: number
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          firm_id?: string
          id?: string
          last_review_comment?: string | null
          name?: string
          reviewer_id?: string | null
          row_version?: number
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_current_version_fk"
            columns: ["firm_id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "documents_firm_id_client_id_fkey"
            columns: ["firm_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "documents_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_memberships: {
        Row: {
          created_at: string
          firm_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          firm_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          firm_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_memberships_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      review_decisions: {
        Row: {
          comment: string | null
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          document_id: string
          firm_id: string
          id: string
          reviewer_id: string
          version_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          document_id: string
          firm_id: string
          id?: string
          reviewer_id: string
          version_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          document_id?: string
          firm_id?: string
          id?: string
          reviewer_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_decisions_firm_id_document_id_fkey"
            columns: ["firm_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "review_decisions_firm_id_version_id_fkey"
            columns: ["firm_id", "version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["firm_id", "id"]
          },
          {
            foreignKeyName: "review_decisions_reviewer_id_fkey"
            columns: ["reviewer_id"]
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
      _actor: {
        Args: never
        Returns: {
          created_at: string
          firm_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "firm_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _append_audit_event: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_client_id?: string
          p_comment?: string
          p_document_id?: string
          p_firm_id: string
          p_from?: Database["public"]["Enums"]["document_status"]
          p_metadata?: Json
          p_to?: Database["public"]["Enums"]["document_status"]
          p_version_id?: string
        }
        Returns: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          actor_name: string
          actor_role: Database["public"]["Enums"]["member_role"] | null
          client_id: string | null
          client_name: string | null
          comment: string | null
          document_id: string | null
          document_name: string | null
          file_name: string | null
          firm_id: string
          from_status: Database["public"]["Enums"]["document_status"] | null
          hash: string
          id: string
          metadata: Json
          occurred_at: string
          prev_hash: string
          seq: number
          to_status: Database["public"]["Enums"]["document_status"] | null
          version_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "audit_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _audit_event_hash: {
        Args: { e: Database["public"]["Tables"]["audit_events"]["Row"] }
        Returns: string
      }
      _check_not_uploader: {
        Args: { d: Database["public"]["Tables"]["documents"]["Row"] }
        Returns: undefined
      }
      _check_row_version: {
        Args: {
          d: Database["public"]["Tables"]["documents"]["Row"]
          p_expected: number
        }
        Returns: undefined
      }
      _decide: {
        Args: {
          p_comment: string
          p_decision: Database["public"]["Enums"]["review_decision"]
          p_document_id: string
          p_expected_row_version: number
        }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _lock_document: {
        Args: { p_document_id: string }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _require_role: {
        Args: {
          m: Database["public"]["Tables"]["firm_memberships"]["Row"]
          p_roles: Database["public"]["Enums"]["member_role"][]
        }
        Returns: undefined
      }
      add_required_document: {
        Args: { p_client_id: string; p_name: string }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_document: {
        Args: {
          p_comment?: string
          p_document_id: string
          p_expected_row_version?: number
        }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_staff: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_client: { Args: { p_client_id: string }; Returns: boolean }
      can_access_document: { Args: { p_document_id: string }; Returns: boolean }
      create_client: {
        Args: {
          p_document_names?: string[]
          p_gstin?: string
          p_name: string
          p_pan?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          firm_id: string
          gstin: string | null
          id: string
          name: string
          pan: string | null
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_firm_id: { Args: never; Returns: string }
      current_member_role: {
        Args: never
        Returns: Database["public"]["Enums"]["member_role"]
      }
      log_access_denied: {
        Args: { p_resource_id: string; p_resource_type: string }
        Returns: boolean
      }
      record_document_upload: {
        Args: {
          p_document_id: string
          p_file_name: string
          p_mime_type: string
          p_response_note?: string
          p_sha256: string
          p_size_bytes: number
          p_storage_path: string
        }
        Returns: {
          document_id: string
          file_name: string
          firm_id: string
          id: string
          mime_type: string
          response_note: string | null
          sha256: string
          size_bytes: number
          storage_path: string
          uploaded_at: string
          uploaded_by: string
          version_no: number
        }
        SetofOptions: {
          from: "*"
          to: "document_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_correction: {
        Args: {
          p_comment: string
          p_document_id: string
          p_expected_row_version?: number
        }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_review: {
        Args: { p_document_id: string; p_expected_row_version?: number }
        Returns: {
          client_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          firm_id: string
          id: string
          last_review_comment: string | null
          name: string
          reviewer_id: string | null
          row_version: number
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      storage_object_accessible: { Args: { p_name: string }; Returns: boolean }
      verify_audit_chain: { Args: never; Returns: Json }
    }
    Enums: {
      audit_action:
        | "client.created"
        | "client.staff_assigned"
        | "document.requirement_added"
        | "document.uploaded"
        | "document.reuploaded"
        | "review.started"
        | "review.approved"
        | "review.correction_requested"
        | "access.denied"
      document_status:
        | "pending"
        | "uploaded"
        | "under_review"
        | "correction_required"
        | "approved"
      member_role: "staff" | "reviewer" | "partner"
      review_decision: "approved" | "correction_requested"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_action: [
        "client.created",
        "client.staff_assigned",
        "document.requirement_added",
        "document.uploaded",
        "document.reuploaded",
        "review.started",
        "review.approved",
        "review.correction_requested",
        "access.denied",
      ],
      document_status: [
        "pending",
        "uploaded",
        "under_review",
        "correction_required",
        "approved",
      ],
      member_role: ["staff", "reviewer", "partner"],
      review_decision: ["approved", "correction_requested"],
    },
  },
} as const


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
      abandoned_carts: {
        Row: {
          converted: boolean
          created_at: string
          customer_email: string
          customer_name: string
          emails_sent: number
          id: string
          is_completed: boolean
          language: string
          last_email_sent_at: string | null
          next_email_at: string
          product_type: string
          updated_at: string
        }
        Insert: {
          converted?: boolean
          created_at?: string
          customer_email: string
          customer_name: string
          emails_sent?: number
          id?: string
          is_completed?: boolean
          language?: string
          last_email_sent_at?: string | null
          next_email_at?: string
          product_type?: string
          updated_at?: string
        }
        Update: {
          converted?: boolean
          created_at?: string
          customer_email?: string
          customer_name?: string
          emails_sent?: number
          id?: string
          is_completed?: boolean
          language?: string
          last_email_sent_at?: string | null
          next_email_at?: string
          product_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcement_drips: {
        Row: {
          converted: boolean
          created_at: string
          email: string
          emails_sent: number
          id: string
          image_url: string | null
          is_completed: boolean
          last_email_sent_at: string | null
          next_email_at: string
          product_name: string
          product_url: string
          updated_at: string
        }
        Insert: {
          converted?: boolean
          created_at?: string
          email: string
          emails_sent?: number
          id?: string
          image_url?: string | null
          is_completed?: boolean
          last_email_sent_at?: string | null
          next_email_at?: string
          product_name?: string
          product_url?: string
          updated_at?: string
        }
        Update: {
          converted?: boolean
          created_at?: string
          email?: string
          emails_sent?: number
          id?: string
          image_url?: string | null
          is_completed?: boolean
          last_email_sent_at?: string | null
          next_email_at?: string
          product_name?: string
          product_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string | null
          metadata: Json
          name: string | null
          product_type: string | null
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string | null
          metadata?: Json
          name?: string | null
          product_type?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          metadata?: Json
          name?: string | null
          product_type?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          event_name: string
          id: string
          page_path: string | null
          product_id: string | null
          referrer: string | null
          session_id: string | null
          value: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          event_name: string
          id?: string
          page_path?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          value?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          event_name?: string
          id?: string
          page_path?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          value?: number | null
        }
        Relationships: []
      }
      hotmart_purchases: {
        Row: {
          created_at: string
          email: string
          id: string
          product_code: string | null
          product_id: string | null
          purchased_at: string
          raw_payload: Json | null
          refund_deadline: string
          status: string
          transaction_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_code?: string | null
          product_id?: string | null
          purchased_at?: string
          raw_payload?: Json | null
          refund_deadline?: string
          status?: string
          transaction_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_code?: string | null
          product_id?: string | null
          purchased_at?: string
          raw_payload?: Json | null
          refund_deadline?: string
          status?: string
          transaction_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      paypal_webhook_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          event_id: string
          event_type: string
          id: string
          payload: Json
          resource_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          payload: Json
          resource_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          resource_id?: string | null
        }
        Relationships: []
      }
      review_invitations: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          emails_sent: number
          has_reviewed: boolean
          id: string
          is_completed: boolean
          last_email_sent_at: string | null
          next_email_at: string
          product_name: string
          product_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string
          emails_sent?: number
          has_reviewed?: boolean
          id?: string
          is_completed?: boolean
          last_email_sent_at?: string | null
          next_email_at?: string
          product_name?: string
          product_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          emails_sent?: number
          has_reviewed?: boolean
          id?: string
          is_completed?: boolean
          last_email_sent_at?: string | null
          next_email_at?: string
          product_name?: string
          product_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          photo_urls: string[] | null
          product_type: string
          rating: number
          review_text: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          photo_urls?: string[] | null
          product_type?: string
          rating?: number
          review_text: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          photo_urls?: string[] | null
          product_type?: string
          rating?: number
          review_text?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_sales: {
        Row: {
          country: string | null
          created_at: string
          customer_name: string
          id: string
          order_created_at: string
          product_key: string
          product_name: string
          shopify_order_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          customer_name: string
          id?: string
          order_created_at: string
          product_key?: string
          product_name: string
          shopify_order_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          order_created_at?: string
          product_key?: string
          product_name?: string
          shopify_order_id?: string
        }
        Relationships: []
      }
      store_subscribers: {
        Row: {
          announcement_sent: boolean
          created_at: string
          email: string
          id: string
          product_type: string
          store_name: string
          updated_at: string
        }
        Insert: {
          announcement_sent?: boolean
          created_at?: string
          email: string
          id?: string
          product_type?: string
          store_name?: string
          updated_at?: string
        }
        Update: {
          announcement_sent?: boolean
          created_at?: string
          email?: string
          id?: string
          product_type?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      webhook_alerts: {
        Row: {
          created_at: string
          data_id: string | null
          error_message: string | null
          event_type: string | null
          http_status: number | null
          id: string
          notified: boolean
          payload: Json | null
          provider: string
          reason: string
          severity: string
        }
        Insert: {
          created_at?: string
          data_id?: string | null
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          notified?: boolean
          payload?: Json | null
          provider: string
          reason: string
          severity?: string
        }
        Update: {
          created_at?: string
          data_id?: string | null
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          notified?: boolean
          payload?: Json | null
          provider?: string
          reason?: string
          severity?: string
        }
        Relationships: []
      }
    }
    Views: {
      reviews_public: {
        Row: {
          created_at: string | null
          customer_name: string | null
          id: string | null
          photo_urls: string[] | null
          product_type: string | null
          rating: number | null
          review_text: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          photo_urls?: string[] | null
          product_type?: string | null
          rating?: number | null
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          photo_urls?: string[] | null
          product_type?: string | null
          rating?: number | null
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shopify_sales_public: {
        Row: {
          country: string | null
          customer_name: string | null
          order_created_at: string | null
          product_key: string | null
          product_name: string | null
        }
        Insert: {
          country?: string | null
          customer_name?: string | null
          order_created_at?: string | null
          product_key?: string | null
          product_name?: string | null
        }
        Update: {
          country?: string | null
          customer_name?: string | null
          order_created_at?: string | null
          product_key?: string | null
          product_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
    Enums: {},
  },
} as const

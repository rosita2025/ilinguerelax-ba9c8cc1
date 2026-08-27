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
  public: {
    Tables: {
      admin_payment_errors: {
        Row: {
          created_at: string | null
          error_detail: Json | null
          error_kind: string | null
          error_message: string | null
          http_status: number | null
          id: string
          order_id: string | null
          provider: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          error_detail?: Json | null
          error_kind?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          order_id?: string | null
          provider?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          error_detail?: Json | null
          error_kind?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          order_id?: string | null
          provider?: string | null
          url?: string | null
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
      binance_pay_configs: {
        Row: {
          active: boolean
          address: string
          created_at: string
          holder_name: string
          id: string
          network: string
          notes: string | null
          pay_id: string | null
          qr_url: string
          region_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address: string
          created_at?: string
          holder_name: string
          id?: string
          network?: string
          notes?: string | null
          pay_id?: string | null
          qr_url: string
          region_code: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          holder_name?: string
          id?: string
          network?: string
          notes?: string | null
          pay_id?: string | null
          qr_url?: string
          region_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_queue: {
        Row: {
          attempts: number
          batch: string | null
          category: string
          created_at: string
          error: string | null
          id: string
          keyword: string
          language: string
          post_id: string | null
          post_slug: string | null
          scheduled_at: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          batch?: string | null
          category?: string
          created_at?: string
          error?: string | null
          id?: string
          keyword: string
          language?: string
          post_id?: string | null
          post_slug?: string | null
          scheduled_at: string
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          batch?: string | null
          category?: string
          created_at?: string
          error?: string | null
          id?: string
          keyword?: string
          language?: string
          post_id?: string | null
          post_slug?: string | null
          scheduled_at?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_filters: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          kind: string
          note: string | null
          pattern: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          note?: string | null
          pattern: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          note?: string | null
          pattern?: string
          updated_at?: string
        }
        Relationships: []
      }
      brevo_product_audiences: {
        Row: {
          active: boolean
          created_at: string
          event_kind: string
          id: string
          label: string | null
          list_id: number
          match_type: string
          match_value: string
          notes: string | null
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_kind?: string
          id?: string
          label?: string | null
          list_id: number
          match_type: string
          match_value: string
          notes?: string | null
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_kind?: string
          id?: string
          label?: string | null
          list_id?: number
          match_type?: string
          match_value?: string
          notes?: string | null
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brevo_sync_logs: {
        Row: {
          attributes: Json | null
          created_at: string
          email: string | null
          error: string | null
          event_type: string
          http_status: number | null
          id: string
          order_ref: string | null
          origin: string | null
          product_name: string | null
          product_sku: string | null
          response: string | null
          source: string | null
          status: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          email?: string | null
          error?: string | null
          event_type: string
          http_status?: number | null
          id?: string
          order_ref?: string | null
          origin?: string | null
          product_name?: string | null
          product_sku?: string | null
          response?: string | null
          source?: string | null
          status: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          email?: string | null
          error?: string | null
          event_type?: string
          http_status?: number | null
          id?: string
          order_ref?: string | null
          origin?: string | null
          product_name?: string | null
          product_sku?: string | null
          response?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      cart_reminder_config: {
        Row: {
          enabled_steps: number[]
          id: number
          paused: boolean
          send_hour: number
          timezone: string
          updated_at: string
        }
        Insert: {
          enabled_steps?: number[]
          id?: number
          paused?: boolean
          send_hour?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          enabled_steps?: number[]
          id?: number
          paused?: boolean
          send_hour?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_reminder_sends: {
        Row: {
          cart_url: string | null
          email: string
          error: string | null
          id: string
          origin: string
          product_sku: string
          sent_at: string
          status: string
          step: number
        }
        Insert: {
          cart_url?: string | null
          email: string
          error?: string | null
          id?: string
          origin: string
          product_sku: string
          sent_at?: string
          status?: string
          step: number
        }
        Update: {
          cart_url?: string | null
          email?: string
          error?: string | null
          id?: string
          origin?: string
          product_sku?: string
          sent_at?: string
          status?: string
          step?: number
        }
        Relationships: []
      }
      checkout_ip_bans: {
        Row: {
          banned_until: string
          created_at: string
          hits: number
          ip: string
          reason: string
          ua: string | null
          updated_at: string
        }
        Insert: {
          banned_until: string
          created_at?: string
          hits?: number
          ip: string
          reason?: string
          ua?: string | null
          updated_at?: string
        }
        Update: {
          banned_until?: string
          created_at?: string
          hits?: number
          ip?: string
          reason?: string
          ua?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_method_suppressions: {
        Row: {
          method_key: string
          region_code: string
          suppressed_at: string
        }
        Insert: {
          method_key: string
          region_code: string
          suppressed_at?: string
        }
        Update: {
          method_key?: string
          region_code?: string
          suppressed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_method_suppressions_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "checkout_regions"
            referencedColumns: ["code"]
          },
        ]
      }
      checkout_payment_methods: {
        Row: {
          created_at: string
          enabled: boolean
          icon: string
          id: string
          label: string
          method_key: string
          note: string | null
          region_code: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label: string
          method_key: string
          note?: string | null
          region_code: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label?: string
          method_key?: string
          note?: string | null
          region_code?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_payment_methods_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "checkout_regions"
            referencedColumns: ["code"]
          },
        ]
      }
      checkout_rate_hits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          geo_checked_at: string | null
          id: number
          ip: string
          referer: string | null
          slug: string | null
          source: string | null
          ua: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          geo_checked_at?: string | null
          id?: number
          ip: string
          referer?: string | null
          slug?: string | null
          source?: string | null
          ua?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          geo_checked_at?: string | null
          id?: number
          ip?: string
          referer?: string | null
          slug?: string | null
          source?: string | null
          ua?: string | null
        }
        Relationships: []
      }
      checkout_regions: {
        Row: {
          code: string
          country_codes: string[]
          created_at: string
          currency: string
          description: string | null
          enabled: boolean
          flag: string | null
          gateway: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          country_codes?: string[]
          created_at?: string
          currency: string
          description?: string | null
          enabled?: boolean
          flag?: string | null
          gateway?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          country_codes?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          enabled?: boolean
          flag?: string | null
          gateway?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          extra: Json | null
          id: string
          message: string | null
          release: string | null
          route: string | null
          source: string
          stack: string | null
          url: string | null
          user_agent: string | null
          viewport: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          extra?: Json | null
          id?: string
          message?: string | null
          release?: string | null
          route?: string | null
          source: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          viewport?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          extra?: Json | null
          id?: string
          message?: string | null
          release?: string | null
          route?: string | null
          source?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          viewport?: string | null
        }
        Relationships: []
      }
      country_language_map: {
        Row: {
          country_code: string
          created_at: string
          language: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          language: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          language?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_delivery_alerts: {
        Row: {
          created_at: string
          customer_email: string | null
          details: Json | null
          id: string
          reason: string
          resolved: boolean
          source: string
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          details?: Json | null
          id?: string
          reason: string
          resolved?: boolean
          source: string
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          details?: Json | null
          id?: string
          reason?: string
          resolved?: boolean
          source?: string
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      digital_delivery_audit: {
        Row: {
          country: string | null
          created_at: string
          customer_email: string
          customer_name: string | null
          error: string | null
          id: string
          idempotency_key: string | null
          items: Json
          lang: string | null
          message_id: string | null
          missing_skus: string[]
          normalized_skus: string[]
          order_id: string | null
          provider: string | null
          requested_skus: string[]
          resolved_skus: string[]
          source: string | null
          status: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          items?: Json
          lang?: string | null
          message_id?: string | null
          missing_skus?: string[]
          normalized_skus?: string[]
          order_id?: string | null
          provider?: string | null
          requested_skus?: string[]
          resolved_skus?: string[]
          source?: string | null
          status: string
        }
        Update: {
          country?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          items?: Json
          lang?: string | null
          message_id?: string | null
          missing_skus?: string[]
          normalized_skus?: string[]
          order_id?: string | null
          provider?: string | null
          requested_skus?: string[]
          resolved_skus?: string[]
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      digital_delivery_config: {
        Row: {
          enabled: boolean
          id: number
          max_attempts: number
          retry_after_minutes: number
          scan_window_hours: number
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          max_attempts?: number
          retry_after_minutes?: number
          scan_window_hours?: number
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          max_attempts?: number
          retry_after_minutes?: number
          scan_window_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      digital_email_sends: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          customer_country: string | null
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          event_count: number
          events: Json
          id: string
          idempotency_key: string
          last_event: string | null
          last_event_at: string | null
          last_retry_at: string | null
          message_id: string | null
          order_id: string | null
          provider: string | null
          retry_attempts: number
          skus: string[]
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          customer_country?: string | null
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          event_count?: number
          events?: Json
          id?: string
          idempotency_key: string
          last_event?: string | null
          last_event_at?: string | null
          last_retry_at?: string | null
          message_id?: string | null
          order_id?: string | null
          provider?: string | null
          retry_attempts?: number
          skus?: string[]
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          customer_country?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          event_count?: number
          events?: Json
          id?: string
          idempotency_key?: string
          last_event?: string | null
          last_event_at?: string | null
          last_retry_at?: string | null
          message_id?: string | null
          order_id?: string | null
          provider?: string | null
          retry_attempts?: number
          skus?: string[]
          status?: string | null
        }
        Relationships: []
      }
      digital_product_changes: {
        Row: {
          action: string
          changed_fields: Json
          created_at: string
          id: number
          sku: string
        }
        Insert: {
          action: string
          changed_fields?: Json
          created_at?: string
          id?: number
          sku: string
        }
        Update: {
          action?: string
          changed_fields?: Json
          created_at?: string
          id?: number
          sku?: string
        }
        Relationships: []
      }
      digital_products: {
        Row: {
          access_key: string | null
          active: boolean
          bonus_access_key: string | null
          bonus_drive_url: string | null
          bonus_name: string | null
          bonus_titles: Json | null
          bonuses: Json
          compare_at_price_pen: number | null
          compare_at_price_usd: number | null
          compare_at_price_usd_latam: number | null
          compare_at_price_usd_tienda: number | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          drive_url: string | null
          excluded_countries: string[]
          gallery_images: string[] | null
          gallery_metadata: Json | null
          hotmart_excluded_countries: string[]
          hotmart_prices_by_country: Json
          hotmart_url: string | null
          hotmart_urls_by_country: Json
          id: string
          is_physical: boolean
          is_upsell: boolean
          learner_language: string
          local_compare_at_prices: Json | null
          local_prices: Json
          local_usd_prices: Json | null
          mp_preference_template: Json | null
          name: string
          price_pen: number | null
          price_usd: number
          price_usd_latam: number | null
          price_usd_tienda: number | null
          rating: number | null
          review_count: number | null
          sku: string
          sku_aliases: string[]
          sort_order: number
          store_enabled: boolean
          store_excluded_countries: string[]
          stripe_price_id: string | null
          stripe_product_id: string | null
          target_language: string
          updated_at: string
        }
        Insert: {
          access_key?: string | null
          active?: boolean
          bonus_access_key?: string | null
          bonus_drive_url?: string | null
          bonus_name?: string | null
          bonus_titles?: Json | null
          bonuses?: Json
          compare_at_price_pen?: number | null
          compare_at_price_usd?: number | null
          compare_at_price_usd_latam?: number | null
          compare_at_price_usd_tienda?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drive_url?: string | null
          excluded_countries?: string[]
          gallery_images?: string[] | null
          gallery_metadata?: Json | null
          hotmart_excluded_countries?: string[]
          hotmart_prices_by_country?: Json
          hotmart_url?: string | null
          hotmart_urls_by_country?: Json
          id?: string
          is_physical?: boolean
          is_upsell?: boolean
          learner_language?: string
          local_compare_at_prices?: Json | null
          local_prices?: Json
          local_usd_prices?: Json | null
          mp_preference_template?: Json | null
          name: string
          price_pen?: number | null
          price_usd?: number
          price_usd_latam?: number | null
          price_usd_tienda?: number | null
          rating?: number | null
          review_count?: number | null
          sku: string
          sku_aliases?: string[]
          sort_order?: number
          store_enabled?: boolean
          store_excluded_countries?: string[]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          target_language?: string
          updated_at?: string
        }
        Update: {
          access_key?: string | null
          active?: boolean
          bonus_access_key?: string | null
          bonus_drive_url?: string | null
          bonus_name?: string | null
          bonus_titles?: Json | null
          bonuses?: Json
          compare_at_price_pen?: number | null
          compare_at_price_usd?: number | null
          compare_at_price_usd_latam?: number | null
          compare_at_price_usd_tienda?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drive_url?: string | null
          excluded_countries?: string[]
          gallery_images?: string[] | null
          gallery_metadata?: Json | null
          hotmart_excluded_countries?: string[]
          hotmart_prices_by_country?: Json
          hotmart_url?: string | null
          hotmart_urls_by_country?: Json
          id?: string
          is_physical?: boolean
          is_upsell?: boolean
          learner_language?: string
          local_compare_at_prices?: Json | null
          local_prices?: Json
          local_usd_prices?: Json | null
          mp_preference_template?: Json | null
          name?: string
          price_pen?: number | null
          price_usd?: number
          price_usd_latam?: number | null
          price_usd_tienda?: number | null
          rating?: number | null
          review_count?: number | null
          sku?: string
          sku_aliases?: string[]
          sort_order?: number
          store_enabled?: boolean
          store_excluded_countries?: string[]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          target_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_token_access: {
        Row: {
          action: string
          created_at: string
          id: number
          ip: string | null
          sku: string | null
          token_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip?: string | null
          sku?: string | null
          token_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip?: string | null
          sku?: string | null
          token_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_token_access_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "download_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      download_tokens: {
        Row: {
          created_at: string
          download_count: number
          email: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          last_sent_at: string | null
          max_downloads: number
          order_number: string
          revoked: boolean
          skus: string[]
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          email: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          last_sent_at?: string | null
          max_downloads?: number
          order_number: string
          revoked?: boolean
          skus?: string[]
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_count?: number
          email?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          last_sent_at?: string | null
          max_downloads?: number
          order_number?: string
          revoked?: boolean
          skus?: string[]
          token?: string
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
      email_delivery_events: {
        Row: {
          created_at: string
          event: string
          id: string
          message_id: string | null
          occurred_at: string | null
          order_id: string | null
          provider: string
          raw: Json
          reason: string | null
          recipient_email: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          message_id?: string | null
          occurred_at?: string | null
          order_id?: string | null
          provider?: string
          raw?: Json
          reason?: string | null
          recipient_email?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          message_id?: string | null
          occurred_at?: string | null
          order_id?: string | null
          provider?: string
          raw?: Json
          reason?: string | null
          recipient_email?: string | null
        }
        Relationships: []
      }
      email_domain_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          kind: string
          list_type: string
          maps_to: string | null
          note: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          list_type: string
          maps_to?: string | null
          note?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          list_type?: string
          maps_to?: string | null
          note?: string | null
          updated_at?: string
          value?: string
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
      exchange_rate_history: {
        Row: {
          code: string
          created_at: string | null
          id: string
          rate: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          rate: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          rate?: number
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          code: string
          last_updated: string | null
          markup_percent: number
          rate: number
        }
        Insert: {
          code: string
          last_updated?: string | null
          markup_percent?: number
          rate: number
        }
        Update: {
          code?: string
          last_updated?: string | null
          markup_percent?: number
          rate?: number
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          bot_reason: string | null
          client_id: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          error_reason: string | null
          event_name: string
          id: string
          ip: string | null
          is_bot: boolean
          name: string | null
          page_path: string | null
          product_id: string | null
          provider: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          value: number | null
        }
        Insert: {
          bot_reason?: string | null
          client_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          error_reason?: string | null
          event_name: string
          id?: string
          ip?: string | null
          is_bot?: boolean
          name?: string | null
          page_path?: string | null
          product_id?: string | null
          provider?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          value?: number | null
        }
        Update: {
          bot_reason?: string | null
          client_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          error_reason?: string | null
          event_name?: string
          id?: string
          ip?: string | null
          is_bot?: boolean
          name?: string | null
          page_path?: string | null
          product_id?: string | null
          provider?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          value?: number | null
        }
        Relationships: []
      }
      generated_blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string
          google_index_requested_at: string | null
          id: string
          image: string
          keyword: string | null
          published: boolean
          read_time: string
          related_products: string[]
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content: string
          created_at?: string
          excerpt: string
          google_index_requested_at?: string | null
          id?: string
          image?: string
          keyword?: string | null
          published?: boolean
          read_time?: string
          related_products?: string[]
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          google_index_requested_at?: string | null
          id?: string
          image?: string
          keyword?: string | null
          published?: boolean
          read_time?: string
          related_products?: string[]
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      indexing_events: {
        Row: {
          channel: string
          created_at: string
          detail: string | null
          http_status: number | null
          id: string
          status: string
          target: string | null
          url: string
        }
        Insert: {
          channel: string
          created_at?: string
          detail?: string | null
          http_status?: number | null
          id?: string
          status?: string
          target?: string | null
          url: string
        }
        Update: {
          channel?: string
          created_at?: string
          detail?: string | null
          http_status?: number | null
          id?: string
          status?: string
          target?: string | null
          url?: string
        }
        Relationships: []
      }
      manual_payments: {
        Row: {
          amount_local: number | null
          amount_usd: number
          buyer_country: string | null
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          currency_local: string | null
          id: string
          items: Json
          method: string
          notes: string | null
          order_number: string
          payment_reference: string | null
          payment_reference_at: string | null
          payment_reference_source: string | null
          shipping_proof_url: string | null
          shipping_provider: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_local?: number | null
          amount_usd: number
          buyer_country?: string | null
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          currency_local?: string | null
          id?: string
          items?: Json
          method?: string
          notes?: string | null
          order_number: string
          payment_reference?: string | null
          payment_reference_at?: string | null
          payment_reference_source?: string | null
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_local?: number | null
          amount_usd?: number
          buyer_country?: string | null
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          currency_local?: string | null
          id?: string
          items?: Json
          method?: string
          notes?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_reference_at?: string | null
          payment_reference_source?: string | null
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      marketing_drip_config: {
        Row: {
          category: string
          day_offset: number
          enabled: boolean
          id: string
          step_name: string
          template_key: string
          updated_at: string
        }
        Insert: {
          category: string
          day_offset: number
          enabled?: boolean
          id?: string
          step_name: string
          template_key: string
          updated_at?: string
        }
        Update: {
          category?: string
          day_offset?: number
          enabled?: boolean
          id?: string
          step_name?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_drip_sends: {
        Row: {
          category: string
          created_at: string
          email: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          step_name: string
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          step_name: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          step_name?: string
        }
        Relationships: []
      }
      meta_attribution: {
        Row: {
          country: string | null
          created_at: string
          email: string
          expires_at: string
          fbc: string | null
          fbp: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          expires_at?: string
          fbc?: string | null
          fbp?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          fbc?: string | null
          fbp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_drip_config: {
        Row: {
          day_offset: number
          enabled: boolean
          product_sku: string | null
          step: number
          template_key: string
          updated_at: string
        }
        Insert: {
          day_offset: number
          enabled?: boolean
          product_sku?: string | null
          step: number
          template_key: string
          updated_at?: string
        }
        Update: {
          day_offset?: number
          enabled?: boolean
          product_sku?: string | null
          step?: number
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_drip_sends: {
        Row: {
          created_at: string
          email: string
          error: string | null
          id: string
          metadata: Json
          sent_at: string | null
          status: string
          step: number
        }
        Insert: {
          created_at?: string
          email: string
          error?: string | null
          id?: string
          metadata?: Json
          sent_at?: string | null
          status?: string
          step: number
        }
        Update: {
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          metadata?: Json
          sent_at?: string | null
          status?: string
          step?: number
        }
        Relationships: []
      }
      order_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          customer_email: string | null
          detail: string | null
          event: string
          id: string
          metadata: Json
          method: string | null
          order_number: string
          provider: string
          reference: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          detail?: string | null
          event: string
          id?: string
          metadata?: Json
          method?: string | null
          order_number: string
          provider?: string
          reference?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          detail?: string | null
          event?: string
          id?: string
          metadata?: Json
          method?: string | null
          order_number?: string
          provider?: string
          reference?: string | null
          status?: string | null
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
          order_number: string | null
          payload: Json | null
          provider: string
          reference: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
          order_number?: string | null
          payload?: Json | null
          provider: string
          reference?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
          order_number?: string | null
          payload?: Json | null
          provider?: string
          reference?: string | null
          status?: string | null
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
      pending_payment_reminders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          id: string
          last_sent_at: string | null
          metadata: Json
          method: string | null
          next_at: string
          order_created_at: string
          order_number: string
          product_name: string | null
          provider: string
          resolved: boolean
          resolved_at: string | null
          resolved_reason: string | null
          step: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          last_sent_at?: string | null
          metadata?: Json
          method?: string | null
          next_at?: string
          order_created_at?: string
          order_number: string
          product_name?: string | null
          provider?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_reason?: string | null
          step?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          last_sent_at?: string | null
          metadata?: Json
          method?: string | null
          next_at?: string
          order_created_at?: string
          order_number?: string
          product_name?: string | null
          provider?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_reason?: string | null
          step?: number
          updated_at?: string
        }
        Relationships: []
      }
      persistent_carts: {
        Row: {
          buyer: Json
          cart_token: string
          converted: boolean
          country: string | null
          created_at: string
          email: string
          id: string
          items: Json
          language: string | null
          last_activity: string
          updated_at: string
        }
        Insert: {
          buyer?: Json
          cart_token?: string
          converted?: boolean
          country?: string | null
          created_at?: string
          email: string
          id?: string
          items?: Json
          language?: string | null
          last_activity?: string
          updated_at?: string
        }
        Update: {
          buyer?: Json
          cart_token?: string
          converted?: boolean
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          items?: Json
          language?: string | null
          last_activity?: string
          updated_at?: string
        }
        Relationships: []
      }
      physical_shipments: {
        Row: {
          created_at: string
          customer_name: string | null
          email: string | null
          order_number: string
          provider: string | null
          shipping_address: Json | null
          shipping_proof_url: string | null
          shipping_provider: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          order_number: string
          provider?: string | null
          shipping_address?: Json | null
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          order_number?: string
          provider?: string | null
          shipping_address?: Json | null
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pinterest_publications: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          image_url: string | null
          kind: string
          pin_id: string | null
          status: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          pin_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          pin_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      product_launch_notices: {
        Row: {
          audience: string
          created_at: string
          email: string
          error: string | null
          id: string
          launch_key: string
          metadata: Json
          sku: string
          status: string
        }
        Insert: {
          audience: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          launch_key: string
          metadata?: Json
          sku: string
          status?: string
        }
        Update: {
          audience?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          launch_key?: string
          metadata?: Json
          sku?: string
          status?: string
        }
        Relationships: []
      }
      product_upsells: {
        Row: {
          created_at: string
          discount_pct: number
          id: string
          product_sku: string
          sort_order: number
          updated_at: string
          upsell_sku: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          id?: string
          product_sku: string
          sort_order?: number
          updated_at?: string
          upsell_sku: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          id?: string
          product_sku?: string
          sort_order?: number
          updated_at?: string
          upsell_sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_upsells_product_sku_fkey"
            columns: ["product_sku"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["sku"]
          },
          {
            foreignKeyName: "product_upsells_product_sku_fkey"
            columns: ["product_sku"]
            isOneToOne: false
            referencedRelation: "digital_products_public"
            referencedColumns: ["sku"]
          },
          {
            foreignKeyName: "product_upsells_upsell_sku_fkey"
            columns: ["upsell_sku"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["sku"]
          },
          {
            foreignKeyName: "product_upsells_upsell_sku_fkey"
            columns: ["upsell_sku"]
            isOneToOne: false
            referencedRelation: "digital_products_public"
            referencedColumns: ["sku"]
          },
        ]
      }
      product_version_notices: {
        Row: {
          created_at: string
          email: string
          error: string | null
          id: string
          metadata: Json
          notice_key: string
          order_number: string | null
          sku: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          error?: string | null
          id?: string
          metadata?: Json
          notice_key: string
          order_number?: string | null
          sku: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          metadata?: Json
          notice_key?: string
          order_number?: string | null
          sku?: string
          status?: string
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
          shipping_proof_url: string | null
          shipping_provider: string | null
          shopify_order_id: string
          tracking_number: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          customer_name: string
          id?: string
          order_created_at: string
          product_key?: string
          product_name: string
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          shopify_order_id: string
          tracking_number?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          order_created_at?: string
          product_key?: string
          product_name?: string
          shipping_proof_url?: string | null
          shipping_provider?: string | null
          shopify_order_id?: string
          tracking_number?: string | null
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      digital_products_public: {
        Row: {
          active: boolean | null
          bonus_name: string | null
          bonus_titles: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          excluded_countries: string[] | null
          hotmart_excluded_countries: string[] | null
          hotmart_prices_by_country: Json | null
          hotmart_url: string | null
          hotmart_urls_by_country: Json | null
          id: string | null
          is_physical: boolean | null
          is_upsell: boolean | null
          learner_language: string | null
          local_prices: Json | null
          name: string | null
          price_pen: number | null
          price_usd: number | null
          price_usd_latam: number | null
          price_usd_tienda: number | null
          sku: string | null
          sku_aliases: string[] | null
          sort_order: number | null
          store_enabled: boolean | null
          store_excluded_countries: string[] | null
          target_language: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bonus_name?: string | null
          bonus_titles?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          excluded_countries?: string[] | null
          hotmart_excluded_countries?: string[] | null
          hotmart_prices_by_country?: Json | null
          hotmart_url?: string | null
          hotmart_urls_by_country?: Json | null
          id?: string | null
          is_physical?: boolean | null
          is_upsell?: boolean | null
          learner_language?: string | null
          local_prices?: Json | null
          name?: string | null
          price_pen?: number | null
          price_usd?: number | null
          price_usd_latam?: number | null
          price_usd_tienda?: number | null
          sku?: string | null
          sku_aliases?: string[] | null
          sort_order?: number | null
          store_enabled?: boolean | null
          store_excluded_countries?: string[] | null
          target_language?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bonus_name?: string | null
          bonus_titles?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          excluded_countries?: string[] | null
          hotmart_excluded_countries?: string[] | null
          hotmart_prices_by_country?: Json | null
          hotmart_url?: string | null
          hotmart_urls_by_country?: Json | null
          id?: string | null
          is_physical?: boolean | null
          is_upsell?: boolean | null
          learner_language?: string | null
          local_prices?: Json | null
          name?: string | null
          price_pen?: number | null
          price_usd?: number | null
          price_usd_latam?: number | null
          price_usd_tienda?: number | null
          sku?: string | null
          sku_aliases?: string[] | null
          sort_order?: number | null
          store_enabled?: boolean | null
          store_excluded_countries?: string[] | null
          target_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          customer_name?: never
          order_created_at?: string | null
          product_key?: string | null
          product_name?: string | null
        }
        Update: {
          country?: string | null
          customer_name?: never
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      verify_cron_key: { Args: { _key: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

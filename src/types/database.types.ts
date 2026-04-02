export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admins: {
        Row: {
          avatar_url: string | null;
          contact_number: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["admin_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          contact_number?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          contact_number?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      attribute_options: {
        Row: {
          attribute_id: string;
          created_at: string;
          id: string;
          option_text: string;
          option_value: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          attribute_id: string;
          created_at?: string;
          id?: string;
          option_text: string;
          option_value?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          attribute_id?: string;
          created_at?: string;
          id?: string;
          option_text?: string;
          option_value?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_options_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
        ];
      };
      attributes: {
        Row: {
          attribute_code: string;
          attribute_name: string;
          created_at: string;
          display_on_frontend: boolean;
          id: string;
          is_filterable: boolean;
          is_required: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          attribute_code: string;
          attribute_name: string;
          created_at?: string;
          display_on_frontend?: boolean;
          id?: string;
          is_filterable?: boolean;
          is_required?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          attribute_code?: string;
          attribute_name?: string;
          created_at?: string;
          display_on_frontend?: boolean;
          id?: string;
          is_filterable?: boolean;
          is_required?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          include_in_nav: boolean;
          slug: string;
          sort_order: number;
          status: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          include_in_nav?: boolean;
          slug: string;
          sort_order?: number;
          status?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          include_in_nav?: boolean;
          slug?: string;
          sort_order?: number;
          status?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      order_activities: {
        Row: {
          admin_user_id: string | null;
          comment: string | null;
          created_at: string;
          customer_notified: boolean;
          id: string;
          order_id: string;
          updated_at: string;
        };
        Insert: {
          admin_user_id?: string | null;
          comment?: string | null;
          created_at?: string;
          customer_notified?: boolean;
          id?: string;
          order_id: string;
          updated_at?: string;
        };
        Update: {
          admin_user_id?: string | null;
          comment?: string | null;
          created_at?: string;
          customer_notified?: boolean;
          id?: string;
          order_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_activities_admin_user_id_fkey1";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_activities_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_addresses: {
        Row: {
          address_line: string;
          address_type: Database["public"]["Enums"]["address_type"];
          city: string;
          country: string;
          created_at: string;
          full_name: string;
          id: string;
          order_id: string;
          phone: string;
          postal_code: string | null;
        };
        Insert: {
          address_line: string;
          address_type: Database["public"]["Enums"]["address_type"];
          city: string;
          country: string;
          created_at?: string;
          full_name: string;
          id?: string;
          order_id: string;
          phone: string;
          postal_code?: string | null;
        };
        Update: {
          address_line?: string;
          address_type?: Database["public"]["Enums"]["address_type"];
          city?: string;
          country?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          order_id?: string;
          phone?: string;
          postal_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_addresses_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_item_attributes: {
        Row: {
          attribute_id: string;
          attribute_name: string;
          id: string;
          option_id: string | null;
          option_text: string;
          order_item_id: string;
        };
        Insert: {
          attribute_id: string;
          attribute_name: string;
          id?: string;
          option_id?: string | null;
          option_text: string;
          order_item_id: string;
        };
        Update: {
          attribute_id?: string;
          attribute_name?: string;
          id?: string;
          option_id?: string | null;
          option_text?: string;
          order_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_item_attributes_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_item_attributes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "attribute_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_item_attributes_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          sku: string;
          subtotal: number;
          title: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          sku: string;
          subtotal: number;
          title: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          order_id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
          sku?: string;
          subtotal?: number;
          title?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          email: string;
          id: string;
          order_number: string;
          order_status: Database["public"]["Enums"]["order_status"];
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          placed_at: string;
          shipment_status: Database["public"]["Enums"]["shipment_status"];
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          email: string;
          id?: string;
          order_number: string;
          order_status?: Database["public"]["Enums"]["order_status"];
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          placed_at?: string;
          shipment_status?: Database["public"]["Enums"]["shipment_status"];
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          email?: string;
          id?: string;
          order_number?: string;
          order_status?: Database["public"]["Enums"]["order_status"];
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          placed_at?: string;
          shipment_status?: Database["public"]["Enums"]["shipment_status"];
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          order_id: string;
          provider: string;
          status: Database["public"]["Enums"]["transaction_status"];
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          order_id: string;
          provider: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          order_id?: string;
          provider?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_attribute_values: {
        Row: {
          attribute_id: string;
          created_at: string;
          id: string;
          option_id: string | null;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          attribute_id: string;
          created_at?: string;
          id?: string;
          option_id?: string | null;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          attribute_id?: string;
          created_at?: string;
          id?: string;
          option_id?: string | null;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attribute_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "attribute_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_collections: {
        Row: {
          collection_id: string;
          product_id: string;
        };
        Insert: {
          collection_id: string;
          product_id: string;
        };
        Update: {
          collection_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_collections_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt: string | null;
          created_at: string;
          id: string;
          image_url: string;
          product_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          product_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          product_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          created_at: string;
          id: string;
          parent_product_id: string;
          price: number | null;
          quantity: number;
          sku: string;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
          variant_group_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          parent_product_id: string;
          price?: number | null;
          quantity?: number;
          sku: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          variant_group_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          parent_product_id?: string;
          price?: number | null;
          quantity?: number;
          sku?: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          variant_group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_parent_product_id_fkey";
            columns: ["parent_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_variant_group_id_fkey";
            columns: ["variant_group_id"];
            isOneToOne: false;
            referencedRelation: "variant_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          fts: unknown;
          id: string;
          price: number;
          quantity: number;
          short_description: string | null;
          sku: string;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          title: string;
          type: Database["public"]["Enums"]["product_type"];
          updated_at: string;
          visibility: boolean;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          fts?: unknown;
          id?: string;
          price?: number;
          quantity?: number;
          short_description?: string | null;
          sku: string;
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          title: string;
          type?: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
          visibility?: boolean;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          fts?: unknown;
          id?: string;
          price?: number;
          quantity?: number;
          short_description?: string | null;
          sku?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          title?: string;
          type?: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
          visibility?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_attribute_values: {
        Row: {
          attribute_id: string;
          created_at: string;
          id: string;
          option_id: string | null;
          text_value: string | null;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          attribute_id: string;
          created_at?: string;
          id?: string;
          option_id?: string | null;
          text_value?: string | null;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          attribute_id?: string;
          created_at?: string;
          id?: string;
          option_id?: string | null;
          text_value?: string | null;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_attribute_values_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_attribute_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "attribute_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_attribute_values_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_groups: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_groups_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_images: {
        Row: {
          alt: string | null;
          created_at: string;
          id: string;
          image_url: string;
          sort_order: number;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          sort_order?: number;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          sort_order?: number;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_draft_orders: { Args: never; Returns: undefined };
      create_order: { Args: { p_order_data: Json }; Returns: Json };
      get_plp_products: {
        Args: {
          p_category_slug: string;
          p_filters?: string;
          p_page?: number;
          p_sort?: string;
        };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
      is_super_admin: { Args: never; Returns: boolean };
      slugify: { Args: { input_text: string }; Returns: string };
    };
    Enums: {
      address_type: "SHIPPING" | "BILLING";
      admin_role: "super_admin" | "test_admin";
      order_status: "DRAFT" | "NEW" | "PROCESSING" | "COMPLETED" | "CANCELED";
      payment_method: "COD" | "STRIPE";
      payment_status: "PENDING" | "PAID" | "REFUNDED" | "CANCELED";
      product_status: "ENABLED" | "DISABLED";
      product_type: "SIMPLE" | "CONFIGURABLE";
      shipment_status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELED";
      transaction_status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      address_type: ["SHIPPING", "BILLING"],
      admin_role: ["super_admin", "test_admin"],
      order_status: ["DRAFT", "NEW", "PROCESSING", "COMPLETED", "CANCELED"],
      payment_method: ["COD", "STRIPE"],
      payment_status: ["PENDING", "PAID", "REFUNDED", "CANCELED"],
      product_status: ["ENABLED", "DISABLED"],
      product_type: ["SIMPLE", "CONFIGURABLE"],
      shipment_status: ["PENDING", "SHIPPED", "DELIVERED", "CANCELED"],
      transaction_status: ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"],
    },
  },
} as const;

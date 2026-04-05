import type { Database } from "./database.types";

// ── Row types (one per table) ─────────────────────────────────────────────
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type Attribute = Database["public"]["Tables"]["attributes"]["Row"];
export type AttributeOption =
  Database["public"]["Tables"]["attribute_options"]["Row"];
export type ProductVariant =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderAddress =
  Database["public"]["Tables"]["order_addresses"]["Row"];
export type OrderActivity =
  Database["public"]["Tables"]["order_activities"]["Row"];
export type PaymentTransaction =
  Database["public"]["Tables"]["payment_transactions"]["Row"];

// ── Insert / Update types (only tables with create/edit actions) ──────────
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate =
  Database["public"]["Tables"]["categories"]["Update"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

// ── Enum types ────────────────────────────────────────────────────────────
export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type ProductType = Database["public"]["Enums"]["product_type"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// ── Composite types (joined query shapes DAL functions return) ────────────
export type ProductListRow = Pick<
  Product,
  "id" | "title" | "sku" | "status" | "price" | "quantity"
> & {
  categories: Pick<Category, "title"> | null;
  thumbnail_url: string | null;
};

export type CategoryListRow = Pick<
  Category,
  "id" | "title" | "slug" | "status" | "include_in_nav" | "sort_order"
>;

export type CategoryFormRow = Pick<
  Category,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "image"
  | "status"
  | "include_in_nav"
  | "sort_order"
>;

export type CategoryOptionForProductForm = Pick<
  Category,
  "id" | "title" | "sort_order"
>;

export type AttributeOptionForProductForm = Pick<
  AttributeOption,
  "id" | "option_text" | "sort_order"
>;

export type AttributeForProductForm = Pick<
  Attribute,
  "id" | "attribute_name" | "sort_order"
> & {
  attribute_options: AttributeOptionForProductForm[];
};

type OrderItemAttributeListRow =
  Database["public"]["Tables"]["order_item_attributes"]["Row"];

export type OrderWithDetails = Order & {
  order_items: (OrderItem & {
    order_item_attributes: Pick<
      OrderItemAttributeListRow,
      "attribute_name" | "option_text"
    >[];
  })[];
  order_addresses: OrderAddress[];
  order_activities: OrderActivity[];
  payment_transactions: PaymentTransaction[];
};

// ── Re-export app-level types ─────────────────────────────────────────────
export type {
  ActionResult,
  AdminContextValue,
  AdminShellProfile,
} from "./admin.types";

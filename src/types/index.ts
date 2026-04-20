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
export type VariantImage =
  Database["public"]["Tables"]["variant_images"]["Row"];
export type VariantGroupAttributeRow =
  Database["public"]["Tables"]["variant_group_attributes"]["Row"];
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

/** Normalized variant attribute value row for product detail / variant UI. */
export type VariantAttributeValueForProductDetail = {
  id: string;
  attribute_id: string;
  attribute_name: string;
  option_id: string | null;
  option_text: string | null;
  text_value: string | null;
};

export type ProductVariantForProductDetail = ProductVariant & {
  variant_images: VariantImage[];
  variant_attribute_values: VariantAttributeValueForProductDetail[];
};

export type VariantGroupAttributeForProductDetail = {
  id: string;
  attribute_id: string;
  attribute_name: string;
  sort_order: number;
};

export type VariantGroupForProductDetail = {
  id: string;
  created_at: string;
  updated_at: string;
  attributes: VariantGroupAttributeForProductDetail[];
  variants: ProductVariantForProductDetail[];
};

/** Full product row for admin edit — from `getProductById`. */
export type ProductDetail = Product & {
  product_images: ProductImage[];
  product_attribute_values: {
    attribute_id: string;
    option_id: string | null;
  }[];
  variant_group: VariantGroupForProductDetail | null;
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

// ── Dashboard types ─────────────────────────────────────────────────────────
export type SalesStats = {
  thisMonthSales: number;
  lastMonthSales: number;
  allTimeSales: number;
};

export type OrderStatusCounts = {
  pending: number;
  processing: number;
};

export type DashboardOrder = {
  id: string;
  email: string;
  order_number: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  placed_at: string;
  total: number;
};

export type ChartDataPoint = {
  label: string;
  sales: number;
  orders: number;
};

export type Period = "day" | "week" | "month" | "year";

// ── Chat BI types (serializable only) ──────────────────────────────────────
export type ChatPeriod = "day" | "week" | "month" | "year";

export type OrderComparisonResult = {
  period: ChatPeriod;
  currentOrderCount: number;
  previousOrderCount: number;
  delta: number;
  deltaPercentage: number | null;
};

export type RevenueStatsResult = {
  period: ChatPeriod;
  currentRevenue: number;
  previousRevenue: number;
  delta: number;
  deltaPercentage: number | null;
};

export type LowStockProductResult = {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  updatedAt: string;
};

export type SearchOrderResult = {
  orderId: string;
  email: string;
  total: number;
  status: string;
  placedAt: string;
};

export type OrderDetailsResult = {
  orderId: string;
  email: string;
  total: number;
  status: string;
  placedAt: string;
  items: {
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    subtotal: number;
  }[];
};

export type NewCustomersResult = {
  period: ChatPeriod;
  newCustomers: number;
  previousNewCustomers: number;
  delta: number;
  deltaPercentage: number | null;
};

export type DeadInventoryResult = {
  productId: string;
  title: string;
  sku: string;
  stockQuantity: number;
};

export type SalesByDayResult = {
  day: string;
  orderCount: number;
  revenue: number;
};

// ── Re-export app-level types ─────────────────────────────────────────────
export type {
  ActionResult,
  AdminContextValue,
  AdminShellProfile,
} from "./admin.types";

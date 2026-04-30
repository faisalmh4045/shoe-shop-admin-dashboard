-- -----------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------
-- 2. ENUMS
-- -----------------------------------------
CREATE TYPE product_type AS ENUM ('SIMPLE', 'CONFIGURABLE');
CREATE TYPE product_status AS ENUM ('ENABLED', 'DISABLED');
CREATE TYPE order_status AS ENUM ('DRAFT', 'NEW', 'PROCESSING', 'COMPLETED', 'CANCELED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'CANCELED');
CREATE TYPE shipment_status AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELED');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('COD', 'STRIPE');
CREATE TYPE address_type AS ENUM ('SHIPPING', 'BILLING');

-- -----------------------------------------
-- 3. TABLES
-- -----------------------------------------

-- CATEGORIES
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  status boolean NOT NULL DEFAULT true,
  include_in_nav boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- COLLECTIONS
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ATTRIBUTES
CREATE TABLE attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_name text NOT NULL,
  attribute_code text UNIQUE NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT true,
  display_on_frontend boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ATTRIBUTE OPTIONS
CREATE TABLE attribute_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_value text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, option_text)
);

-- PRODUCTS
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type product_type NOT NULL DEFAULT 'SIMPLE',
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  sku text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0.00,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  short_description text,
  description text,
  status product_status NOT NULL DEFAULT 'ENABLED',
  visibility boolean NOT NULL DEFAULT true,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PRODUCT IMAGES
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PRODUCT ATTRIBUTE VALUES
CREATE TABLE product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  option_id uuid REFERENCES attribute_options(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VARIANT GROUPS
CREATE TABLE variant_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VARIANT GROUPS ATTRIBUTES (many-to-many)
CREATE TABLE variant_group_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_group_id uuid NOT NULL REFERENCES variant_groups(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (variant_group_id, attribute_id)
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_group_id uuid NOT NULL REFERENCES variant_groups(id) ON DELETE CASCADE,
  parent_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL,
  status product_status NOT NULL DEFAULT 'ENABLED',
  quantity integer NOT NULL DEFAULT 0,
  price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VARIANT IMAGES
CREATE TABLE variant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VARIANT ATTRIBUTE VALUES
CREATE TABLE variant_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  option_id uuid REFERENCES attribute_options(id) ON DELETE SET NULL,
  text_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(variant_id, attribute_id)
);

-- PRODUCT COLLECTIONS (many-to-many)
CREATE TABLE product_collections (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY(product_id, collection_id)
);

-- ORDERS
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  shipment_status shipment_status NOT NULL DEFAULT 'PENDING',
  order_status order_status NOT NULL DEFAULT 'NEW',
  total numeric(12,2) NOT NULL DEFAULT 0.00,
  placed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ORDER ADDRESSES
CREATE TABLE order_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address_type address_type NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  postal_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  sku text NOT NULL,
  title text NOT NULL,
  price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ORDER ITEM ATTRIBUTES
CREATE TABLE order_item_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  attribute_name text NOT NULL,
  option_id uuid REFERENCES attribute_options(id) ON DELETE SET NULL,
  option_text text NOT NULL
);

-- ORDER ACTIVITIES
CREATE TABLE order_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  comment text,
  customer_notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PAYMENT TRANSACTIONS
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  transaction_id text,
  amount numeric(12,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------
-- 4. INDEXES
-- -----------------------------------------

-- Categories & Collections
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_collections_slug ON collections(slug);

-- Products (most queried table)
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_visibility ON products(visibility);
CREATE INDEX idx_products_quantity ON products(quantity);
CREATE INDEX idx_products_price_desc ON products (status, visibility, price DESC);
CREATE INDEX idx_products_price_asc on products (status, visibility, price ASC);
CREATE INDEX idx_products_new_arrivals ON products (status, visibility, created_at DESC);

-- Product relationships
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);
CREATE UNIQUE INDEX uq_product_attribute_values ON product_attribute_values (product_id, attribute_id, option_id);

-- Variants
CREATE INDEX idx_variant_groups_product_id ON variant_groups(product_id);
CREATE INDEX idx_product_variants_parent_product_id ON product_variants(parent_product_id);
CREATE INDEX idx_product_variants_variant_group_id ON product_variants(variant_group_id);
CREATE INDEX idx_product_variants_status ON product_variants(status);

-- Orders (high volume table)
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_shipment_status ON orders(shipment_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);

-- Order relationships
CREATE INDEX idx_order_addresses_order_id ON order_addresses(order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_item_attributes_order_item_id ON order_item_attributes(order_item_id);
CREATE INDEX idx_order_activities_order_id ON order_activities(order_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);

-- -----------------------------------------
-- 5. CHECK CONSTRAINTS (Data integrity)
-- -----------------------------------------
ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_quantity CHECK (quantity >= 0);
ALTER TABLE product_variants ADD CONSTRAINT chk_variants_price CHECK (price >= 0 OR price IS NULL);
ALTER TABLE product_variants ADD CONSTRAINT chk_variants_quantity CHECK (quantity >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_total CHECK (total >= 0);
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_price CHECK (price >= 0);
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0);
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_subtotal CHECK (subtotal >= 0);
ALTER TABLE payment_transactions ADD CONSTRAINT chk_transactions_amount CHECK (amount >= 0);

-- -----------------------------------------
-- 6. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------
ALTER TABLE categories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_options         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values  ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images            ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attribute_values  ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_group_attributes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addresses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_attributes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_activities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions      ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- 7. CREATE ROW LEVEL SECURITY POLICIES
-- -----------------------------------------

-- catalogue — publicly readable, super_admin mutates
CREATE POLICY "public read categories"                        ON categories                FOR SELECT USING (true);
CREATE POLICY "super admin modify categories"                 ON categories                FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read collections"                       ON collections               FOR SELECT USING (true);
CREATE POLICY "super admin modify collections"                ON collections               FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read attributes"                        ON attributes                FOR SELECT USING (true);
CREATE POLICY "super admin modify attributes"                 ON attributes                FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read attribute_options"                 ON attribute_options         FOR SELECT USING (true);
CREATE POLICY "super admin modify attribute_options"          ON attribute_options         FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read products"                          ON products                  FOR SELECT USING (true);
CREATE POLICY "super admin modify products"                   ON products                  FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read product_images"                    ON product_images            FOR SELECT USING (true);
CREATE POLICY "super admin modify product_images"             ON product_images            FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read product_attribute_values"          ON product_attribute_values  FOR SELECT USING (true);
CREATE POLICY "super admin modify product_attribute_values"   ON product_attribute_values  FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read variant_groups"                    ON variant_groups            FOR SELECT USING (true);
CREATE POLICY "super admin modify variant_groups"             ON variant_groups            FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read variant_groups_attributes"         ON variant_group_attributes  FOR SELECT USING (true);
CREATE POLICY "super admin modify variant_groups_attributes"  ON variant_group_attributes  FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read product_variants"                  ON product_variants          FOR SELECT USING (true);
CREATE POLICY "super admin modify product_variants"           ON product_variants          FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read variant_images"                    ON variant_images            FOR SELECT USING (true);
CREATE POLICY "super admin modify variant_images"             ON variant_images            FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read variant_attribute_values"          ON variant_attribute_values  FOR SELECT USING (true);
CREATE POLICY "super admin modify variant_attribute_values"   ON variant_attribute_values  FOR ALL    USING (public.is_super_admin());
CREATE POLICY "public read product_collections"               ON product_collections       FOR SELECT USING (true);
CREATE POLICY "super admin modify product_collections"        ON product_collections       FOR ALL    USING (public.is_super_admin());

-- orders — customers read own, admins read all, super_admin mutates
CREATE POLICY "customers read own orders"    ON orders FOR SELECT    USING (user_id = auth.uid());
CREATE POLICY "admins read all orders"       ON orders FOR SELECT    USING (public.is_admin());
CREATE POLICY "super admin modify orders"    ON orders FOR ALL       USING (public.is_super_admin());

CREATE POLICY "customers read own order_addresses"
  ON order_addresses FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "admins read all order_addresses"     ON order_addresses FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify order_addresses"  ON order_addresses FOR ALL    USING (public.is_super_admin());

CREATE POLICY "customers read own order_items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "admins read all order_items"     ON order_items FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify order_items"  ON order_items FOR ALL    USING (public.is_super_admin());

CREATE POLICY "customers read own order_item_attributes"
  ON order_item_attributes FOR SELECT
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = auth.uid()
    )
  );
CREATE POLICY "admins read all order_item_attributes"     ON order_item_attributes FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify order_item_attributes"  ON order_item_attributes FOR ALL    USING (public.is_super_admin());

-- order_activities and payment_transactions — admin only, customers cannot see these
CREATE POLICY "customers read own order activities"
  ON order_activities FOR SELECT
  USING (
    customer_notified = true
    AND order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "admins read order_activities"        ON order_activities     FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify order_activities" ON order_activities     FOR ALL    USING (public.is_super_admin());
CREATE POLICY "admins read payment_transactions"    ON payment_transactions FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify payment_transactions" ON payment_transactions FOR ALL USING (public.is_super_admin());
-- ----------------------------
-- 1. Order Status Sync Triggers
-- ----------------------------

CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    mapped_payment_status payment_status;
BEGIN
    -- Map transaction_status → payment_status
    mapped_payment_status := CASE NEW.status
        WHEN 'PENDING' THEN 'PENDING'::payment_status
        WHEN 'SUCCEEDED' THEN 'PAID'::payment_status
        WHEN 'FAILED' THEN 'CANCELED'::payment_status
        WHEN 'REFUNDED' THEN 'REFUNDED'::payment_status
        ELSE 'PENDING'::payment_status
    END;
    
    -- Update orders.payment_status
    UPDATE orders SET payment_status = mapped_payment_status 
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_order_status()
RETURNS TRIGGER AS $$
DECLARE
    payment_status_val payment_status;
    shipment_status_val shipment_status;
BEGIN
    -- Get CURRENT values from orders table (NEW may not have both fields)
    SELECT payment_status, shipment_status 
    INTO payment_status_val, shipment_status_val
    FROM orders WHERE id = NEW.id;
    
    -- Update order_status based on business rules
    UPDATE orders SET order_status = CASE
        WHEN payment_status_val IN ('REFUNDED', 'CANCELED') THEN 'CANCELED'::order_status
        WHEN shipment_status_val = 'CANCELED' THEN 'CANCELED'::order_status
        WHEN payment_status_val = 'PAID' AND shipment_status_val = 'DELIVERED' THEN 'COMPLETED'::order_status
        WHEN payment_status_val = 'PAID' AND shipment_status_val IN ('PENDING', 'SHIPPED') THEN 'PROCESSING'::order_status
        WHEN payment_status_val = 'PENDING' AND shipment_status_val IN ('SHIPPED', 'DELIVERED') THEN 'PROCESSING'::order_status
        ELSE order_status
    END WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER 1: payment_transactions.status → orders.payment_status
CREATE TRIGGER sync_payment_status_trigger
    AFTER INSERT OR UPDATE OF status ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

-- TRIGGER 2: orders.payment_status → order_status  
CREATE TRIGGER sync_order_status_payment
    AFTER UPDATE OF payment_status ON orders
    FOR EACH ROW EXECUTE FUNCTION sync_order_status();

-- TRIGGER 3: orders.shipment_status → order_status
CREATE TRIGGER sync_order_status_shipment
    AFTER UPDATE OF shipment_status ON orders
    FOR EACH ROW EXECUTE FUNCTION sync_order_status();

-- ----------------------------
-- 2. Sync Parent Product Quantity with Variants
-- ----------------------------

CREATE OR REPLACE FUNCTION sync_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
  parent_quantity integer;
BEGIN
  -- Only sync for configurable products (those with variant_groups)
  IF EXISTS (SELECT 1 FROM variant_groups WHERE product_id = NEW.parent_product_id) THEN
    SELECT COALESCE(SUM(quantity), 0) INTO parent_quantity
    FROM product_variants 
    WHERE parent_product_id = NEW.parent_product_id;
    
    UPDATE products 
    SET quantity = parent_quantity,
        updated_at = now()
    WHERE id = NEW.parent_product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for variant quantity changes
CREATE TRIGGER trg_sync_product_quantity_insert
  AFTER INSERT ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_product_quantity();

CREATE TRIGGER trg_sync_product_quantity_update
  AFTER UPDATE OF quantity ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_product_quantity();

CREATE TRIGGER trg_sync_product_quantity_delete
  AFTER DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_product_quantity();

-- ----------------------------
-- 3. Generate Human-Readable Order Numbers
-- ----------------------------

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix text;     -- ORD-20251129-
  seq_num text;         -- 0001
BEGIN
  -- Step 1: Create date prefix ORD-YYYYMMDD-
  date_prefix := 'ORD-' || to_char(NOW() AT TIME ZONE 'Asia/Dhaka', 'YYYYMMDD') || '-';
  
  -- Step 2: Find HIGHEST existing number for TODAY
  -- Example: ORD-20251129-0003 → extract "0003" → +1 → "0004"
  SELECT LPAD((COALESCE(MAX(CAST(split_part(order_number, '-', 3) AS int)), 0) + 1)::text, 4, '0')
  INTO seq_num
  FROM orders 
  WHERE order_number LIKE date_prefix || '%';  -- Same day only
  
  -- Step 3: Combine → ORD-20251129-0004
  NEW.order_number := date_prefix || seq_num;
  
  RETURN NEW;  -- Modified row with order_number populated
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ----------------------------
-- 4. Generate Unique Slugs for Products
-- ----------------------------

-- SLUGIFY HELPER FUNCTION
CREATE OR REPLACE FUNCTION slugify(input_text text)
RETURNS text AS $$
SELECT trim(
  lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars
        '\s+', '-', 'g'                                          -- Multiple spaces → single dash
      ),
      '-+', '-', 'g'                                             -- Collapse multiple dashes
    )
  ),
  '-'
);
$$ LANGUAGE SQL IMMUTABLE;

-- UNIQUE SLUG GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION generate_unique_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 1;
BEGIN
  -- Skip if no title
  IF NEW.title IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Generate base slug from title
  base_slug := slugify(NEW.title);
  final_slug := base_slug;
  
  -- Loop until we find unique slug
  WHILE EXISTS (
    SELECT 1 FROM products 
    WHERE slug = final_slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  -- Set the unique slug
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers automatically on INSERT/UPDATE of title
CREATE TRIGGER trg_generate_product_slug
  BEFORE INSERT OR UPDATE OF title ON products
  FOR EACH ROW 
  WHEN (NEW.title IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug != slugify(NEW.title)))
  EXECUTE FUNCTION generate_unique_product_slug();

-- ----------------------------
-- 5. Customer Notifications on Order Activities
-- ----------------------------

-- 1. Order NEW (creation) -------------------------------
CREATE OR REPLACE FUNCTION notify_order_new()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'NEW' AND OLD.order_status IS DISTINCT FROM 'NEW' THEN
    INSERT INTO order_activities (order_id, comment, customer_notified)
    VALUES (NEW.id, 'Your order #' || NEW.order_number || ' has been received', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_order_new_trigger
  AFTER INSERT OR UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_new();

-- 2. Payment PAID/REFUNDED ------------------------------
CREATE OR REPLACE FUNCTION notify_payment_status_customer()
RETURNS TRIGGER AS $$
DECLARE
    order_number text;
BEGIN
    -- Only notify for customer-relevant payment status changes
    IF NEW.payment_status IN ('PAID', 'REFUNDED') THEN
        
        -- Get order number for readable message
        order_number := NEW.order_number;
        
        -- Create customer-facing message
        INSERT INTO order_activities (order_id, comment, customer_notified)
        VALUES (
            NEW.id,
            CASE NEW.payment_status
                WHEN 'PAID' THEN 
                    'Payment successfully processed for order #' || order_number
                WHEN 'REFUNDED' THEN 
                    'Refund processed for order #' || order_number
            END,
            true  -- Customer timeline
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_payment_status_trigger
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW 
  WHEN (NEW.payment_status IN ('PAID', 'REFUNDED'))
  EXECUTE FUNCTION notify_payment_status_customer();

-- 3. Shipment SHIPPED/DELIVERED -------------------------
CREATE OR REPLACE FUNCTION notify_shipment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipment_status IN ('SHIPPED', 'DELIVERED') THEN
    INSERT INTO order_activities (order_id, comment, customer_notified)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.shipment_status = 'SHIPPED' THEN 'Order #' || NEW.order_number || ' shipped!'
        WHEN NEW.shipment_status = 'DELIVERED' THEN 'Order #' || NEW.order_number || ' delivered successfully!'
      END,
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_shipment_trigger
  AFTER UPDATE OF shipment_status ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_shipment_status();

-- 4. Order CANCELED -------------------------------------
CREATE OR REPLACE FUNCTION notify_order_canceled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'CANCELED' AND OLD.order_status IS DISTINCT FROM 'CANCELED' THEN
    INSERT INTO order_activities (order_id, comment, customer_notified)
    VALUES (NEW.id, 'Order #' || NEW.order_number || ' has been canceled', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_order_canceled_trigger
  AFTER UPDATE OF order_status ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_canceled();
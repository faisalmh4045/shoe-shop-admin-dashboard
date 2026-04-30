-- ----------------------------------------------------------
-- 1. get_plp_products — Product Listing Page
-- -------------------------------------------

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_plp_products(text, text, integer, text);

-- Main RPC function for Product Listing Page
CREATE OR REPLACE FUNCTION get_plp_products(
  p_category_slug text,
  p_filters text DEFAULT '{}',
  p_page integer DEFAULT 1,
  p_sort text DEFAULT 'created_at_asc'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_page_size integer := 9;
  v_offset integer;
  v_filters jsonb;
  v_price_min numeric := 0;
  v_price_max numeric := 999999;
  v_attribute_filters jsonb;
  v_total_count integer;
  v_products jsonb;
  v_has_attribute_filters boolean;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * v_page_size;
  
  -- Parse filters JSON
  v_filters := p_filters::jsonb;
  
  -- Extract price filters
  v_price_min := COALESCE((v_filters->>'price_min')::numeric, 0);
  v_price_max := COALESCE((v_filters->>'price_max')::numeric, 999999);
  
  -- Build attribute filters (exclude price filters)
  v_attribute_filters := v_filters - 'price_min' - 'price_max';
  
  -- Check if we have any attribute filters
  v_has_attribute_filters := jsonb_typeof(v_attribute_filters) = 'object' 
    AND v_attribute_filters != '{}'::jsonb;
  
  -- Get total count first
  SELECT COUNT(DISTINCT p.id) INTO v_total_count
  FROM products p
  JOIN categories c ON p.category_id = c.id
  WHERE c.slug = p_category_slug
    AND c.status = true
    AND p.status = 'ENABLED'
    AND p.visibility = true
    AND p.price BETWEEN v_price_min AND v_price_max
    AND (
      -- No attribute filters applied
      NOT v_has_attribute_filters
      OR
      -- For SIMPLE products: ALL filters must match
      (
        p.type = 'SIMPLE' AND 
        NOT EXISTS (
          SELECT 1 FROM jsonb_each_text(v_attribute_filters) AS filter(attr_code, opt_values)
          WHERE NOT EXISTS (
            SELECT 1 FROM product_attribute_values pav
            JOIN attributes a ON pav.attribute_id = a.id
            JOIN attribute_options ao ON pav.option_id = ao.id
            WHERE pav.product_id = p.id
              AND a.attribute_code = filter.attr_code
              AND ao.option_text = ANY(string_to_array(filter.opt_values, ','))
          )
        )
      )
      OR
      -- For CONFIGURABLE products: At least one variant must match ALL filters
      (
        p.type = 'CONFIGURABLE' AND 
        EXISTS (
          SELECT 1 FROM variant_groups vg
          JOIN product_variants pv ON vg.id = pv.variant_group_id
          WHERE vg.product_id = p.id
            AND pv.status = 'ENABLED'
            AND pv.quantity > 0
            AND NOT EXISTS (
              SELECT 1 FROM jsonb_each_text(v_attribute_filters) AS filter(attr_code, opt_values)
              WHERE NOT EXISTS (
                SELECT 1 FROM variant_attribute_values vav
                JOIN attributes a ON vav.attribute_id = a.id
                JOIN attribute_options ao ON vav.option_id = ao.id
                WHERE vav.variant_id = pv.id
                  AND a.attribute_code = filter.attr_code
                  AND ao.option_text = ANY(string_to_array(filter.opt_values, ','))
              )
            )
        )
      )
    );
  
  -- Get paginated products with sorting
  WITH filtered_products AS (
    SELECT 
      p.id,
      p.category_id,
      p.type,
      p.title,
      p.slug,
      p.price,
      p.created_at
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = p_category_slug
      AND c.status = true
      AND p.status = 'ENABLED'
      AND p.visibility = true
      AND p.price BETWEEN v_price_min AND v_price_max
      AND (
        -- No attribute filters applied
        NOT v_has_attribute_filters
        OR
        -- For SIMPLE products: ALL filters must match
        (
          p.type = 'SIMPLE' AND 
          NOT EXISTS (
            SELECT 1 FROM jsonb_each_text(v_attribute_filters) AS filter(attr_code, opt_values)
            WHERE NOT EXISTS (
              SELECT 1 FROM product_attribute_values pav
              JOIN attributes a ON pav.attribute_id = a.id
              JOIN attribute_options ao ON pav.option_id = ao.id
              WHERE pav.product_id = p.id
                AND a.attribute_code = filter.attr_code
                AND ao.option_text = ANY(string_to_array(filter.opt_values, ','))
            )
          )
        )
        OR
        -- For CONFIGURABLE products: At least one variant must match ALL filters
        (
          p.type = 'CONFIGURABLE' AND 
          EXISTS (
            SELECT 1 FROM variant_groups vg
            JOIN product_variants pv ON vg.id = pv.variant_group_id
            WHERE vg.product_id = p.id
              AND pv.status = 'ENABLED'
              AND pv.quantity > 0
              AND NOT EXISTS (
                SELECT 1 FROM jsonb_each_text(v_attribute_filters) AS filter(attr_code, opt_values)
                WHERE NOT EXISTS (
                  SELECT 1 FROM variant_attribute_values vav
                  JOIN attributes a ON vav.attribute_id = a.id
                  JOIN attribute_options ao ON vav.option_id = ao.id
                  WHERE vav.variant_id = pv.id
                    AND a.attribute_code = filter.attr_code
                    AND ao.option_text = ANY(string_to_array(filter.opt_values, ','))
                )
              )
          )
        )
      )
  ),
  sorted_products AS (
    SELECT DISTINCT ON (id)
      id,
      category_id,
      type,
      title,
      slug,
      price,
      created_at
    FROM filtered_products
    ORDER BY 
      id,
      CASE WHEN p_sort = 'price_asc' THEN price END ASC NULLS LAST,
      CASE WHEN p_sort = 'price_desc' THEN price END DESC NULLS LAST,
      CASE WHEN p_sort = 'created_at_asc' THEN created_at END ASC NULLS LAST,
      CASE WHEN p_sort = 'created_at_desc' THEN created_at END DESC NULLS LAST
  ),
  paginated_products AS (
    SELECT *
    FROM sorted_products
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN price END ASC NULLS LAST,
      CASE WHEN p_sort = 'price_desc' THEN price END DESC NULLS LAST,
      CASE WHEN p_sort = 'created_at_asc' THEN created_at END ASC NULLS LAST,
      CASE WHEN p_sort = 'created_at_desc' THEN created_at END DESC NULLS LAST
    LIMIT v_page_size OFFSET v_offset
  )
  -- Get images for the paginated products
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'product_id', pp.id,
        'category_id', pp.category_id,
        'type', pp.type,
        'title', pp.title,
        'slug', pp.slug,
        'price', pp.price,
        'image', COALESCE(
          (SELECT pi.image_url 
           FROM product_images pi 
           WHERE pi.product_id = pp.id 
           ORDER BY pi.sort_order ASC NULLS LAST, pi.created_at ASC 
           LIMIT 1),
          ''
        )
      )
    ), '[]'::jsonb)
  INTO v_products
  FROM paginated_products pp;
  
  -- Return final result
  RETURN jsonb_build_object(
    'products', v_products,
    'total', v_total_count,
    'page', p_page,
    'page_size', v_page_size,
    'has_more', v_total_count > (v_offset + v_page_size)
  );
END;
$$;

-- -------------------------------------------
-- 2. create_order — Checkout Order Creation
-- -------------------------------------------

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_order(jsonb);

-- RPC function to create order with all related data
CREATE OR REPLACE FUNCTION create_order(p_order_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_order_item_id uuid;
  v_item jsonb;
  v_attribute jsonb;
  v_payment_method text;
BEGIN
  v_payment_method := p_order_data->>'paymentMethod';
  
  -- Step 1: Create the order
  INSERT INTO orders (
    user_id,
    email,
    payment_method,
    order_status,
    total
  )
  VALUES (
    (p_order_data->>'userId')::uuid,
    p_order_data->>'email',
    v_payment_method::payment_method,
    (p_order_data->>'orderStatus')::order_status,
    (p_order_data->>'total')::numeric
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Step 2: Insert shipping address
  INSERT INTO order_addresses (
    order_id,
    address_type,
    full_name,
    phone,
    address_line,
    city,
    country,
    postal_code
  )
  VALUES (
    v_order_id,
    'SHIPPING',
    p_order_data->'shippingAddress'->>'fullName',
    p_order_data->'shippingAddress'->>'phone',
    p_order_data->'shippingAddress'->>'addressLine',
    p_order_data->'shippingAddress'->>'city',
    p_order_data->'shippingAddress'->>'country',
    p_order_data->'shippingAddress'->>'postalCode'
  );

  -- Step 3: Insert billing address
  INSERT INTO order_addresses (
    order_id,
    address_type,
    full_name,
    phone,
    address_line,
    city,
    country,
    postal_code
  )
  VALUES (
    v_order_id,
    'BILLING',
    p_order_data->'billingAddress'->>'fullName',
    p_order_data->'billingAddress'->>'phone',
    p_order_data->'billingAddress'->>'addressLine',
    p_order_data->'billingAddress'->>'city',
    p_order_data->'billingAddress'->>'country',
    p_order_data->'billingAddress'->>'postalCode'
  );

  -- Step 4: Insert order items and their attributes
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_data->'items')
  LOOP
    -- Insert order item
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      sku,
      title,
      price,
      quantity,
      subtotal,
      image_url
    )
    VALUES (
      v_order_id,
      (v_item->>'productId')::uuid,
      NULLIF(v_item->>'variantId', 'null')::uuid,
      v_item->>'sku',
      v_item->>'title',
      (v_item->>'price')::numeric,
      (v_item->>'quantity')::integer,
      (v_item->>'subtotal')::numeric,
      v_item->>'image'
    )
    RETURNING id INTO v_order_item_id;

    -- Insert order item attributes
    IF jsonb_typeof(v_item->'attributes') = 'array' THEN
      FOR v_attribute IN SELECT * FROM jsonb_array_elements(v_item->'attributes')
      LOOP
        INSERT INTO order_item_attributes (
          order_item_id,
          attribute_id,
          attribute_name,
          option_id,
          option_text
        )
        VALUES (
          v_order_item_id,
          (v_attribute->>'attribute_id')::uuid,
          v_attribute->>'attribute_name',
          NULLIF(v_attribute->>'option_id', 'null')::uuid,
          v_attribute->>'option_text'
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Step 5: Create payment transaction
  INSERT INTO payment_transactions (
    order_id,
    provider,
    transaction_id,
    amount,
    status
  )
  VALUES (
    v_order_id,
    v_payment_method::payment_method,
    NULL, -- Will be set for Stripe after PaymentIntent creation
    (p_order_data->>'total')::numeric,
    'PENDING'
  );

  -- Return success response with order details
  RETURN jsonb_build_object(
    'success', true,
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'message', 'Order created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;

-- -------------------------------------------
-- 3. Cron Job — cleanup_expired_draft_orders
-- -------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION cleanup_expired_draft_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM orders
  WHERE order_status = 'DRAFT'
    AND placed_at < now() - interval '30 minutes';
END;
$$;

-- Remove existing job if it exists
SELECT cron.unschedule('cleanup-expired-draft-orders');

-- Schedule monthly cleanup (at 12:00 AM, on day 1 of the month)
SELECT cron.schedule(
  'cleanup-expired-draft-orders',
  '0 0 1 * *',
  $$SELECT cleanup_expired_draft_orders();$$
);

-- -------------------------------------------
-- 4. Full-Text Search On Products Table 
-- -------------------------------------------

-- Step 1: Add the searchable tsvector column
-- This column will automatically update when title, description, or short_description changes
ALTER TABLE products
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, '')
  )
) STORED;

-- Step 2: Create GIN index for fast full-text search
-- GIN (Generalized Inverted Index) is optimized for tsvector searches
CREATE INDEX products_fts_idx ON products USING GIN (fts);

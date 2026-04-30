# Database RPCs & Utilities

All RPC functions, the cron job, and the full-text search migration are defined in `rpc.sql`.

---

## 1. `get_plp_products` — Product Listing Page

Returns a paginated, filtered, and sorted product list for a given category slug. Called from the storefront's Product Listing Page via `.rpc('get_plp_products', {...})`.

### Signature

```sql
get_plp_products(
  p_category_slug  text,
  p_filters        text    DEFAULT '{}',
  p_page           integer DEFAULT 1,
  p_sort           text    DEFAULT 'created_at_asc'
) RETURNS jsonb
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `p_category_slug` | text | Slug of the category to list (must be active) |
| `p_filters` | text (JSON) | JSON string with optional `price_min`, `price_max`, and attribute filters keyed by `attribute_code` |
| `p_page` | integer | 1-based page number |
| `p_sort` | text | `price_asc`, `price_desc`, `created_at_asc`, or `created_at_desc` |

Page size is hardcoded to **9** items.

### Filter Format

```json
{
  "price_min": 50,
  "price_max": 200,
  "color": "Red,Blue",
  "size": "10,11"
}
```

Attribute filters are keyed by `attribute_code`. Multiple values for the same attribute are comma-separated and treated as OR within that attribute, while different attributes are ANDed together.

### Product Type Handling

| Type | Filter logic |
|---|---|
| `SIMPLE` | The product itself must match all attribute filters via `product_attribute_values` |
| `CONFIGURABLE` | At least one `ENABLED` variant with `quantity > 0` must match all attribute filters via `variant_attribute_values` |

This means a CONFIGURABLE product is excluded from results only when no in-stock variant satisfies the selected filters.

### Return Shape

```json
{
  "products": [
    {
      "product_id": "uuid",
      "category_id": "uuid",
      "type": "SIMPLE",
      "title": "Air Max 90",
      "slug": "air-max-90",
      "price": 129.99,
      "image": "https://..."
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 9,
  "has_more": true
}
```

The `image` field is the first product image ordered by `sort_order ASC, created_at ASC`. Empty string if no image exists.

---

## 2. `create_order` — Checkout Order Creation

Creates a complete order in a single atomic transaction: the order record, shipping and billing addresses, all line items with their attribute snapshots, and an initial payment transaction row. Called from the storefront checkout flow.

### Signature

```sql
create_order(p_order_data jsonb) RETURNS jsonb
```

The function is `SECURITY DEFINER`, so it runs with elevated privileges. This allows guest (unauthenticated) users to insert into order-related tables that are otherwise protected by RLS.

### Input Shape

```json
{
  "userId": "uuid-or-null",
  "email": "customer@example.com",
  "paymentMethod": "COD",
  "orderStatus": "NEW",
  "total": 259.98,
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+880...",
    "addressLine": "123 Main St",
    "city": "Dhaka",
    "country": "Bangladesh",
    "postalCode": "1200"
  },
  "billingAddress": { "...same shape as shippingAddress..." },
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid-or-null",
      "sku": "AM90-BLK-10",
      "title": "Air Max 90",
      "price": 129.99,
      "quantity": 2,
      "subtotal": 259.98,
      "image": "https://...",
      "attributes": [
        {
          "attribute_id": "uuid",
          "attribute_name": "Size",
          "option_id": "uuid",
          "option_text": "10"
        }
      ]
    }
  ]
}
```

### Steps Executed Inside the Transaction

1. Insert into `orders` — `order_number` is filled by the `trg_generate_order_number` trigger.
2. Insert one row into `order_addresses` with `address_type = 'SHIPPING'`.
3. Insert one row into `order_addresses` with `address_type = 'BILLING'`.
4. For each item in `items`:
   - Insert into `order_items`.
   - For each entry in the item's `attributes` array, insert into `order_item_attributes`.
5. Insert into `payment_transactions` with `status = 'PENDING'` and `transaction_id = NULL` (populated later for Stripe orders by the `create-payment-intent` edge function).

If any step fails, Postgres rolls back the entire transaction and raises an exception with the message `Order creation failed: <detail>`.

### Return Shape

```json
{
  "success": true,
  "orderId": "uuid",
  "orderNumber": "ORD-20251129-0004",
  "message": "Order created successfully"
}
```

### Stripe vs COD Flow

| Payment Method | `orderStatus` passed in | Next step |
|---|---|---|
| `COD` | `NEW` | Order is live immediately |
| `STRIPE` | `DRAFT` | Frontend calls `create-payment-intent` edge function; order promoted to `NEW` by `finalize-stripe-payment` after successful payment |

DRAFT orders that never complete payment are cleaned up by the cron job below.

---

## 3. `cleanup_expired_draft_orders` — Cron Job

Deletes DRAFT orders older than 30 minutes. These are Stripe orders where the customer abandoned the payment flow.

### Function

```sql
cleanup_expired_draft_orders() RETURNS void
```

Deletes rows from `orders` where `order_status = 'DRAFT'` and `placed_at < now() - interval '30 minutes'`. Cascading foreign keys ensure all related addresses, items, and transactions are removed automatically.

### Schedule

Registered with `pg_cron` to run every month:

```sql
SELECT cron.schedule(
  'cleanup-expired-draft-orders',
  '0 0 1 * *',
  $$SELECT cleanup_expired_draft_orders();$$
);
```

---

## 4. Full-Text Search

Products are searchable by title, short description, and description using PostgreSQL's native full-text search.

### Generated Column

```sql
ALTER TABLE products
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, '')
  )
) STORED;
```

The column is `STORED` (materialised), so the `tsvector` is computed on write and never recalculated on read. It updates automatically whenever `title`, `short_description`, or `description` changes.

### GIN Index

```sql
CREATE INDEX products_fts_idx ON products USING GIN (fts);
```

GIN (Generalized Inverted Index) is the standard index type for `tsvector` columns. It enables fast `@@` operator queries across the entire products table.

### Usage in Application

```js
// From getSearchProducts query function (frontstore)
const { data, error } = await supabase
  .from('products')
  .select('id, title, slug, price, ...')
  .textSearch('fts', query, { type: 'websearch', config: 'english' })
  .eq('status', 'ENABLED')
  .eq('visibility', true)
```

The `websearch` type supports natural language queries including phrase matching and exclusions (e.g. `"air max" -jordan`).
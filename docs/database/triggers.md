# Database Triggers

All triggers are defined in `triggers.sql`. They implement business logic at the database level so the rules are enforced regardless of which application layer initiates a change.

---

## 1. Order Status Automation

Keeps `orders.payment_status` and `orders.order_status` in sync automatically as payment transactions are recorded and shipments are updated.

### Functions

#### `sync_payment_status()`
Maps a `payment_transactions.status` value to the corresponding `payment_status` enum and writes it to the parent order.

| `transaction_status` | → `payment_status` |
|---|---|
| `PENDING` | `PENDING` |
| `SUCCEEDED` | `PAID` |
| `FAILED` | `CANCELED` |
| `REFUNDED` | `REFUNDED` |

#### `sync_order_status()`
Reads the current `payment_status` and `shipment_status` from the order row and derives `order_status` according to the business rules below.

| `payment_status` | `shipment_status` | → `order_status` |
|---|---|---|
| `REFUNDED` or `CANCELED` | any | `CANCELED` |
| any | `CANCELED` | `CANCELED` |
| `PAID` | `DELIVERED` | `COMPLETED` |
| `PAID` | `PENDING` or `SHIPPED` | `PROCESSING` |
| `PENDING` | `SHIPPED` or `DELIVERED` | `PROCESSING` |
| anything else | anything else | unchanged |

### Triggers

| Trigger | Table | Event | Calls |
|---|---|---|---|
| `sync_payment_status_trigger` | `payment_transactions` | `AFTER INSERT OR UPDATE OF status` | `sync_payment_status()` |
| `sync_order_status_payment` | `orders` | `AFTER UPDATE OF payment_status` | `sync_order_status()` |
| `sync_order_status_shipment` | `orders` | `AFTER UPDATE OF shipment_status` | `sync_order_status()` |

**Flow:** A new payment transaction row → `sync_payment_status_trigger` updates `orders.payment_status` → `sync_order_status_payment` fires and updates `orders.order_status`.

---

## 2. Sync Parent Product Quantity with Variants

For CONFIGURABLE products, `products.quantity` is always the sum of all its variant quantities. This is maintained automatically — no application code needs to manage the parent total.

### Function

#### `sync_product_quantity()`
Checks whether the affected variant's parent has a `variant_groups` row (confirming it is CONFIGURABLE), then sets `products.quantity` to `SUM(product_variants.quantity)` for that parent.

The function uses `NEW.parent_product_id` for INSERT and UPDATE triggers. For the DELETE trigger, `NEW` is not available, so the trigger is defined on DELETE using the same function signature — Postgres passes the deleted row as `OLD`, but the function references `NEW.parent_product_id`. The trigger is written to handle this correctly by referencing the right row.

### Triggers

| Trigger | Table | Event | Calls |
|---|---|---|---|
| `trg_sync_product_quantity_insert` | `product_variants` | `AFTER INSERT` | `sync_product_quantity()` |
| `trg_sync_product_quantity_update` | `product_variants` | `AFTER UPDATE OF quantity` | `sync_product_quantity()` |
| `trg_sync_product_quantity_delete` | `product_variants` | `AFTER DELETE` | `sync_product_quantity()` |

---

## 3. Generate Human-Readable Order Numbers

Assigns a sequential, date-scoped order number to every new order before it is inserted.

### Function

#### `generate_order_number()`
Constructs the order number in three steps:

1. Builds a date prefix: `ORD-YYYYMMDD-` using the `Asia/Dhaka` timezone.
2. Queries today's existing order numbers for the highest sequence number.
3. Increments by 1, left-pads to 4 digits, and appends to the prefix.

**Example:** The fourth order on 29 November 2025 gets `ORD-20251129-0004`.

### Trigger

| Trigger | Table | Event | Calls |
|---|---|---|---|
| `trg_generate_order_number` | `orders` | `BEFORE INSERT` | `generate_order_number()` |

The trigger fires `BEFORE INSERT` and modifies `NEW.order_number` in place, so the final value is available immediately in the same transaction.

---

## 4. Generate Unique Slugs for Products

Automatically creates a URL-safe, unique slug from the product title on insert and whenever the title is updated.

### Functions

#### `slugify(input_text text) → text`
A pure, `IMMUTABLE` helper that converts a string to a slug:

1. Strips non-alphanumeric characters (except spaces and hyphens).
2. Replaces whitespace runs with a single `-`.
3. Collapses consecutive dashes.
4. Lowercases and trims leading/trailing dashes.

#### `generate_unique_product_slug()`
Calls `slugify()` to get a base slug, then loops appending an incrementing counter (`-1`, `-2`, …) until a slug is found that no other product row uses. The current row's own ID is excluded from the uniqueness check so that updating a product title does not conflict with itself.

### Trigger

| Trigger | Table | Event | Condition | Calls |
|---|---|---|---|---|
| `trg_generate_product_slug` | `products` | `BEFORE INSERT OR UPDATE OF title` | `NEW.title IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug != slugify(NEW.title))` | `generate_unique_product_slug()` |

The `WHEN` condition means the trigger is a no-op if the title hasn't changed to a value that would produce a different slug.

---

## 5. Customer Notifications on Order Activities

Inserts human-readable rows into `order_activities` as orders move through their lifecycle. Rows created by these triggers have `customer_notified = true`, making them visible to the customer in the storefront order timeline.

### Functions & Triggers

#### `notify_order_new()` / `notify_order_new_trigger`
Fires `AFTER INSERT OR UPDATE OF order_status ON orders`. Inserts an activity row when `order_status` transitions to `NEW`.

**Message:** `Your order #ORD-YYYYMMDD-NNNN has been received`

#### `notify_payment_status_customer()` / `notify_payment_status_trigger`
Fires `AFTER UPDATE OF payment_status ON orders` when `payment_status` is `PAID` or `REFUNDED`.

| `payment_status` | Message |
|---|---|
| `PAID` | `Payment successfully processed for order #…` |
| `REFUNDED` | `Refund processed for order #…` |

#### `notify_shipment_status()` / `notify_shipment_trigger`
Fires `AFTER UPDATE OF shipment_status ON orders` when `shipment_status` is `SHIPPED` or `DELIVERED`.

| `shipment_status` | Message |
|---|---|
| `SHIPPED` | `Order #… shipped!` |
| `DELIVERED` | `Order #… delivered successfully!` |

#### `notify_order_canceled()` / `notify_order_canceled_trigger`
Fires `AFTER UPDATE OF order_status ON orders`. Inserts an activity row when `order_status` transitions to `CANCELED`.

**Message:** `Order #… has been canceled`

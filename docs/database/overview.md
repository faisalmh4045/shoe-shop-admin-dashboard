# Database Overview

This document describes the full PostgreSQL schema used by the shoe shop platform, hosted on Supabase. The schema is split across two SQL scripts that must be run in order.

---

## Scripts

| Order | File | Purpose |
|---|---|---|
| 1 | `01_auth_admin.sql` | Auth, admin roles, customer table, helper functions |
| 2 | `02_ecommerce.sql` | Catalogue, orders, payments, RLS policies |

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- UUID generation via gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_cron;    -- Scheduled cleanup of expired DRAFT orders
```

---

## Enums

| Enum | Values |
|---|---|
| `admin_role` | `super_admin`, `test_admin` |
| `product_type` | `SIMPLE`, `CONFIGURABLE` |
| `product_status` | `ENABLED`, `DISABLED` |
| `order_status` | `DRAFT`, `NEW`, `PROCESSING`, `COMPLETED`, `CANCELED` |
| `payment_status` | `PENDING`, `PAID`, `REFUNDED`, `CANCELED` |
| `shipment_status` | `PENDING`, `SHIPPED`, `DELIVERED`, `CANCELED` |
| `transaction_status` | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` |
| `payment_method` | `COD`, `STRIPE` |
| `address_type` | `SHIPPING`, `BILLING` |

---

## Tables

### Auth & Users

#### `admins`
Admin panel users. One row per admin, linked to `auth.users` via `user_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | → `auth.users.id`, unique |
| `role` | `admin_role` | `super_admin` or `test_admin` |
| `full_name` | text | |
| `contact_number` | text | |
| `avatar_url` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `customers`
Storefront users only. Admin accounts never appear here. A trigger auto-creates a row on every new `auth.users` signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | → `auth.users.id`, nullable (guest support) |
| `email` | text | unique |
| `full_name` | text | |
| `phone` | text | |
| `status` | text | `active` / `inactive` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### Catalogue

#### `categories`
Product categories displayed in the storefront nav.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `slug` | text | unique |
| `description` | text | |
| `image` | text | URL |
| `sort_order` | integer | default 0 |
| `status` | boolean | default true |
| `include_in_nav` | boolean | default false |

#### `collections`
Curated product groupings (e.g. "Summer Sale", "New Arrivals").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `code` | text | unique |
| `slug` | text | unique |
| `description` | text | |

#### `attributes`
Filterable product attributes (e.g. Size, Color).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attribute_name` | text | display label |
| `attribute_code` | text | unique, used in filters |
| `is_required` | boolean | |
| `is_filterable` | boolean | default true |
| `display_on_frontend` | boolean | default true |
| `sort_order` | integer | |

#### `attribute_options`
Possible values for each attribute (e.g. Red, Blue, Size 10).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attribute_id` | uuid FK | → `attributes.id` CASCADE |
| `option_text` | text | display label |
| `option_value` | text | e.g. hex color `#FF0000` |
| `sort_order` | integer | |
| | | unique on `(attribute_id, option_text)` |

---

### Products

#### `products`
Parent product record for both SIMPLE and CONFIGURABLE types.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `type` | `product_type` | `SIMPLE` or `CONFIGURABLE` |
| `title` | text |  |
| `slug` | text | unique, managed by trigger |
| `sku` | text | |
| `price` | numeric(12,2) | ≥ 0 |
| `category_id` | uuid FK | → `categories.id` RESTRICT |
| `short_description` | text | |
| `description` | text | |
| `status` | `product_status` | |
| `visibility` | boolean | |
| `quantity` | integer | ≥ 0; for CONFIGURABLE, sum of variant quantities |
| `fts` | tsvector STORED | full-text search, GIN-indexed |

#### `product_images`
Multiple images per product, ordered by `sort_order`.

#### `product_attribute_values`
Attribute options assigned to a SIMPLE product. Unique on `(product_id, attribute_id, option_id)`.

#### `variant_groups`
A CONFIGURABLE product has exactly one variant group (1-to-1 with `products`).

#### `variant_group_attributes`
Which attributes define the variants in a group (e.g. Size + Color). Unique on `(variant_group_id, attribute_id)`.

#### `product_variants`
Individual sellable variants (e.g. Size 10 / Black). Each variant has its own SKU, price, quantity, and status.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `variant_group_id` | uuid FK | → `variant_groups.id` CASCADE |
| `parent_product_id` | uuid FK | → `products.id` CASCADE |
| `sku` | text | |
| `status` | `product_status` | |
| `quantity` | integer | ≥ 0 |
| `price` | numeric(12,2) | overrides parent price |

#### `variant_images`
One image per variant.

#### `variant_attribute_values`
The specific option chosen for each attribute on a variant (e.g. Color = Red). Unique on `(variant_id, attribute_id)`.

#### `product_collections`
Many-to-many join between products and collections.

---

### Orders

#### `orders`
The top-level order record. `order_number` is auto-generated by a trigger in the format `ORD-YYYYMMDD-NNNN`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_number` | text | unique, human-readable, managed by trigger |
| `user_id` | uuid FK | nullable (guest orders) |
| `email` | text | |
| `payment_method` | `payment_method` | |
| `payment_status` | `payment_status` | synced by trigger |
| `shipment_status` | `shipment_status` | updated by admin |
| `order_status` | `order_status` | derived by trigger from payment + shipment |
| `total` | numeric(12,2) | ≥ 0 |
| `placed_at` | timestamptz | |

#### `order_addresses`
Shipping and billing addresses captured at time of order (one row each per `address_type`).

#### `order_items`
Line items within an order. Price and title are snapshotted at order time — changes to the product catalogue do not affect historical orders.

#### `order_item_attributes`
The attribute values (e.g. Size: 10, Color: Black) for each order item, also snapshotted at purchase time.

#### `order_activities`
Chronological audit log of order events. Rows with `customer_notified = true` are visible to the customer in their order timeline. Admin-only notes have `customer_notified = false`.

#### `payment_transactions`
One transaction record per order. For Stripe orders, `transaction_id` is populated with the PaymentIntent ID after creation.

---

## Helper Functions

These are SECURITY DEFINER functions used in RLS policies throughout the schema.

| Function | Returns | Description |
|---|---|---|
| `public.is_admin()` | boolean | True if `auth.uid()` has a row in `admins` |
| `public.is_super_admin()` | boolean | True if the admin's role is `super_admin` |

---

## Row Level Security Summary

| Table group | Public (anon) | Customer | Admin (any role) | Super Admin |
|---|---|---|---|---|
| Categories, Collections, Attributes, Products, Variants | SELECT | SELECT | SELECT | ALL |
| Orders, Order Items, Addresses | — | SELECT own | SELECT all | ALL |
| Order Activities | — | SELECT where `customer_notified = true` | SELECT all | ALL |
| Payment Transactions | — | — | SELECT all | ALL |
| Admins | — | — | SELECT all | ALL |
| Customers | — | SELECT own | SELECT all | ALL |

---

## Indexes

Beyond primary keys, the schema defines indexes for:

- `categories.slug`, `collections.slug`, `products.slug` — slug lookups
- `products` — composite indexes on `(status, visibility, price)` and `(status, visibility, created_at)` for PLP sorting
- `products.fts` — GIN index for full-text search
- `product_variants.parent_product_id`, `variant_groups.product_id` — variant joins
- `orders` — indexes on `user_id`, `email`, `payment_status`, `shipment_status`, `order_status`, `placed_at`
- All foreign key columns on high-volume join tables (order items, addresses, activities, transactions)

---

## Check Constraints

| Table | Constraint |
|---|---|
| `products` | `price >= 0`, `quantity >= 0` |
| `product_variants` | `price >= 0 OR NULL`, `quantity >= 0` |
| `orders` | `total >= 0` |
| `order_items` | `price >= 0`, `quantity > 0`, `subtotal >= 0` |
| `payment_transactions` | `amount >= 0` |
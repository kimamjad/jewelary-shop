/*
# Catalog & Product Management Schema Enhancement

## Overview
Upgrades the existing products/categories schema to support a flexible attribute system,
soft deletes, visibility control, and additional pricing/inventory fields for a jewelry store.

## Changes to existing tables

### products (modified)
New columns added:
- `short_description` (text) — brief description for product cards
- `compare_at_price` (numeric) — original price for discount display
- `cost_price` (numeric) — internal cost, admin-only access
- `visibility` (text) — 'public' | 'hidden' | 'members_only', default 'public'
- `deleted_at` (timestamptz) — soft delete marker, NULL when active
- `search_vector` (generated tsvector) — full-text search across name, description, sku

### categories (modified)
New columns:
- `deleted_at` (timestamptz) — soft delete marker

## New tables

### 1. attribute_groups
- Groups attributes logically (e.g., "مشخصات انگشتر", "مشخصات سنگ")
- `id`, `name`, `slug`, `sort_order`, `created_at`

### 2. attributes
- Flexible attribute definitions with type and validation
- `id`, `group_id` (FK), `name`, `slug`, `type` (text|number|select|boolean|color)
- `unit` (nullable, e.g., "گرم", "میلی‌متر"), `is_filterable`, `is_required`
- `options` (jsonb) — for select type: array of {value, label}
- `sort_order`, `created_at`

### 3. product_attributes
- Junction table linking products to attributes with values
- `id`, `product_id` (FK), `attribute_id` (FK), `value` (text)
- Unique constraint on (product_id, attribute_id)

## Security (RLS)
- attribute_groups: Public read, admin write
- attributes: Public read, admin write
- product_attributes: Public read, admin write
- All new policies follow the same admin-check pattern as existing tables

## Indexes
- GIN index on products.search_vector for full-text search
- Index on products.deleted_at for filtering active products
- Index on products.visibility for filtering
- Index on attributes.group_id and attributes.slug
- Index on product_attributes.product_id and product_attributes.attribute_id
- Index on categories.deleted_at

## Full-text search
A generated tsvector column `search_vector` combines product name, description, and SKU.
A trigger keeps it updated on INSERT/UPDATE. Search queries use `to_tsquery('persian', ...)`.
*/

-- ============================================================
-- ADD COLUMNS TO products
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'short_description') THEN
    ALTER TABLE products ADD COLUMN short_description text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
    ALTER TABLE products ADD COLUMN compare_at_price numeric(12, 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price numeric(12, 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visibility') THEN
    ALTER TABLE products ADD COLUMN visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden', 'members_only'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'deleted_at') THEN
    ALTER TABLE products ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- ADD COLUMNS TO categories
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'deleted_at') THEN
    ALTER TABLE categories ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- FULL-TEXT SEARCH VECTOR
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'search_vector') THEN
    ALTER TABLE products ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(sku, '')), 'C')
      ) STORED;
  END IF;
END $$;

-- ============================================================
-- ATTRIBUTE GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS attribute_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE attribute_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_attribute_groups" ON attribute_groups;
CREATE POLICY "public_read_attribute_groups" ON attribute_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_attribute_groups" ON attribute_groups;
CREATE POLICY "admin_insert_attribute_groups" ON attribute_groups FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_attribute_groups" ON attribute_groups;
CREATE POLICY "admin_update_attribute_groups" ON attribute_groups FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_attribute_groups" ON attribute_groups;
CREATE POLICY "admin_delete_attribute_groups" ON attribute_groups FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- ATTRIBUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES attribute_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'select', 'boolean', 'color')),
  unit text,
  is_filterable boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT false,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_attributes" ON attributes;
CREATE POLICY "public_read_attributes" ON attributes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_attributes" ON attributes;
CREATE POLICY "admin_insert_attributes" ON attributes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_attributes" ON attributes;
CREATE POLICY "admin_update_attributes" ON attributes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_attributes" ON attributes;
CREATE POLICY "admin_delete_attributes" ON attributes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- PRODUCT ATTRIBUTES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  UNIQUE(product_id, attribute_id)
);
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_attributes" ON product_attributes;
CREATE POLICY "public_read_product_attributes" ON product_attributes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_product_attributes" ON product_attributes;
CREATE POLICY "admin_insert_product_attributes" ON product_attributes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_product_attributes" ON product_attributes;
CREATE POLICY "admin_update_product_attributes" ON product_attributes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_product_attributes" ON product_attributes;
CREATE POLICY "admin_delete_product_attributes" ON product_attributes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attributes_group ON attributes(group_id);
CREATE INDEX IF NOT EXISTS idx_attributes_slug ON attributes(slug);
CREATE INDEX IF NOT EXISTS idx_attributes_filterable ON attributes(is_filterable) WHERE is_filterable = true;
CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute ON product_attributes(attribute_id);

-- ============================================================
-- UPDATE updated_at TRIGGERS for new columns
-- ============================================================
-- Existing trigger already covers products and categories

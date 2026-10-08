/*
# Search & Filter Performance Indexes

## Purpose
Optimize database queries for the storefront search and filtering system.
These indexes support: full-text search, price range filtering, brand filtering,
category filtering, dynamic attribute filtering, and sorting.

## Changes
1. Composite index on products(category_id, status, deleted_at) for category page queries
2. Index on products(brand_id) for brand filtering
3. Index on products(base_price) for price range and sorting
4. Index on products(sale_price) for sale price filtering
5. Composite index on products(status, visibility, deleted_at) for public product listing
6. Index on products(slug) for slug lookups (already unique, but explicit btree for joins)
7. Composite index on product_attributes(attribute_id, value) for dynamic attribute filtering
8. Index on categories(slug) for category page lookups
9. Index on brands(slug) for brand page lookups
10. Index on products(created_at) for sorting by newest
11. Index on products(name) for alphabetical sorting

All indexes use IF NOT EXISTS for idempotency.
*/

-- Composite index for category-filtered public product listings
CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_id, status)
  WHERE deleted_at IS NULL;

-- Index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand
  ON products(brand_id)
  WHERE deleted_at IS NULL;

-- Index for price range filtering and price sorting
CREATE INDEX IF NOT EXISTS idx_products_base_price
  ON products(base_price)
  WHERE deleted_at IS NULL AND status = 'published';

-- Index for sale price filtering
CREATE INDEX IF NOT EXISTS idx_products_sale_price
  ON products(sale_price)
  WHERE deleted_at IS NULL AND status = 'published';

-- Composite index for public product listing (status + visibility)
CREATE INDEX IF NOT EXISTS idx_products_public_listing
  ON products(status, visibility, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for slug lookups on products
CREATE INDEX IF NOT EXISTS idx_products_slug
  ON products(slug)
  WHERE deleted_at IS NULL;

-- Composite index for dynamic attribute filtering
-- This is the critical index: when filtering by attribute_id + value
CREATE INDEX IF NOT EXISTS idx_product_attributes_attr_value
  ON product_attributes(attribute_id, value);

-- Index for category slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories(slug)
  WHERE deleted_at IS NULL;

-- Index for brand slug lookups
CREATE INDEX IF NOT EXISTS idx_brands_slug
  ON brands(slug);

-- Index for created_at sorting (newest products)
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products(created_at DESC)
  WHERE deleted_at IS NULL AND status = 'published';

-- Index for name sorting (alphabetical)
CREATE INDEX IF NOT EXISTS idx_products_name
  ON products(name)
  WHERE deleted_at IS NULL AND status = 'published';

-- Index for stock quantity filtering (in-stock/out-of-stock)
CREATE INDEX IF NOT EXISTS idx_products_stock
  ON products(stock_quantity)
  WHERE deleted_at IS NULL AND status = 'published';

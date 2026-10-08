/*
# Initial Schema for Jewelry E-commerce Store

## Overview
Creates the foundational database schema for a luxury jewelry online store with Persian/Farsi RTL support.
This is a multi-user application with authentication — all owner-scoped tables use auth.uid() for RLS.

## New Tables

### 1. profiles
- Extends auth.users with customer-specific fields
- `id` (uuid, PK, references auth.users)
- `full_name` (text, nullable) — display name
- `phone` (text, nullable) — Iranian phone format
- `role` (text, default 'customer') — customer | admin | super_admin | content_manager
- `created_at`, `updated_at` (timestamps)

### 2. categories
- Product categories (e.g., rings, necklaces, earrings)
- Self-referencing parent_id for nested categories
- `id`, `name`, `slug` (unique), `parent_id`, `image_url`, `description`, `is_active`, `sort_order`, `created_at`

### 3. brands
- Jewelry brands
- `id`, `name`, `slug` (unique), `logo_url`, `description`, `created_at`

### 4. products
- Main product catalog
- `id`, `name`, `slug` (unique), `description`, `brand_id` (FK), `category_id` (FK)
- `base_price`, `sale_price`, `sku` (unique), `stock_quantity`, `status` (draft|published|archived)
- `is_featured`, `weight_grams`, `meta_title`, `meta_description`, timestamps

### 5. product_images
- Multiple images per product
- `id`, `product_id` (FK), `url`, `alt_text`, `sort_order`, `is_primary`

### 6. product_variants
- Size/material variations
- `id`, `product_id` (FK), `sku`, `price`, `stock`, `attribute_values` (JSONB)

### 7. orders
- Customer orders
- `id`, `user_id` (FK, default auth.uid()), `status`, `total_amount`
- `shipping_address` (JSONB), `payment_status`, `payment_ref`, `notes`, timestamps

### 8. order_items
- Line items within orders
- `id`, `order_id` (FK), `product_id` (FK), `variant_id` (FK nullable)
- `quantity`, `unit_price`, `product_snapshot` (JSONB for historical record)

### 9. wishlists
- User favorite products
- `id`, `user_id` (FK, default auth.uid()), `product_id` (FK), `created_at`

### 10. reviews
- Product reviews from verified users
- `id`, `product_id` (FK), `user_id` (FK), `rating` (1-5), `comment`, `is_approved`, `created_at`

### 11. discounts
- Discount codes for checkout
- `id`, `code` (unique), `type` (percentage|fixed), `value`, `min_order`, `max_uses`, `used_count`, `expires_at`, `is_active`

### 12. blog_categories
- Blog post categories
- `id`, `name`, `slug` (unique), `description`

### 13. blog_posts
- Blog articles
- `id`, `title`, `slug` (unique), `content`, `excerpt`, `author_id` (FK)
- `category_id` (FK nullable), `status`, `featured_image`, `meta_title`, `meta_description`, `published_at`, timestamps

### 14. admin_activity_logs
- Audit trail for admin actions
- `id`, `admin_id` (FK), `action`, `entity_type`, `entity_id`, `details` (JSONB), `created_at`

## Security (RLS)

All tables have Row Level Security enabled:

- **profiles**: Users can read/update own profile. Admins can read all.
- **categories, brands**: Public read (published). Admin write only.
- **products, product_images, product_variants**: Public read (published only). Admin write only.
- **orders, order_items**: Users can CRUD own orders. Admins can read all.
- **wishlists**: Users can CRUD own wishlist items.
- **reviews**: Public read (approved only). Authenticated users can create own. Admins can update approval.
- **discounts**: Public read (active). Admin write only.
- **blog_categories, blog_posts**: Public read (published). Admin write only.
- **admin_activity_logs**: Admin read/write only.

## Indexes
- slug columns on categories, brands, products, blog_posts
- FK columns for join performance
- status/is_active/is_featured for filtering
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'content_manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_brands" ON brands;
CREATE POLICY "public_read_brands" ON brands FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_brands" ON brands;
CREATE POLICY "admin_insert_brands" ON brands FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_update_brands" ON brands;
CREATE POLICY "admin_update_brands" ON brands FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_delete_brands" ON brands;
CREATE POLICY "admin_delete_brands" ON brands FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  base_price numeric(12, 0) NOT NULL DEFAULT 0,
  sale_price numeric(12, 0),
  sku text NOT NULL UNIQUE,
  stock_quantity int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  weight_grams numeric(8, 2),
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_product_images" ON product_images;
CREATE POLICY "admin_insert_product_images" ON product_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_product_images" ON product_images;
CREATE POLICY "admin_update_product_images" ON product_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_product_images" ON product_images;
CREATE POLICY "admin_delete_product_images" ON product_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  price numeric(12, 0) NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0,
  attribute_values jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_variants" ON product_variants;
CREATE POLICY "public_read_product_variants" ON product_variants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_product_variants" ON product_variants;
CREATE POLICY "admin_insert_product_variants" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_product_variants" ON product_variants;
CREATE POLICY "admin_update_product_variants" ON product_variants FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_product_variants" ON product_variants;
CREATE POLICY "admin_delete_product_variants" ON product_variants FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total_amount numeric(14, 0) NOT NULL DEFAULT 0,
  shipping_address jsonb,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12, 0) NOT NULL DEFAULT 0,
  product_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishlist" ON wishlists;
CREATE POLICY "select_own_wishlist" ON wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON wishlists;
CREATE POLICY "insert_own_wishlist" ON wishlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON wishlists;
CREATE POLICY "delete_own_wishlist" ON wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (is_approved = true);

DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_reviews" ON reviews;
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- DISCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric(12, 0) NOT NULL DEFAULT 0,
  min_order numeric(12, 0),
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_discounts" ON discounts;
CREATE POLICY "public_read_discounts" ON discounts FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_discounts" ON discounts;
CREATE POLICY "admin_insert_discounts" ON discounts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_update_discounts" ON discounts;
CREATE POLICY "admin_update_discounts" ON discounts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_delete_discounts" ON discounts;
CREATE POLICY "admin_delete_discounts" ON discounts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- BLOG CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text
);
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_categories" ON blog_categories;
CREATE POLICY "public_read_blog_categories" ON blog_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_blog_categories" ON blog_categories;
CREATE POLICY "admin_insert_blog_categories" ON blog_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_blog_categories" ON blog_categories;
CREATE POLICY "admin_update_blog_categories" ON blog_categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_blog_categories" ON blog_categories;
CREATE POLICY "admin_delete_blog_categories" ON blog_categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured_image text,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_posts" ON blog_posts;
CREATE POLICY "public_read_blog_posts" ON blog_posts FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "admin_insert_blog_posts" ON blog_posts;
CREATE POLICY "admin_insert_blog_posts" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_blog_posts" ON blog_posts;
CREATE POLICY "admin_update_blog_posts" ON blog_posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_blog_posts" ON blog_posts;
CREATE POLICY "admin_delete_blog_posts" ON blog_posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- ADMIN ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_activity_logs" ON admin_activity_logs;
CREATE POLICY "admin_read_activity_logs" ON admin_activity_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_insert_activity_logs" ON admin_activity_logs;
CREATE POLICY "admin_insert_activity_logs" ON admin_activity_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON admin_activity_logs(admin_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated ON profiles;
CREATE TRIGGER trigger_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated ON products;
CREATE TRIGGER trigger_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated ON orders;
CREATE TRIGGER trigger_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_blog_posts_updated ON blog_posts;
CREATE TRIGGER trigger_blog_posts_updated BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

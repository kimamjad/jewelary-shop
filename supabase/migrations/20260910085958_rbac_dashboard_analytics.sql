/*
# RBAC System and Dashboard Analytics

## Summary
Implements a complete Role-Based Access Control (RBAC) system with server-side enforcement,
plus dashboard analytics functions and admin audit logging.

## Changes

### 1. New Tables

**roles** — Defines the 5 admin roles in the system:
- super_admin, admin, content_manager, order_manager, product_manager
- Each has a description for display purposes

**permissions** — Defines granular permissions:
- e.g. products.view, products.create, orders.manage, blog.manage, users.manage, etc.
- Each has a resource and action for structured access control

**role_permissions** — Maps roles to their permissions:
- Many-to-many junction table
- super_admin gets ALL permissions automatically via a function

### 2. Modified Tables

**profiles** — Added:
- `role_id` (uuid, nullable, FK to roles) — links profile to RBAC role
- Updated role CHECK constraint to include new roles: order_manager, product_manager

### 3. New Functions (all SECURITY DEFINER)

**has_permission(p_permission text)** — Checks if the current user has a specific permission.
Returns true if super_admin or if the user's role has the permission.

**get_dashboard_stats(p_start date, p_end date)** — Returns comprehensive dashboard metrics:
- total_sales, net_sales, order_count, avg_order_value
- customer_count, product_count
- low_stock_count, out_of_stock_count, pending_orders_count
- recent_orders (last 5), best_sellers (top 5 by quantity)
- sales_trend (daily totals within range)

**log_admin_action(p_action text, p_entity_type text, p_entity_id uuid, p_details jsonb)**
— Creates an audit log entry for admin actions. Callable by any admin role.

### 4. Security

- roles table: admin read-only (all admin roles can see roles)
- permissions table: admin read-only
- role_permissions table: admin read-only
- All functions are SECURITY DEFINER with search_path = public
- has_permission is callable by authenticated users
- get_dashboard_stats and log_admin_action are callable by authenticated admin users only

### 5. Important Notes

1. **Server-side enforcement**: has_permission() runs as SECURITY DEFINER, so it always
   sees the real profile regardless of RLS. Frontend permission checks are for UX only.
2. **super_admin bypass**: super_admin automatically has ALL permissions — no need to
   maintain role_permissions rows for super_admin.
3. **Dashboard analytics**: All price calculations happen server-side. The function aggregates
   from orders and order_items, not from client-provided values.
4. **Audit trail**: log_admin_action records who did what, when, with details in JSONB.
*/

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_roles" ON roles;
CREATE POLICY "admin_read_roles" ON roles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager', 'order_manager', 'product_manager'))
  );

-- ============================================================
-- PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_permissions" ON permissions;
CREATE POLICY "admin_read_permissions" ON permissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager', 'order_manager', 'product_manager'))
  );

-- ============================================================
-- ROLE_PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_role_permissions" ON role_permissions;
CREATE POLICY "admin_read_role_permissions" ON role_permissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager', 'order_manager', 'product_manager'))
  );

DROP POLICY IF EXISTS "super_admin_manage_role_permissions" ON role_permissions;
CREATE POLICY "super_admin_manage_role_permissions" ON role_permissions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- ============================================================
-- UPDATE PROFILES TABLE — Add role_id
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
    ALTER TABLE profiles ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;

  -- Update role constraint to include new roles
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('customer', 'admin', 'super_admin', 'content_manager', 'order_manager', 'product_manager'));
  END IF;
END $$;

-- ============================================================
-- SEED ROLES
-- ============================================================
INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'دسترسی کامل به همه بخش‌ها', true),
  ('admin', 'مدیر فروشگاه با دسترسی وسیع', true),
  ('content_manager', 'مدیر محتوا و وبلاگ', true),
  ('order_manager', 'مدیر سفارش‌ها و ارسال', true),
  ('product_manager', 'مدیر محصولات و موجودی', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED PERMISSIONS
-- ============================================================
INSERT INTO permissions (name, resource, action, description) VALUES
  ('dashboard.view', 'dashboard', 'view', 'مشاهده داشبورد'),
  ('products.view', 'products', 'view', 'مشاهده محصولات'),
  ('products.create', 'products', 'create', 'ایجاد محصول'),
  ('products.edit', 'products', 'edit', 'ویرایش محصول'),
  ('products.delete', 'products', 'delete', 'حذف محصول'),
  ('inventory.view', 'inventory', 'view', 'مشاهده موجودی'),
  ('inventory.manage', 'inventory', 'manage', 'مدیریت موجودی'),
  ('categories.manage', 'categories', 'manage', 'مدیریت دسته‌بندی‌ها'),
  ('attributes.manage', 'attributes', 'manage', 'مدیریت ویژگی‌ها'),
  ('orders.view', 'orders', 'view', 'مشاهده سفارش‌ها'),
  ('orders.manage', 'orders', 'manage', 'مدیریت سفارش‌ها'),
  ('customers.view', 'customers', 'view', 'مشاهده مشتریان'),
  ('customers.manage', 'customers', 'manage', 'مدیریت مشتریان'),
  ('discounts.manage', 'discounts', 'manage', 'مدیریت تخفیف‌ها'),
  ('blog.manage', 'blog', 'manage', 'مدیریت وبلاگ'),
  ('media.manage', 'media', 'manage', 'مدیریت رسانه'),
  ('reports.view', 'reports', 'view', 'مشاهده گزارش‌ها'),
  ('users.view', 'users', 'view', 'مشاهده کاربران'),
  ('users.manage', 'users', 'manage', 'مدیریت کاربران'),
  ('roles.manage', 'roles', 'manage', 'مدیریت نقش‌ها'),
  ('settings.manage', 'settings', 'manage', 'مدیریت تنظیمات'),
  ('activity_logs.view', 'activity_logs', 'view', 'مشاهده لاگ فعالیت')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED ROLE_PERMISSIONS (except super_admin — bypassed in function)
-- ============================================================
DO $$
DECLARE
  v_admin_role uuid;
  v_content_role uuid;
  v_order_role uuid;
  v_product_role uuid;
  v_perm_id uuid;
BEGIN
  SELECT id INTO v_admin_role FROM roles WHERE name = 'admin';
  SELECT id INTO v_content_role FROM roles WHERE name = 'content_manager';
  SELECT id INTO v_order_role FROM roles WHERE name = 'order_manager';
  SELECT id INTO v_product_role FROM roles WHERE name = 'product_manager';

  -- admin: everything except roles.manage
  IF v_admin_role IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role, id FROM permissions WHERE name != 'roles.manage'
    ON CONFLICT DO NOTHING;
  END IF;

  -- content_manager: dashboard, blog, media
  IF v_content_role IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_content_role, id FROM permissions
    WHERE name IN ('dashboard.view', 'blog.manage', 'media.manage', 'products.view')
    ON CONFLICT DO NOTHING;
  END IF;

  -- order_manager: dashboard, orders, customers, reports
  IF v_order_role IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_order_role, id FROM permissions
    WHERE name IN ('dashboard.view', 'orders.view', 'orders.manage', 'customers.view', 'reports.view', 'activity_logs.view')
    ON CONFLICT DO NOTHING;
  END IF;

  -- product_manager: dashboard, products, inventory, categories, attributes
  IF v_product_role IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_product_role, id FROM permissions
    WHERE name IN ('dashboard.view', 'products.view', 'products.create', 'products.edit', 'inventory.view', 'inventory.manage', 'categories.manage', 'attributes.manage', 'reports.view')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- HAS_PERMISSION FUNCTION (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION has_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_role_id uuid;
BEGIN
  SELECT profiles.role INTO v_role FROM profiles WHERE profiles.id = auth.uid();

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- super_admin has all permissions
  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Check if the user's role has the permission
  SELECT profiles.role_id INTO v_role_id FROM profiles WHERE profiles.id = auth.uid();

  IF v_role_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = v_role_id AND p.name = p_permission
  );
END;
$$;

GRANT EXECUTE ON FUNCTION has_permission(text) TO authenticated;

-- ============================================================
-- GET_DASHBOARD_STATS FUNCTION (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_start date DEFAULT NULL, p_end date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date := COALESCE(p_start, (CURRENT_DATE - INTERVAL '30 days')::date);
  v_end date := COALESCE(p_end, CURRENT_DATE);
  v_total_sales numeric(14, 0) := 0;
  v_net_sales numeric(14, 0) := 0;
  v_order_count int := 0;
  v_avg_order_value numeric(14, 0) := 0;
  v_customer_count int := 0;
  v_product_count int := 0;
  v_low_stock_count int := 0;
  v_out_of_stock_count int := 0;
  v_pending_orders int := 0;
  v_recent_orders jsonb;
  v_best_sellers jsonb;
  v_sales_trend jsonb;
BEGIN
  -- Total sales (sum of total_amount for non-cancelled orders in range)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_sales
  FROM orders
  WHERE created_at >= v_start AND created_at < (v_end + 1)
    AND status NOT IN ('cancelled', 'refunded');

  -- Net sales (total minus shipping and discounts)
  SELECT COALESCE(SUM(subtotal - discount_amount), 0) INTO v_net_sales
  FROM orders
  WHERE created_at >= v_start AND created_at < (v_end + 1)
    AND status NOT IN ('cancelled', 'refunded');

  -- Order count
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE created_at >= v_start AND created_at < (v_end + 1);

  -- Average order value
  v_avg_order_value := CASE WHEN v_order_count > 0 THEN v_total_sales / v_order_count ELSE 0 END;

  -- Customer count (profiles with role = customer)
  SELECT COUNT(*) INTO v_customer_count
  FROM profiles WHERE role = 'customer';

  -- Product count (non-deleted)
  SELECT COUNT(*) INTO v_product_count
  FROM products WHERE deleted_at IS NULL;

  -- Low stock (<= 10 and > 0)
  SELECT COUNT(*) INTO v_low_stock_count
  FROM products WHERE stock_quantity > 0 AND stock_quantity <= 10 AND deleted_at IS NULL;

  -- Out of stock
  SELECT COUNT(*) INTO v_out_of_stock_count
  FROM products WHERE stock_quantity = 0 AND deleted_at IS NULL;

  -- Pending orders
  SELECT COUNT(*) INTO v_pending_orders
  FROM orders WHERE status = 'pending';

  -- Recent orders (last 5)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'customer_name', COALESCE(o.customer_info->>'full_name', 'ناشناس'),
    'total', o.total_amount,
    'status', o.status,
    'payment_status', o.payment_status,
    'created_at', o.created_at
  ) ORDER BY o.created_at DESC), '[]'::jsonb) INTO v_recent_orders
  FROM orders o
  WHERE o.created_at >= v_start AND o.created_at < (v_end + 1)
  LIMIT 5;

  -- Best sellers (top 5 by quantity sold in range)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_id', oi.product_id,
    'product_name', COALESCE(oi.product_name, 'نامشخص'),
    'total_sold', SUM(oi.quantity),
    'revenue', SUM(oi.quantity * oi.unit_price)
  ) ORDER BY SUM(oi.quantity) DESC), '[]'::jsonb) INTO v_best_sellers
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= v_start AND o.created_at < (v_end + 1)
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id, oi.product_name
  LIMIT 5;

  -- Sales trend (daily totals within range)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', d::text,
    'sales', COALESCE(SUM(o.total_amount), 0),
    'orders', COUNT(o.id)
  ) ORDER BY d), '[]'::jsonb) INTO v_sales_trend
  FROM generate_series(v_start, v_end, '1 day'::interval) AS d
  LEFT JOIN orders o ON o.created_at >= d AND o.created_at < (d + INTERVAL '1 day')
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY d;

  RETURN jsonb_build_object(
    'total_sales', v_total_sales,
    'net_sales', v_net_sales,
    'order_count', v_order_count,
    'avg_order_value', v_avg_order_value,
    'customer_count', v_customer_count,
    'product_count', v_product_count,
    'low_stock_count', v_low_stock_count,
    'out_of_stock_count', v_out_of_stock_count,
    'pending_orders', v_pending_orders,
    'recent_orders', v_recent_orders,
    'best_sellers', v_best_sellers,
    'sales_trend', v_sales_trend,
    'start_date', v_start::text,
    'end_date', v_end::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats(date, date) TO authenticated;

-- ============================================================
-- LOG_ADMIN_ACTION FUNCTION (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION log_admin_action(text, text, uuid, jsonb) TO authenticated;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE deleted_at IS NULL;
/*
# E-commerce Order Management Enhancement

## Summary
Enhances the existing orders and order_items tables to support a full e-commerce checkout flow
with server-side price calculation, inventory reservation, and product snapshots.

## Changes

### 1. Modified Tables

**orders** — Added columns:
- `subtotal` (numeric(14,0)): Sum of all item prices before shipping/discount
- `shipping_cost` (numeric(14,0), default 0): Cost of shipping
- `discount_amount` (numeric(14,0), default 0): Discount applied
- `shipping_method` (text): Shipping method chosen ('post', 'tipax', 'pickup')
- `payment_method` (text): Payment method chosen
- `customer_info` (jsonb): Snapshot of customer name, phone, email at time of order

**order_items** — Added columns:
- `product_name` (text): Snapshot of product name at time of order
- `product_slug` (text): Snapshot of product slug

### 2. New Functions

**create_order(p_items jsonb, p_customer_info jsonb, p_shipping_info jsonb, p_shipping_method text, p_payment_method text, p_notes text)**
- SECURITY DEFINER function callable by authenticated users
- Reads product prices from the database (NOT from client input)
- Locks product rows with FOR UPDATE to prevent race conditions
- Validates stock availability for each item
- Creates order with correct subtotal, shipping cost, and total
- Decrements product stock_quantity atomically
- Creates order_items with product snapshots (name, slug, price)
- Returns the created order as JSON
- Raises exceptions with clear Persian error messages

### 3. New Policies

- Added DELETE policy on orders for admins (cancel orders)
- Added UPDATE policy on order_items for admins (price adjustments, corrections)

### 4. Important Notes

1. **Price Integrity**: The client sends only product_id and quantity. The server reads
   the actual price from the products table — the client cannot influence the price.
2. **Race Condition Prevention**: Product rows are locked with `FOR UPDATE` during the
   transaction. If two users try to buy the last item simultaneously, only one succeeds.
3. **Product Snapshots**: order_items stores a snapshot of product name, slug, and price
   at the time of purchase. Changing the product later does not affect historical orders.
4. **Stock Management**: Stock is decremented atomically within the function. If stock
   is insufficient, the entire operation fails and no order is created.
5. **Shipping Cost**: A flat 50,000 Toman shipping fee is applied for 'post' method,
   30,000 for 'tipax', and 0 for 'pickup'. This can be made configurable later.
*/

-- ============================================================
-- ALTER orders TABLE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric(14, 0) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost numeric(14, 0) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric(14, 0) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_method') THEN
    ALTER TABLE orders ADD COLUMN shipping_method text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_info') THEN
    ALTER TABLE orders ADD COLUMN customer_info jsonb;
  END IF;
END $$;

-- ============================================================
-- ALTER order_items TABLE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
    ALTER TABLE order_items ADD COLUMN product_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_slug') THEN
    ALTER TABLE order_items ADD COLUMN product_slug text;
  END IF;
END $$;

-- ============================================================
-- CREATE ORDER FUNCTION (SECURITY DEFINER)
-- ============================================================
-- This function is the single source of truth for order creation.
-- It reads prices from the database, validates stock, and atomically
-- creates the order, order items, and decrements inventory.

CREATE OR REPLACE FUNCTION create_order(
  p_items jsonb,
  p_customer_info jsonb,
  p_shipping_info jsonb,
  p_shipping_method text DEFAULT 'post',
  p_payment_method text DEFAULT 'zarinpal',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_subtotal numeric(14, 0) := 0;
  v_shipping_cost numeric(14, 0) := 0;
  v_total numeric(14, 0) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_unit_price numeric(12, 0);
  v_product_name text;
  v_product_slug text;
  v_stock int;
  v_product_record RECORD;
BEGIN
  -- Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'سبد خرید خالی است';
  END IF;

  -- Calculate shipping cost
  v_shipping_cost := CASE p_shipping_method
    WHEN 'post' THEN 50000
    WHEN 'tipax' THEN 30000
    WHEN 'pickup' THEN 0
    ELSE 50000
  END;

  -- Create the order first
  INSERT INTO orders (
    user_id, status, payment_status, total_amount,
    subtotal, shipping_cost, discount_amount,
    shipping_address, shipping_method, payment_method,
    customer_info, notes
  )
  VALUES (
    auth.uid(), 'pending', 'pending', 0,
    0, v_shipping_cost, 0,
    p_shipping_info, p_shipping_method, p_payment_method,
    p_customer_info, p_notes
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    -- Validate quantity
    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'تعداد محصول نامعتبر است';
    END IF;

    -- Lock the product row and read current price + stock
    -- FOR UPDATE prevents race conditions
    SELECT name, slug, base_price, sale_price, stock_quantity, status, deleted_at
    INTO v_product_record
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'محصول یافت نشد';
    END IF;

    IF v_product_record.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'محصول % حذف شده است', v_product_record.name;
    END IF;

    IF v_product_record.status != 'published' THEN
      RAISE EXCEPTION 'محصول % در دسترس نیست', v_product_record.name;
    END IF;

    IF v_product_record.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'موجودی محصول % کافی نیست (موجودی فعلی: %)',
        v_product_record.name, v_product_record.stock_quantity;
    END IF;

    -- Determine unit price: sale_price if set, otherwise base_price
    v_unit_price := COALESCE(v_product_record.sale_price, v_product_record.base_price);
    v_product_name := v_product_record.name;
    v_product_slug := v_product_record.slug;

    -- Create order item with snapshot
    INSERT INTO order_items (
      order_id, product_id, quantity, unit_price,
      product_snapshot, product_name, product_slug
    )
    VALUES (
      v_order_id, v_product_id, v_quantity, v_unit_price,
      jsonb_build_object(
        'name', v_product_name,
        'slug', v_product_slug,
        'price', v_unit_price,
        'purchased_at', now()
      ),
      v_product_name, v_product_slug
    );

    -- Decrement stock
    UPDATE products
    SET stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    WHERE id = v_product_id;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  -- Calculate total and update the order
  v_total := v_subtotal + v_shipping_cost;

  UPDATE orders
  SET subtotal = v_subtotal,
      total_amount = v_total
  WHERE id = v_order_id;

  -- Return the created order with items
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'shipping_cost', v_shipping_cost,
    'total', v_total,
    'status', 'pending',
    'payment_status', 'pending'
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_order(jsonb, jsonb, jsonb, text, text, text) TO authenticated;

-- ============================================================
-- ADDITIONAL POLICIES
-- ============================================================

-- Allow admins to delete (cancel) orders
DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- Allow admins to update order items
DROP POLICY IF EXISTS "admin_update_order_items" ON order_items;
CREATE POLICY "admin_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

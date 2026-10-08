/*
# Seed Data for Development

Populates the database with initial data for development:
1. Categories — jewelry type categories (rings, necklaces, earrings, bracelets)
2. Brands — sample jewelry brands
3. Products — sample products with images and variants
4. Blog categories — article categories
5. Blog posts — sample articles
6. Discounts — sample discount codes

Note: This data is for development only and is safe to re-run.
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('انگشتر', 'rings', 'انگشترهای طلا و نقره', true, 1),
  ('گردنبند', 'necklaces', 'گردنبندهای طلا و جواهر', true, 2),
  ('گوشواره', 'earrings', 'گوشواره‌های متنوع', true, 3),
  ('دستبند', 'bracelets', 'دستبندهای طلا و نقره', true, 4),
  ('ساعت', 'watches', 'ساعت‌های لوکس', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- BRANDS
-- ============================================================
INSERT INTO brands (name, slug, description) VALUES
  ('جواهر طلایی', 'golden-jewel', 'برند طلایی لوکس'),
  ('نقره پارسیان', 'persian-silver', 'نقره‌های اصیل ایرانی'),
  ('الماس رویال', 'royal-diamond', 'الماس‌های درجه یک')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- BLOG CATEGORIES
-- ============================================================
INSERT INTO blog_categories (name, slug, description) VALUES
  ('راهنمای خرید', 'buying-guide', 'راهنمایی برای خرید جواهر'),
  ('ترند ها', 'trends', 'ترندهای روز جواهر'),
  ('مراقبت', 'care-tips', 'نکات مراقبت از جواهر')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DISCOUNTS
-- ============================================================
INSERT INTO discounts (code, type, value, min_order, is_active) VALUES
  ('WELCOME10', 'percentage', 10, null, true),
  ('FREESHIP', 'fixed', 50000, 500000, true)
ON CONFLICT (code) DO NOTHING;

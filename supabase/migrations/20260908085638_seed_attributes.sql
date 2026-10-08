/*
# Seed: Attribute Groups and Attributes for Jewelry

Seeds the flexible attribute system with jewelry-specific attribute groups and attributes.
Safe to re-run (ON CONFLICT DO NOTHING).
*/

-- ============================================================
-- ATTRIBUTE GROUPS
-- ============================================================
INSERT INTO attribute_groups (name, slug, sort_order) VALUES
  ('مشخصات انگشتر', 'ring-specs', 1),
  ('مشخصات سنگ', 'stone-specs', 2),
  ('مشخصات عمومی', 'general-specs', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ATTRIBUTES — RING SPECS
-- ============================================================
INSERT INTO attributes (group_id, name, slug, type, unit, is_filterable, is_required, options, sort_order)
SELECT ag.id, v.name, v.slug, v.type, v.unit, v.is_filterable, v.is_required, v.options::jsonb, v.sort_order
FROM attribute_groups ag
CROSS JOIN (VALUES
  ('جنس', 'material', 'select', NULL::text, true, true, '["طلا","نقره","پلاتین","ورمیل"]'::text, 1),
  ('عیار', 'purity', 'text', NULL, true, false, '[]', 2),
  ('سایز', 'size', 'number', 'mm', true, false, '[]', 3),
  ('وزن', 'weight', 'number', 'g', false, false, '[]', 4),
  ('رنگ', 'color', 'color', NULL, true, false, '[]', 5),
  ('نوع سنگ', 'ring_stone_type', 'select', NULL, true, false, '["الماس","یاقوت","زمرد","عرق‌الجواه","زیرکون","بدون سنگ"]', 6),
  ('رنگ سنگ', 'ring_stone_color', 'select', NULL, true, false, '["بی‌رنگ","قرمز","آبی","سبز","زرد","صورتی","بنفش","سیاه"]', 7),
  ('وزن سنگ', 'ring_stone_weight', 'number', 'ct', false, false, '[]', 8),
  ('شکل سنگ', 'ring_stone_shape', 'select', NULL, false, false, '["گرد","مربع","بیضی","مروارید","اشک‌دار","هشت‌ضلعی"]', 9)
) AS v(name, slug, type, unit, is_filterable, is_required, options, sort_order)
WHERE ag.slug = 'ring-specs'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ATTRIBUTES — STONE SPECS
-- ============================================================
INSERT INTO attributes (group_id, name, slug, type, unit, is_filterable, is_required, options, sort_order)
SELECT ag.id, v.name, v.slug, v.type, v.unit, v.is_filterable, v.is_required, v.options::jsonb, v.sort_order
FROM attribute_groups ag
CROSS JOIN (VALUES
  ('نوع سنگ', 'stone_type', 'select', NULL::text, true, true, '["الماس","یاقوت","زمرد","عرق‌الجواه","زیرکون","تورمالین","آکوامارین","سیترین"]'::text, 1),
  ('وزن', 'stone_weight', 'number', 'ct', true, true, '[]', 2),
  ('رنگ', 'stone_color', 'select', NULL, true, false, '["بی‌رنگ","قرمز","آبی","سبز","زرد","صورتی","بنفش","سیاه","قهوه‌ای"]', 3),
  ('تراش', 'stone_cut', 'select', NULL, true, false, '["برلیانت","مروارید","مارکیز","امرالد","پرنسس","اشک‌دار","کابوشن"]', 4),
  ('ابعاد', 'stone_dimensions', 'text', 'mm', false, false, '[]', 5),
  ('منشأ', 'stone_origin', 'text', NULL, false, false, '[]', 6),
  ('کیفیت', 'stone_quality', 'select', NULL, true, false, '["عالی","خیلی خوب","خوب","متوسط"]', 7),
  ('نوع کاربرد', 'stone_usage', 'select', NULL, false, false, '["انگشتر","گردنبند","گوشواره","دستبند","نیم‌ست","تک‌سنگ"]', 8)
) AS v(name, slug, type, unit, is_filterable, is_required, options, sort_order)
WHERE ag.slug = 'stone-specs'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ATTRIBUTES — GENERAL SPECS
-- ============================================================
INSERT INTO attributes (group_id, name, slug, type, unit, is_filterable, is_required, options, sort_order)
SELECT ag.id, v.name, v.slug, v.type, v.unit, v.is_filterable, v.is_required, v.options::jsonb, v.sort_order
FROM attribute_groups ag
CROSS JOIN (VALUES
  ('گارانتی', 'warranty', 'text', NULL::text, false, false, '[]'::text, 1),
  ('بسته‌بندی', 'packaging', 'text', NULL, false, false, '[]', 2),
  ('قابلیت ارسال', 'shipping_available', 'boolean', NULL, false, false, '[]', 3)
) AS v(name, slug, type, unit, is_filterable, is_required, options, sort_order)
WHERE ag.slug = 'general-specs'
ON CONFLICT (slug) DO NOTHING;

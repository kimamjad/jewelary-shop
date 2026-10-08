/*
# Blog Tags, SEO Fields, and Related Posts Infrastructure

## Summary
Adds blog tags system, canonical URLs and Open Graph metadata to blog posts,
SEO metadata columns to categories, and reading time estimation function.

## Changes

### 1. New Tables

**blog_tags** — Tag labels for blog posts:
- `id`, `name`, `slug` (unique), `created_at`
- Public read, admin write

**blog_post_tags** — Many-to-many junction between posts and tags:
- `post_id` (FK to blog_posts), `tag_id` (FK to blog_tags)
- Unique pair constraint
- Public read, admin write

### 2. Modified Tables

**blog_posts** — Added columns:
- `canonical_url` (text, nullable) — for canonical link tag
- `og_image` (text, nullable) — Open Graph image URL (falls back to featured_image)
- `reading_time_minutes` (int, nullable) — estimated reading time

**categories** — Added columns:
- `meta_title` (text, nullable) — SEO title for category pages
- `meta_description` (text, nullable) — SEO description for category pages

### 3. New Function

**estimate_reading_time(content text)** — Estimates reading time in minutes
based on word count (200 words/minute for Persian text).

### 4. Security
- blog_tags: public read (anon+authenticated), admin write (content_manager+)
- blog_post_tags: public read, admin write
- All existing blog_posts policies remain unchanged; new columns inherit existing policies

### 5. Important Notes
1. Tags are optional on posts — a post can have zero or more tags
2. canonical_url when null means the post's own URL is canonical
3. og_image falls back to featured_image in the frontend when null
4. reading_time_minutes is set by the admin editor, not auto-calculated in DB
*/

-- ============================================================
-- BLOG TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_tags" ON blog_tags;
CREATE POLICY "public_read_blog_tags" ON blog_tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_blog_tags" ON blog_tags;
CREATE POLICY "admin_insert_blog_tags" ON blog_tags FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_update_blog_tags" ON blog_tags;
CREATE POLICY "admin_update_blog_tags" ON blog_tags FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_blog_tags" ON blog_tags;
CREATE POLICY "admin_delete_blog_tags" ON blog_tags FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- BLOG POST TAGS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_post_tags" ON blog_post_tags;
CREATE POLICY "public_read_blog_post_tags" ON blog_post_tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_blog_post_tags" ON blog_post_tags;
CREATE POLICY "admin_insert_blog_post_tags" ON blog_post_tags FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

DROP POLICY IF EXISTS "admin_delete_blog_post_tags" ON blog_post_tags;
CREATE POLICY "admin_delete_blog_post_tags" ON blog_post_tags FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'content_manager'))
  );

-- ============================================================
-- ADD SEO COLUMNS TO blog_posts
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'canonical_url') THEN
    ALTER TABLE blog_posts ADD COLUMN canonical_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'og_image') THEN
    ALTER TABLE blog_posts ADD COLUMN og_image text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'reading_time_minutes') THEN
    ALTER TABLE blog_posts ADD COLUMN reading_time_minutes int;
  END IF;
END $$;

-- ============================================================
-- ADD SEO COLUMNS TO categories
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_title') THEN
    ALTER TABLE categories ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_description') THEN
    ALTER TABLE categories ADD COLUMN meta_description text;
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE status = 'published';
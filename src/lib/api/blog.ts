import { supabase } from "@/lib/supabase"
import type {
  BlogPost,
  BlogPostWithRelations,
  BlogPostListItem,
  BlogCategory,
  BlogTag,
  BlogPostStatus,
} from "@/types"

// ============================================================
// Slug generation for Persian text
// ============================================================

export function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// ============================================================
// Public Blog: Posts list
// ============================================================

export async function fetchPublishedPosts(params?: {
  page?: number
  pageSize?: number
  categoryId?: string
  tagId?: string
  search?: string
}): Promise<{ posts: BlogPostListItem[]; total: number }> {
  const { page = 1, pageSize = 9, categoryId, tagId, search = "" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("blog_posts")
    .select(`
      id, title, slug, excerpt, featured_image, published_at, reading_time_minutes,
      category:blog_categories(id, name, slug),
      author:profiles!author_id(id, full_name)
    `, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
  }

  query = query.range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  let posts = (data ?? []) as unknown as BlogPostListItem[]

  if (tagId) {
    const { data: tagPosts } = await supabase
      .from("blog_post_tags")
      .select("post_id")
      .eq("tag_id", tagId)
    const postIds = new Set((tagPosts ?? []).map((t: { post_id: string }) => t.post_id))
    posts = posts.filter((p) => postIds.has(p.id))
  }

  return { posts, total: count ?? 0 }
}

// ============================================================
// Public Blog: Single post by slug
// ============================================================

export async function fetchPostBySlug(slug: string): Promise<BlogPostWithRelations | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      category:blog_categories(id, name, slug, description),
      author:profiles!author_id(id, full_name),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const post = data as Record<string, unknown>
  const tags = (post.tags as { tag: BlogTag }[] | null)?.map((t) => t.tag) ?? []
  return {
    ...(post as unknown as BlogPost),
    category: post.category as BlogCategory | null,
    author: post.author as { id: string; full_name: string | null } | null,
    tags,
  }
}

// ============================================================
// Public Blog: Related posts
// ============================================================

export async function fetchRelatedPosts(postId: string, categoryId: string | null, limit = 3): Promise<BlogPostListItem[]> {
  let query = supabase
    .from("blog_posts")
    .select(`
      id, title, slug, excerpt, featured_image, published_at, reading_time_minutes,
      category:blog_categories(id, name, slug),
      author:profiles!author_id(id, full_name)
    `)
    .eq("status", "published")
    .neq("id", postId)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit * 2)

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as unknown as BlogPostListItem[]).slice(0, limit)
}

// ============================================================
// Public Blog: Categories
// ============================================================

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name")
  if (error) throw error
  return (data ?? []) as BlogCategory[]
}

// ============================================================
// Public Blog: Tags
// ============================================================

export async function fetchBlogTags(): Promise<BlogTag[]> {
  const { data, error } = await supabase
    .from("blog_tags")
    .select("*")
    .order("name")
  if (error) throw error
  return (data ?? []) as BlogTag[]
}

// ============================================================
// Admin Blog: List all posts (including drafts)
// ============================================================

export async function fetchAdminPosts(params?: {
  page?: number
  pageSize?: number
  status?: BlogPostStatus | "all"
  search?: string
}): Promise<{ posts: BlogPost[]; total: number }> {
  const { page = 1, pageSize = 20, status = "all", search = "" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (status !== "all") {
    query = query.eq("status", status)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  query = query.range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  return { posts: (data ?? []) as BlogPost[], total: count ?? 0 }
}

// ============================================================
// Admin Blog: Get single post by ID (for editing)
// ============================================================

export async function fetchAdminPostById(id: string): Promise<BlogPostWithRelations | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      category:blog_categories(id, name, slug),
      author:profiles!author_id(id, full_name),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const post = data as Record<string, unknown>
  const tags = (post.tags as { tag: BlogTag }[] | null)?.map((t) => t.tag) ?? []
  return {
    ...(post as unknown as BlogPost),
    category: post.category as BlogCategory | null,
    author: post.author as { id: string; full_name: string | null } | null,
    tags,
  }
}

// ============================================================
// Admin Blog: Create post
// ============================================================

export async function createBlogPost(input: {
  title: string
  slug: string
  content: string
  excerpt?: string | null
  author_id: string
  category_id?: string | null
  status: BlogPostStatus
  featured_image?: string | null
  meta_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  og_image?: string | null
  reading_time_minutes?: number | null
  published_at?: string | null
}): Promise<BlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as BlogPost
}

// ============================================================
// Admin Blog: Update post
// ============================================================

export async function updateBlogPost(id: string, updates: Partial<{
  title: string
  slug: string
  content: string
  excerpt: string | null
  category_id: string | null
  status: BlogPostStatus
  featured_image: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  og_image: string | null
  reading_time_minutes: number | null
  published_at: string | null
}>): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

// ============================================================
// Admin Blog: Delete post
// ============================================================

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ============================================================
// Admin Blog: Sync post tags
// ============================================================

export async function syncPostTags(postId: string, tagIds: string[]): Promise<void> {
  await supabase.from("blog_post_tags").delete().eq("post_id", postId)
  if (tagIds.length === 0) return
  const rows = tagIds.map((tag_id) => ({ post_id: postId, tag_id }))
  const { error } = await supabase.from("blog_post_tags").insert(rows)
  if (error) throw error
}

// ============================================================
// Admin Blog: Create/Update/Delete categories
// ============================================================

export async function createBlogCategory(input: { name: string; slug: string; description?: string | null }): Promise<BlogCategory> {
  const { data, error } = await supabase
    .from("blog_categories")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as BlogCategory
}

export async function updateBlogCategory(id: string, updates: Partial<{ name: string; slug: string; description: string | null }>): Promise<void> {
  const { error } = await supabase.from("blog_categories").update(updates).eq("id", id)
  if (error) throw error
}

export async function deleteBlogCategory(id: string): Promise<void> {
  const { error } = await supabase.from("blog_categories").delete().eq("id", id)
  if (error) throw error
}

// ============================================================
// Admin Blog: Create/Delete tags
// ============================================================

export async function createBlogTag(input: { name: string; slug: string }): Promise<BlogTag> {
  const { data, error } = await supabase
    .from("blog_tags")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as BlogTag
}

export async function deleteBlogTag(id: string): Promise<void> {
  const { error } = await supabase.from("blog_tags").delete().eq("id", id)
  if (error) throw error
}

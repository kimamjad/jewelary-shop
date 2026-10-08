import { supabase } from "@/lib/supabase"
import type { Product, Category, Brand, AttributeWithGroup } from "@/types"

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "popular"

export interface SearchFilters {
  query?: string
  categorySlug?: string
  brandIds?: string[]
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  attributes?: Record<string, string[]>
  sort?: SortOption
  page?: number
  pageSize?: number
}

export interface SearchResult {
  products: Product[]
  total: number
  totalPages: number
}

export interface SearchSuggestion {
  type: "product" | "category" | "brand"
  label: string
  slug: string
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface FacetGroup {
  attributeId: string
  attributeName: string
  attributeSlug: string
  options: FacetOption[]
}

export interface FilterFacets {
  categories: { id: string; name: string; slug: string; count: number }[]
  brands: { id: string; name: string; slug: string; count: number }[]
  priceRange: { min: number; max: number }
  attributeFacets: FacetGroup[]
}

const SORT_MAP: Record<SortOption, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  price_asc: { column: "base_price", ascending: true },
  price_desc: { column: "base_price", ascending: false },
  name_asc: { column: "name", ascending: true },
  name_desc: { column: "name", ascending: false },
  popular: { column: "created_at", ascending: false },
}

export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const {
    query: searchQuery = "",
    categorySlug,
    brandIds = [],
    minPrice,
    maxPrice,
    inStockOnly = false,
    attributes = {},
    sort = "newest",
    page = 1,
    pageSize = 12,
  } = filters

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)

  if (searchQuery.trim()) {
    const sanitized = searchQuery.trim().replace(/[\\,:'"!]/g, " ").split(/\s+/).filter(Boolean).join(" & ")
    if (sanitized) {
      dbQuery = dbQuery.textSearch("search_vector", sanitized, { type: "websearch" })
    }
  }

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .is("deleted_at", null)
      .maybeSingle()
    if (cat) {
      dbQuery = dbQuery.eq("category_id", cat.id)
    }
  }

  if (brandIds.length > 0) {
    dbQuery = dbQuery.in("brand_id", brandIds)
  }

  if (minPrice !== undefined) {
    dbQuery = dbQuery.gte("base_price", minPrice)
  }
  if (maxPrice !== undefined) {
    dbQuery = dbQuery.lte("base_price", maxPrice)
  }

  if (inStockOnly) {
    dbQuery = dbQuery.gt("stock_quantity", 0)
  }

  const attrEntries = Object.entries(attributes).filter(([, values]) => values && values.length > 0)
  if (attrEntries.length > 0) {
    for (const [attrId, values] of attrEntries) {
      const { data: matchingProducts } = await supabase
        .from("product_attributes")
        .select("product_id")
        .eq("attribute_id", attrId)
        .in("value", values)
      if (matchingProducts && matchingProducts.length > 0) {
        const productIds = matchingProducts.map((p) => p.product_id)
        dbQuery = dbQuery.in("id", productIds)
      } else {
        dbQuery = dbQuery.eq("id", "00000000-0000-0000-0000-000000000000")
      }
    }
  }

  const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest
  dbQuery = dbQuery.order(sortConfig.column, { ascending: sortConfig.ascending })
  dbQuery = dbQuery.range(from, to)

  const { data, error, count } = await dbQuery
  if (error) throw error

  return {
    products: (data ?? []) as Product[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return []

  const suggestions: SearchSuggestion[] = []
  const trimmed = query.trim()

  const [prodResult, catResult, brandResult] = await Promise.all([
    supabase
      .from("products")
      .select("name, slug")
      .eq("status", "published")
      .is("deleted_at", null)
      .ilike("name", `%${trimmed}%`)
      .limit(5),
    supabase
      .from("categories")
      .select("name, slug")
      .is("deleted_at", null)
      .ilike("name", `%${trimmed}%`)
      .limit(3),
    supabase
      .from("brands")
      .select("name, slug")
      .ilike("name", `%${trimmed}%`)
      .limit(3),
  ])

  if (prodResult.data) {
    for (const p of prodResult.data) {
      suggestions.push({ type: "product", label: p.name, slug: p.slug })
    }
  }
  if (catResult.data) {
    for (const c of catResult.data) {
      suggestions.push({ type: "category", label: c.name, slug: c.slug })
    }
  }
  if (brandResult.data) {
    for (const b of brandResult.data) {
      suggestions.push({ type: "brand", label: b.name, slug: b.slug })
    }
  }

  return suggestions
}

export async function fetchFilterFacets(): Promise<FilterFacets> {
  const [categoriesResult, brandsResult, priceResult, filterableAttrsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("brands")
      .select("id, name, slug")
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("base_price")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("base_price", { ascending: true }),
    supabase
      .from("attributes")
      .select(`
        id, name, slug, type, options,
        group:attribute_groups(id, name, slug)
      `)
      .eq("is_filterable", true)
      .order("sort_order", { ascending: true }),
  ])

  const categories = (categoriesResult.data ?? []) as Pick<Category, "id" | "name" | "slug">[]
  const brands = (brandsResult.data ?? []) as Pick<Brand, "id" | "name" | "slug">[]
  const prices = (priceResult.data ?? []).map((p) => Number(p.base_price))
  const filterableAttrs = (filterableAttrsResult.data ?? []) as unknown as AttributeWithGroup[]

  const categoryCounts = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("status", "published")
        .is("deleted_at", null)
      return { ...cat, count: count ?? 0 }
    })
  )

  const brandCounts = await Promise.all(
    brands.map(async (brand) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.id)
        .eq("status", "published")
        .is("deleted_at", null)
      return { ...brand, count: count ?? 0 }
    })
  )

  const attributeFacets: FacetGroup[] = []
  for (const attr of filterableAttrs) {
    if (attr.type === "select" || attr.type === "color") {
      const options = (attr.options ?? []) as { value: string; label: string }[]
      if (options.length === 0) continue

      const optionCounts = await Promise.all(
        options.map(async (opt) => {
          const { count } = await supabase
            .from("product_attributes")
            .select("id", { count: "exact", head: true })
            .eq("attribute_id", attr.id)
            .eq("value", opt.value)
          return { value: opt.value, label: opt.label, count: count ?? 0 }
        })
      )

      attributeFacets.push({
        attributeId: attr.id,
        attributeName: attr.name,
        attributeSlug: attr.slug,
        options: optionCounts.filter((o) => o.count > 0),
      })
    }
  }

  return {
    categories: categoryCounts,
    brands: brandCounts,
    priceRange: {
      min: prices.length > 0 ? prices[0] : 0,
      max: prices.length > 0 ? prices[prices.length - 1] : 0,
    },
    attributeFacets,
  }
}

export async function fetchCategoriesForFilter(): Promise<Pick<Category, "id" | "name" | "slug">[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as Pick<Category, "id" | "name" | "slug">[]
}

export async function fetchBrandsForFilter(): Promise<Pick<Brand, "id" | "name" | "slug">[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug")
    .order("name", { ascending: true })

  if (error) throw error
  return (data ?? []) as Pick<Brand, "id" | "name" | "slug">[]
}

export async function fetchFilterableAttributes(): Promise<AttributeWithGroup[]> {
  const { data, error } = await supabase
    .from("attributes")
    .select(`
      *,
      group:attribute_groups(id, name, slug)
    `)
    .eq("is_filterable", true)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as AttributeWithGroup[]
}

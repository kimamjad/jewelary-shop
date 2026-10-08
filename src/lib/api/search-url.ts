import type { SearchFilters, SortOption } from "@/lib/api/search"

export interface ParsedURLFilters {
  query?: string
  categorySlug?: string
  brandIds?: string[]
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  attributes?: Record<string, string[]>
  sort?: SortOption
  page?: number
}

export function parseSearchParams(searchParams: URLSearchParams): ParsedURLFilters {
  const filters: ParsedURLFilters = {}

  const query = searchParams.get("q")
  if (query) filters.query = query

  const category = searchParams.get("category")
  if (category) filters.categorySlug = category

  const brands = searchParams.get("brands")
  if (brands) {
    filters.brandIds = brands.split(",").filter(Boolean)
  }

  const minPrice = searchParams.get("minPrice")
  if (minPrice) filters.minPrice = Number(minPrice)

  const maxPrice = searchParams.get("maxPrice")
  if (maxPrice) filters.maxPrice = Number(maxPrice)

  const inStock = searchParams.get("inStock")
  if (inStock === "1") filters.inStockOnly = true

  const sort = searchParams.get("sort") as SortOption | null
  if (sort) filters.sort = sort

  const page = searchParams.get("page")
  if (page) filters.page = Math.max(1, Number(page))

  const attributes: Record<string, string[]> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("attr_")) {
      const attrId = key.slice(5)
      if (attrId) {
        attributes[attrId] = value.split(",").filter(Boolean)
      }
    }
  }
  if (Object.keys(attributes).length > 0) {
    filters.attributes = attributes
  }

  return filters
}

export function buildSearchURL(filters: SearchFilters): string {
  const params = new URLSearchParams()

  if (filters.query) params.set("q", filters.query)
  if (filters.categorySlug) params.set("category", filters.categorySlug)
  if (filters.brandIds && filters.brandIds.length > 0) {
    params.set("brands", filters.brandIds.join(","))
  }
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice))
  if (filters.inStockOnly) params.set("inStock", "1")
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort)
  if (filters.page && filters.page > 1) params.set("page", String(filters.page))

  if (filters.attributes) {
    for (const [attrId, values] of Object.entries(filters.attributes)) {
      if (values && values.length > 0) {
        params.set(`attr_${attrId}`, values.join(","))
      }
    }
  }

  const str = params.toString()
  return str ? `?${str}` : ""
}

export function buildSearchURLFromParsed(filters: ParsedURLFilters): string {
  const params = new URLSearchParams()

  if (filters.query) params.set("q", filters.query)
  if (filters.categorySlug) params.set("category", filters.categorySlug)
  if (filters.brandIds && filters.brandIds.length > 0) {
    params.set("brands", filters.brandIds.join(","))
  }
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice))
  if (filters.inStockOnly) params.set("inStock", "1")
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort)
  if (filters.page && filters.page > 1) params.set("page", String(filters.page))

  if (filters.attributes) {
    for (const [attrId, values] of Object.entries(filters.attributes)) {
      if (values && values.length > 0) {
        params.set(`attr_${attrId}`, values.join(","))
      }
    }
  }

  const str = params.toString()
  return str ? `?${str}` : ""
}

export function hasActiveFilters(filters: ParsedURLFilters | SearchFilters): boolean {
  return Boolean(
    filters.query ||
    filters.categorySlug ||
    (filters.brandIds && filters.brandIds.length > 0) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStockOnly ||
    (filters.attributes && Object.keys(filters.attributes).length > 0)
  )
}

export function clearAllFilters(): ParsedURLFilters {
  return { sort: "newest", page: 1 }
}

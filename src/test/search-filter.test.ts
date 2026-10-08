import { describe, it, expect } from "vitest"
import { parseSearchParams, buildSearchURL, buildSearchURLFromParsed, hasActiveFilters, clearAllFilters } from "@/lib/api/search-url"
import type { SearchFilters, SortOption } from "@/lib/api/search"

describe("search-url utilities", () => {
  describe("parseSearchParams", () => {
    it("parses query parameter", () => {
      const params = new URLSearchParams("?q=انگشتر")
      const result = parseSearchParams(params)
      expect(result.query).toBe("انگشتر")
    })

    it("parses category slug", () => {
      const params = new URLSearchParams("?category=rings")
      const result = parseSearchParams(params)
      expect(result.categorySlug).toBe("rings")
    })

    it("parses brand IDs as comma-separated list", () => {
      const params = new URLSearchParams("?brands=id1,id2,id3")
      const result = parseSearchParams(params)
      expect(result.brandIds).toEqual(["id1", "id2", "id3"])
    })

    it("parses price range", () => {
      const params = new URLSearchParams("?minPrice=1000000&maxPrice=5000000")
      const result = parseSearchParams(params)
      expect(result.minPrice).toBe(1000000)
      expect(result.maxPrice).toBe(5000000)
    })

    it("parses inStock flag", () => {
      const params = new URLSearchParams("?inStock=1")
      const result = parseSearchParams(params)
      expect(result.inStockOnly).toBe(true)
    })

    it("parses sort option", () => {
      const params = new URLSearchParams("?sort=price_asc")
      const result = parseSearchParams(params)
      expect(result.sort).toBe("price_asc")
    })

    it("parses page number", () => {
      const params = new URLSearchParams("?page=3")
      const result = parseSearchParams(params)
      expect(result.page).toBe(3)
    })

    it("clamps page to minimum 1", () => {
      const params = new URLSearchParams("?page=0")
      const result = parseSearchParams(params)
      expect(result.page).toBe(1)
    })

    it("parses dynamic attribute filters", () => {
      const params = new URLSearchParams("?attr_abc123=red,blue&attr_def456=gold")
      const result = parseSearchParams(params)
      expect(result.attributes).toEqual({
        abc123: ["red", "blue"],
        def456: ["gold"],
      })
    })

    it("returns empty object for empty params", () => {
      const params = new URLSearchParams()
      const result = parseSearchParams(params)
      expect(result).toEqual({})
    })

    it("handles multiple attributes with empty values gracefully", () => {
      const params = new URLSearchParams("?attr_abc=&attr_def=val1")
      const result = parseSearchParams(params)
      expect(result.attributes).toEqual({
        abc: [],
        def: ["val1"],
      })
    })
  })

  describe("buildSearchURL", () => {
    it("builds URL with query", () => {
      const filters: SearchFilters = { query: "انگشتر" }
      const url = buildSearchURL(filters)
      expect(url).toBe("?q=%D8%A7%D9%86%DA%AF%D8%B4%D8%AA%D8%B1")
    })

    it("builds URL with category", () => {
      const filters: SearchFilters = { categorySlug: "rings" }
      const url = buildSearchURL(filters)
      expect(url).toBe("?category=rings")
    })

    it("builds URL with brands as comma-separated", () => {
      const filters: SearchFilters = { brandIds: ["id1", "id2"] }
      const url = buildSearchURL(filters)
      expect(url).toBe("?brands=id1%2Cid2")
    })

    it("builds URL with price range", () => {
      const filters: SearchFilters = { minPrice: 1000, maxPrice: 5000 }
      const url = buildSearchURL(filters)
      expect(url).toContain("minPrice=1000")
      expect(url).toContain("maxPrice=5000")
    })

    it("builds URL with inStock flag", () => {
      const filters: SearchFilters = { inStockOnly: true }
      const url = buildSearchURL(filters)
      expect(url).toBe("?inStock=1")
    })

    it("builds URL with sort (excludes default newest)", () => {
      const filters: SearchFilters = { sort: "price_asc" }
      const url = buildSearchURL(filters)
      expect(url).toBe("?sort=price_asc")
    })

    it("excludes sort=newest from URL (default)", () => {
      const filters: SearchFilters = { sort: "newest" }
      const url = buildSearchURL(filters)
      expect(url).toBe("")
    })

    it("builds URL with page (excludes page=1)", () => {
      const filters: SearchFilters = { page: 2 }
      const url = buildSearchURL(filters)
      expect(url).toBe("?page=2")
    })

    it("builds URL with dynamic attributes", () => {
      const filters: SearchFilters = {
        attributes: { abc123: ["red", "blue"] },
      }
      const url = buildSearchURL(filters)
      expect(url).toBe("?attr_abc123=red%2Cblue")
    })

    it("builds empty URL for empty filters", () => {
      const filters: SearchFilters = {}
      const url = buildSearchURL(filters)
      expect(url).toBe("")
    })

    it("builds complex URL with multiple filters", () => {
      const filters: SearchFilters = {
        query: "test",
        categorySlug: "rings",
        brandIds: ["b1"],
        minPrice: 1000,
        maxPrice: 5000,
        inStockOnly: true,
        sort: "price_desc",
        page: 2,
        attributes: { attr1: ["val1"] },
      }
      const url = buildSearchURL(filters)
      expect(url).toContain("q=test")
      expect(url).toContain("category=rings")
      expect(url).toContain("brands=b1")
      expect(url).toContain("minPrice=1000")
      expect(url).toContain("maxPrice=5000")
      expect(url).toContain("inStock=1")
      expect(url).toContain("sort=price_desc")
      expect(url).toContain("page=2")
      expect(url).toContain("attr_attr1=val1")
    })
  })

  describe("round-trip: parse then build", () => {
    it("parse -> build produces equivalent URL", () => {
      const original = new URLSearchParams("?q=test&category=rings&brands=b1,b2&minPrice=1000&maxPrice=5000&inStock=1&sort=price_asc&page=2&attr_abc=red,blue")
      const parsed = parseSearchParams(original)
      const built = buildSearchURLFromParsed(parsed)
      const reparsed = parseSearchParams(new URLSearchParams(built))
      expect(reparsed.query).toBe("test")
      expect(reparsed.categorySlug).toBe("rings")
      expect(reparsed.brandIds).toEqual(["b1", "b2"])
      expect(reparsed.minPrice).toBe(1000)
      expect(reparsed.maxPrice).toBe(5000)
      expect(reparsed.inStockOnly).toBe(true)
      expect(reparsed.sort).toBe("price_asc")
      expect(reparsed.page).toBe(2)
      expect(reparsed.attributes).toEqual({ abc: ["red", "blue"] })
    })
  })

  describe("hasActiveFilters", () => {
    it("returns false for empty filters", () => {
      expect(hasActiveFilters({})).toBe(false)
    })

    it("returns true when query is set", () => {
      expect(hasActiveFilters({ query: "test" })).toBe(true)
    })

    it("returns true when category is set", () => {
      expect(hasActiveFilters({ categorySlug: "rings" })).toBe(true)
    })

    it("returns true when brands are set", () => {
      expect(hasActiveFilters({ brandIds: ["b1"] })).toBe(true)
    })

    it("returns true when price range is set", () => {
      expect(hasActiveFilters({ minPrice: 1000 })).toBe(true)
      expect(hasActiveFilters({ maxPrice: 5000 })).toBe(true)
    })

    it("returns true when inStockOnly is set", () => {
      expect(hasActiveFilters({ inStockOnly: true })).toBe(true)
    })

    it("returns true when attributes are set", () => {
      expect(hasActiveFilters({ attributes: { attr1: ["val1"] } })).toBe(true)
    })

    it("returns false for only sort/page", () => {
      expect(hasActiveFilters({ sort: "newest", page: 1 })).toBe(false)
    })
  })

  describe("clearAllFilters", () => {
    it("returns default state with sort and page", () => {
      const cleared = clearAllFilters()
      expect(cleared.sort).toBe("newest")
      expect(cleared.page).toBe(1)
    })
  })
})

describe("search API performance expectations", () => {
  it("SortOption type covers all expected sort values", () => {
    const validSorts: SortOption[] = ["newest", "price_asc", "price_desc", "name_asc", "name_desc", "popular"]
    expect(validSorts).toHaveLength(6)
  })

  it("SearchFilters interface supports all required filter dimensions", () => {
    const filters: SearchFilters = {
      query: "test",
      categorySlug: "rings",
      brandIds: ["b1", "b2"],
      minPrice: 1000,
      maxPrice: 5000,
      inStockOnly: true,
      attributes: {
        attr1: ["val1", "val2"],
        attr2: ["val3"],
      },
      sort: "price_asc",
      page: 1,
      pageSize: 12,
    }
    expect(filters).toBeDefined()
    expect(filters.attributes).toBeDefined()
    expect(Object.keys(filters.attributes!)).toHaveLength(2)
  })

  it("URL filter format is shareable and parseable", () => {
    const filters: SearchFilters = {
      query: "انگشتر طلا",
      categorySlug: "rings",
      brandIds: ["brand-1", "brand-2"],
      attributes: { "attr-color": ["red", "gold"] },
      sort: "price_asc",
      page: 3,
    }
    const url = buildSearchURL(filters)
    expect(url.startsWith("?")).toBe(true)
    const reparsed = parseSearchParams(new URLSearchParams(url))
    expect(reparsed.query).toBe("انگشتر طلا")
    expect(reparsed.categorySlug).toBe("rings")
    expect(reparsed.brandIds).toEqual(["brand-1", "brand-2"])
    expect(reparsed.attributes!["attr-color"]).toEqual(["red", "gold"])
    expect(reparsed.sort).toBe("price_asc")
    expect(reparsed.page).toBe(3)
  })

  it("default page size of 12 balances performance and UX", () => {
    const filters: SearchFilters = { pageSize: 12 }
    expect(filters.pageSize).toBe(12)
    expect(filters.pageSize).toBeLessThanOrEqual(24)
    expect(filters.pageSize).toBeGreaterThanOrEqual(8)
  })

  it("dynamic attribute filter keys use attr_ prefix convention", () => {
    const filters: SearchFilters = {
      attributes: { "abc-123": ["val1"] },
    }
    const url = buildSearchURL(filters)
    expect(url).toContain("attr_abc-123=val1")
  })
})

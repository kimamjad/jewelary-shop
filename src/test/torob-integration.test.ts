import { describe, it, expect } from "vitest"
import {
  mapProductToTorob,
  validateTorobRequest,
} from "@/lib/integrations/torob/mapper"
import type {
  ProductRow,
  ProductImageRow,
  CategoryRow,
  ProductAttributeRow,
} from "@/lib/integrations/torob/types"

const baseProduct: ProductRow = {
  id: "abc-123",
  name: "انگشتر طلا آمریکایی",
  slug: "gold-ring-american",
  sku: "GR-001",
  base_price: 5000000,
  sale_price: 4500000,
  compare_at_price: 6000000,
  stock_quantity: 10,
  status: "published",
  visibility: "public",
  short_description: "انگشتر طلا ۱۸ عیار",
  description: "توضیحات کامل",
  category_id: "cat-1",
  brand_id: "brand-1",
  created_at: "2026-01-01T10:00:00+03:30",
  updated_at: "2026-01-02T12:00:00+03:30",
  deleted_at: null,
}

const baseImages: ProductImageRow[] = [
  { url: "https://example.com/img2.jpg", alt_text: null, sort_order: 1, is_primary: false },
  { url: "https://example.com/img1.jpg", alt_text: null, sort_order: 0, is_primary: true },
]

const baseCategory: CategoryRow = { id: "cat-1", name: "انگشتر", slug: "rings" }

const baseAttrs: ProductAttributeRow[] = [
  { value: "طلایی", attribute: { name: "رنگ", slug: "color" } },
  { value: "۱۸ عیار", attribute: { name: "عیار", slug: "karat" } },
]

const SITE_URL = "https://jewelrystore.ir"

describe("mapProductToTorob", () => {
  it("maps a product to Torob API v3 format", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)

    expect(result.page_unique).toBe("abc-123")
    expect(result.page_url).toBe("https://jewelrystore.ir/product/gold-ring-american")
    expect(result.title).toBe("انگشتر طلا آمریکایی")
    expect(result.current_price).toBe(4500000)
    expect(result.old_price).toBe(6000000)
    expect(result.availability).toBe(true)
    expect(result.category_name).toBe("انگشتر")
    expect(result.short_desc).toBe("انگشتر طلا ۱۸ عیار")
    expect(result.date_added).toBe("2026-01-01T10:00:00+03:30")
    expect(result.date_updated).toBe("2026-01-02T12:00:00+03:30")
  })

  it("sorts images with primary first", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.image_links[0]).toBe("https://example.com/img1.jpg")
    expect(result.image_links[1]).toBe("https://example.com/img2.jpg")
  })

  it("maps attributes to spec key-value pairs", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.spec).toEqual({
      "رنگ": "طلایی",
      "عیار": "۱۸ عیار",
    })
  })

  it("returns empty spec when no attributes exist", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, [], SITE_URL)
    expect(result.spec).toEqual({})
  })

  it("sets availability to false when stock is zero", () => {
    const product = { ...baseProduct, stock_quantity: 0 }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.availability).toBe(false)
  })

  it("sets availability to false when status is not published", () => {
    const product = { ...baseProduct, status: "draft" }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.availability).toBe(false)
  })

  it("uses base_price when sale_price is null", () => {
    const product = { ...baseProduct, sale_price: null }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.current_price).toBe(5000000)
  })

  it("omits old_price when compare_at_price is not higher than display price", () => {
    const product = { ...baseProduct, compare_at_price: 3000000 }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.old_price).toBeUndefined()
  })

  it("omits date_updated when it equals created_at", () => {
    const product = { ...baseProduct, updated_at: baseProduct.created_at }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.date_updated).toBeUndefined()
  })

  it("rounds prices to integers", () => {
    const product = { ...baseProduct, sale_price: 4500000.7, base_price: 5000000.3 }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.current_price).toBe(4500001)
  })

  it("handles null category", () => {
    const result = mapProductToTorob(baseProduct, baseImages, null, baseAttrs, SITE_URL)
    expect(result.category_name).toBeUndefined()
  })

  it("handles null short_description", () => {
    const product = { ...baseProduct, short_description: null }
    const result = mapProductToTorob(product, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.short_desc).toBeUndefined()
  })

  it("filters out empty image URLs", () => {
    const images: ProductImageRow[] = [
      { url: "", alt_text: null, sort_order: 0, is_primary: true },
      { url: "https://example.com/img1.jpg", alt_text: null, sort_order: 1, is_primary: false },
    ]
    const result = mapProductToTorob(baseProduct, images, baseCategory, baseAttrs, SITE_URL)
    expect(result.image_links).toEqual(["https://example.com/img1.jpg"])
  })
})

describe("validateTorobRequest", () => {
  it("validates page-based request with sort", () => {
    const result = validateTorobRequest({ page: 1, sort: "date_added_desc" })
    expect(result.valid).toBe(true)
    expect(result.request?.page).toBe(1)
    expect(result.request?.sort).toBe("date_added_desc")
  })

  it("validates page-based request with date_updated_desc sort", () => {
    const result = validateTorobRequest({ page: 2, sort: "date_updated_desc" })
    expect(result.valid).toBe(true)
    expect(result.request?.page).toBe(2)
  })

  it("validates cursor-based request with product_id_desc sort", () => {
    const result = validateTorobRequest({ cursor: "abc123", sort: "product_id_desc" })
    expect(result.valid).toBe(true)
    expect(result.request?.cursor).toBe("abc123")
  })

  it("rejects cursor request without product_id_desc sort", () => {
    const result = validateTorobRequest({ cursor: "abc123", sort: "date_added_desc" })
    expect(result.valid).toBe(false)
  })

  it("validates page_urls request", () => {
    const result = validateTorobRequest({ page_urls: ["https://example.com/product/1"] })
    expect(result.valid).toBe(true)
    expect(result.request?.page_urls).toEqual(["https://example.com/product/1"])
  })

  it("validates page_uniques request", () => {
    const result = validateTorobRequest({ page_uniques: ["abc-123", "def-456"] })
    expect(result.valid).toBe(true)
    expect(result.request?.page_uniques).toEqual(["abc-123", "def-456"])
  })

  it("rejects page request without sort", () => {
    const result = validateTorobRequest({ page: 1 })
    expect(result.valid).toBe(false)
    expect(result.error).toBe("sort parameter is not provided")
  })

  it("rejects page request with invalid sort", () => {
    const result = validateTorobRequest({ page: 1, sort: "invalid_sort" })
    expect(result.valid).toBe(false)
  })

  it("rejects empty body", () => {
    const result = validateTorobRequest(null)
    expect(result.valid).toBe(false)
  })

  it("rejects non-object body", () => {
    const result = validateTorobRequest("string")
    expect(result.valid).toBe(false)
  })

  it("rejects body with no recognized fields", () => {
    const result = validateTorobRequest({ foo: "bar" })
    expect(result.valid).toBe(false)
    expect(result.error).toContain("page, cursor, page_urls, or page_uniques")
  })

  it("prioritizes page_urls over page when both present", () => {
    const result = validateTorobRequest({ page_urls: ["url1"], page: 1, sort: "date_added_desc" })
    expect(result.valid).toBe(true)
    expect(result.request?.page_urls).toBeDefined()
    expect(result.request?.page).toBeUndefined()
  })
})

describe("Torob API v3 compliance", () => {
  it("page_unique is the product ID (stable identifier)", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.page_unique).toBe(baseProduct.id)
  })

  it("page_url is an absolute URL", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(result.page_url).toMatch(/^https:\/\//)
    expect(result.page_url).toContain("/product/")
  })

  it("current_price is always an integer (Toman)", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, baseAttrs, SITE_URL)
    expect(Number.isInteger(result.current_price)).toBe(true)
  })

  it("spec is always an object (never null)", () => {
    const result = mapProductToTorob(baseProduct, baseImages, baseCategory, [], SITE_URL)
    expect(result.spec).toEqual({})
    expect(typeof result.spec).toBe("object")
  })

  it("first image is the main/primary image", () => {
    const images: ProductImageRow[] = [
      { url: "https://example.com/secondary.jpg", alt_text: null, sort_order: 0, is_primary: false },
      { url: "https://example.com/main.jpg", alt_text: null, sort_order: 1, is_primary: true },
      { url: "https://example.com/other.jpg", alt_text: null, sort_order: 2, is_primary: false },
    ]
    const result = mapProductToTorob(baseProduct, images, baseCategory, baseAttrs, SITE_URL)
    expect(result.image_links[0]).toBe("https://example.com/main.jpg")
  })
})

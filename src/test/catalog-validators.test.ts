import { describe, it, expect } from "vitest"
import { productSchema, categorySchema, attributeGroupSchema, attributeSchema } from "@/lib/validators/product"

describe("productSchema", () => {
  it("validates a valid product", () => {
    const result = productSchema.safeParse({
      name: "انگشتر طلا ۱۸ عیار",
      slug: "gold-ring-18k",
      description: "توضیحات محصول",
      short_description: "انگشتر طلایی",
      base_price: 5000000,
      sku: "RNG-001",
      stock_quantity: 10,
      status: "published",
      visibility: "public",
      is_featured: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects name shorter than 2 characters", () => {
    const result = productSchema.safeParse({
      name: "ا",
      slug: "test",
      base_price: 1000,
      sku: "SKU-1",
      stock_quantity: 1,
      status: "draft",
      visibility: "public",
      is_featured: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("۲ کاراکتر")
    }
  })

  it("rejects invalid slug format", () => {
    const result = productSchema.safeParse({
      name: "test",
      slug: "Test Slug!",
      base_price: 1000,
      sku: "SKU-1",
      stock_quantity: 1,
      status: "draft",
      visibility: "public",
      is_featured: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("اسلاگ")
    }
  })

  it("rejects non-positive base_price", () => {
    const result = productSchema.safeParse({
      name: "test",
      slug: "test",
      base_price: -100,
      sku: "SKU-1",
      stock_quantity: 1,
      status: "draft",
      visibility: "public",
      is_featured: false,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative stock_quantity", () => {
    const result = productSchema.safeParse({
      name: "test",
      slug: "test",
      base_price: 1000,
      sku: "SKU-1",
      stock_quantity: -5,
      status: "draft",
      visibility: "public",
      is_featured: false,
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty SKU", () => {
    const result = productSchema.safeParse({
      name: "test",
      slug: "test",
      base_price: 1000,
      sku: "",
      stock_quantity: 1,
      status: "draft",
      visibility: "public",
      is_featured: false,
    })
    expect(result.success).toBe(false)
  })

  it("accepts nullable optional fields", () => {
    const result = productSchema.safeParse({
      name: "test",
      slug: "test",
      brand_id: null,
      category_id: null,
      base_price: 1000,
      sale_price: null,
      compare_at_price: null,
      cost_price: null,
      sku: "SKU-1",
      stock_quantity: 0,
      status: "draft",
      visibility: "public",
      is_featured: false,
      weight_grams: null,
      meta_title: null,
      meta_description: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("categorySchema", () => {
  it("validates a valid category", () => {
    const result = categorySchema.safeParse({
      name: "انگشتر",
      slug: "rings",
      is_active: true,
      sort_order: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects name shorter than 2 characters", () => {
    const result = categorySchema.safeParse({
      name: "ا",
      slug: "test",
      is_active: true,
      sort_order: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid slug", () => {
    const result = categorySchema.safeParse({
      name: "test",
      slug: "Test Slug",
      is_active: true,
      sort_order: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative sort_order", () => {
    const result = categorySchema.safeParse({
      name: "test",
      slug: "test",
      is_active: true,
      sort_order: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("attributeGroupSchema", () => {
  it("validates a valid attribute group", () => {
    const result = attributeGroupSchema.safeParse({
      name: "مشخصات انگشتر",
      slug: "ring-specs",
      sort_order: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid slug", () => {
    const result = attributeGroupSchema.safeParse({
      name: "test",
      slug: "Test Slug!",
      sort_order: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe("attributeSchema", () => {
  it("validates a valid attribute", () => {
    const result = attributeSchema.safeParse({
      group_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "جنس",
      slug: "material",
      type: "select",
      unit: null,
      is_filterable: true,
      is_required: true,
      options: [{ value: "gold", label: "طلا" }],
      sort_order: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing group_id", () => {
    const result = attributeSchema.safeParse({
      name: "test",
      slug: "test",
      type: "text",
      is_filterable: false,
      is_required: false,
      sort_order: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid type", () => {
    const result = attributeSchema.safeParse({
      group_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "test",
      slug: "test",
      type: "invalid_type",
      is_filterable: false,
      is_required: false,
      sort_order: 0,
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid type values", () => {
    const validTypes = ["text", "number", "select", "boolean", "color"]
    for (const type of validTypes) {
      const result = attributeSchema.safeParse({
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "test",
        slug: `test-${type}`,
        type,
        is_filterable: false,
        is_required: false,
        sort_order: 0,
      })
      expect(result.success).toBe(true)
    }
  })
})

import { describe, it, expect } from "vitest"
import { checkoutSchema, shippingCosts, shippingLabels, paymentLabels } from "@/lib/validators/checkout"

describe("checkoutSchema", () => {
  const validData = {
    full_name: "علی محمدی",
    phone: "09123456789",
    email: "",
    province: "تهران",
    city: "تهران",
    address: "خیابان ولیعصر، پلاک ۱۲۳، واحد ۴",
    postal_code: "1234567890",
    shipping_method: "post" as const,
    payment_method: "zarinpal" as const,
    notes: "",
    accept_terms: true,
  }

  it("validates a valid checkout form", () => {
    const result = checkoutSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("rejects name shorter than 2 characters", () => {
    const result = checkoutSchema.safeParse({ ...validData, full_name: "ا" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid phone format", () => {
    expect(checkoutSchema.safeParse({ ...validData, phone: "123456" }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...validData, phone: "09123" }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...validData, phone: "0912345678" }).success).toBe(false)
  })

  it("accepts valid phone format", () => {
    expect(checkoutSchema.safeParse({ ...validData, phone: "09123456789" }).success).toBe(true)
    expect(checkoutSchema.safeParse({ ...validData, phone: "09001234567" }).success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = checkoutSchema.safeParse({ ...validData, email: "invalid-email" })
    expect(result.success).toBe(false)
  })

  it("accepts empty email (optional)", () => {
    const result = checkoutSchema.safeParse({ ...validData, email: "" })
    expect(result.success).toBe(true)
  })

  it("accepts valid email", () => {
    const result = checkoutSchema.safeParse({ ...validData, email: "test@example.com" })
    expect(result.success).toBe(true)
  })

  it("rejects address shorter than 10 characters", () => {
    const result = checkoutSchema.safeParse({ ...validData, address: "کوتاه" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid postal code", () => {
    expect(checkoutSchema.safeParse({ ...validData, postal_code: "123" }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...validData, postal_code: "123456789" }).success).toBe(false)
  })

  it("accepts valid 10-digit postal code", () => {
    expect(checkoutSchema.safeParse({ ...validData, postal_code: "1234567890" }).success).toBe(true)
  })

  it("rejects empty province", () => {
    const result = checkoutSchema.safeParse({ ...validData, province: "" })
    expect(result.success).toBe(false)
  })

  it("rejects empty city", () => {
    const result = checkoutSchema.safeParse({ ...validData, city: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid shipping method", () => {
    const result = checkoutSchema.safeParse({ ...validData, shipping_method: "invalid" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid payment method", () => {
    const result = checkoutSchema.safeParse({ ...validData, payment_method: "invalid" })
    expect(result.success).toBe(false)
  })

  it("rejects when terms not accepted", () => {
    const result = checkoutSchema.safeParse({ ...validData, accept_terms: false })
    expect(result.success).toBe(false)
  })

  it("accepts all valid shipping methods", () => {
    for (const method of ["post", "tipax", "pickup"]) {
      expect(checkoutSchema.safeParse({ ...validData, shipping_method: method }).success).toBe(true)
    }
  })

  it("accepts all valid payment methods", () => {
    for (const method of ["zarinpal", "cod"]) {
      expect(checkoutSchema.safeParse({ ...validData, payment_method: method }).success).toBe(true)
    }
  })
})

describe("shippingCosts", () => {
  it("has cost for post method", () => {
    expect(shippingCosts.post).toBe(50000)
  })

  it("has cost for tipax method", () => {
    expect(shippingCosts.tipax).toBe(30000)
  })

  it("has zero cost for pickup method", () => {
    expect(shippingCosts.pickup).toBe(0)
  })
})

describe("shippingLabels", () => {
  it("has Persian label for each method", () => {
    expect(shippingLabels.post).toBeTruthy()
    expect(shippingLabels.tipax).toBeTruthy()
    expect(shippingLabels.pickup).toBeTruthy()
  })
})

describe("paymentLabels", () => {
  it("has Persian label for each method", () => {
    expect(paymentLabels.zarinpal).toBeTruthy()
    expect(paymentLabels.cod).toBeTruthy()
  })
})

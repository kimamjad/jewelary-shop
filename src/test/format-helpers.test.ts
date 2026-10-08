import { describe, it, expect } from "vitest"
import { formatPrice, toPersianDigits, formatNumber, formatDate, calculateDiscountPercentage } from "@/lib/format"

describe("toPersianDigits", () => {
  it("converts string digits to Persian", () => {
    expect(toPersianDigits("12345")).toBe("۱۲۳۴۵")
  })

  it("converts number to Persian digits", () => {
    expect(toPersianDigits(0)).toBe("۰")
    expect(toPersianDigits(999)).toBe("۹۹۹")
  })

  it("leaves non-digit characters unchanged", () => {
    expect(toPersianDigits("abc123")).toBe("abc۱۲۳")
  })

  it("handles empty string", () => {
    expect(toPersianDigits("")).toBe("")
  })
})

describe("formatPrice", () => {
  it("formats price with Persian digits and currency", () => {
    const result = formatPrice(1500000)
    expect(result).toContain("تومان")
    expect(result).toContain("۱")
  })

  it("formats zero price", () => {
    const result = formatPrice(0)
    expect(result).toContain("تومان")
  })

  it("formats large numbers with thousands separators", () => {
    const result = formatPrice(100000000)
    expect(result).toContain("تومان")
  })
})

describe("formatNumber", () => {
  it("formats number with Persian digits", () => {
    const result = formatNumber(1234567)
    expect(result).toContain("۱")
  })
})

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2024-01-15T00:00:00Z")
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it("formats Date object", () => {
    const result = formatDate(new Date("2024-06-01"))
    expect(result).toBeTruthy()
  })
})

describe("calculateDiscountPercentage", () => {
  it("calculates correct discount percentage", () => {
    expect(calculateDiscountPercentage(100, 75)).toBe(25)
  })

  it("returns 0 when original is 0", () => {
    expect(calculateDiscountPercentage(0, 0)).toBe(0)
  })

  it("returns 0 when original is negative", () => {
    expect(calculateDiscountPercentage(-100, 50)).toBe(0)
  })

  it("calculates 50% discount", () => {
    expect(calculateDiscountPercentage(200, 100)).toBe(50)
  })

  it("rounds to nearest integer", () => {
    expect(calculateDiscountPercentage(300, 100)).toBe(67)
  })

  it("handles no discount", () => {
    expect(calculateDiscountPercentage(100, 100)).toBe(0)
  })
})

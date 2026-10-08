import { describe, it, expect } from "vitest"
import { formatPrice, toPersianDigits, calculateDiscountPercentage } from "@/lib/format"

describe("format utils", () => {
  it("converts digits to Persian", () => {
    expect(toPersianDigits("12345")).toBe("۱۲۳۴۵")
    expect(toPersianDigits(0)).toBe("۰")
  })

  it("formats price with currency", () => {
    const result = formatPrice(1500000)
    expect(result).toContain("تومان")
    expect(result).toContain("۱")
  })

  it("calculates discount percentage", () => {
    expect(calculateDiscountPercentage(100, 75)).toBe(25)
    expect(calculateDiscountPercentage(0, 0)).toBe(0)
  })
})

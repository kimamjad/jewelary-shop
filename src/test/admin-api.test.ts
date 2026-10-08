import { describe, it, expect } from "vitest"
import { getDateRange, type DateRangePreset } from "@/lib/api/admin"
import { exportToCSV } from "@/lib/api/admin"

describe("getDateRange", () => {
  it("returns today for 'today' preset", () => {
    const { start, end } = getDateRange("today")
    expect(start).toBe(end)
    const today = new Date().toISOString().split("T")[0]
    expect(start).toBe(today)
  })

  it("returns a 7-day range for 'last_7_days' preset", () => {
    const { start, end } = getDateRange("last_7_days")
    const startD = new Date(start)
    const endD = new Date(end)
    const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(6)
  })

  it("returns a 30-day range for 'last_30_days' preset", () => {
    const { start, end } = getDateRange("last_30_days")
    const startD = new Date(start)
    const endD = new Date(end)
    const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(29)
  })

  it("returns this year start for 'this_year' preset", () => {
    const { start } = getDateRange("this_year")
    const startD = new Date(start)
    expect(startD.getMonth()).toBe(0)
    expect(startD.getDate()).toBe(1)
  })

  it("returns custom dates when provided", () => {
    const { start, end } = getDateRange("custom", "2026-01-15", "2026-02-15")
    expect(start).toBe("2026-01-15")
    expect(end).toBe("2026-02-15")
  })

  it("covers all presets without throwing", () => {
    const presets: DateRangePreset[] = [
      "today", "yesterday", "last_7_days", "last_30_days",
      "this_month", "last_month", "this_year", "custom",
    ]
    presets.forEach((p) => {
      const result = getDateRange(p)
      expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

describe("exportToCSV", () => {
  it("does not throw when called with valid data", () => {
    expect(() => {
      exportToCSV("test.csv", ["نام", "مبلغ"], [["علی", 1000], ["رضا", 2000]])
    }).not.toThrow()
  })
})

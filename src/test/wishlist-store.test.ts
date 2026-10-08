import { describe, it, expect, beforeEach } from "vitest"
import { useWishlistStore } from "@/store/wishlist-store"

describe("wishlist-store", () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: [] })
  })

  it("starts empty", () => {
    expect(useWishlistStore.getState().productIds).toEqual([])
  })

  it("adds a product to wishlist", () => {
    useWishlistStore.getState().toggle("p1")
    expect(useWishlistStore.getState().productIds).toEqual(["p1"])
    expect(useWishlistStore.getState().has("p1")).toBe(true)
  })

  it("removes a product when toggled again", () => {
    useWishlistStore.getState().toggle("p1")
    useWishlistStore.getState().toggle("p1")
    expect(useWishlistStore.getState().productIds).toEqual([])
    expect(useWishlistStore.getState().has("p1")).toBe(false)
  })

  it("adds multiple products", () => {
    useWishlistStore.getState().toggle("p1")
    useWishlistStore.getState().toggle("p2")
    useWishlistStore.getState().toggle("p3")
    expect(useWishlistStore.getState().productIds).toHaveLength(3)
  })

  it("removes a specific product", () => {
    useWishlistStore.getState().toggle("p1")
    useWishlistStore.getState().toggle("p2")
    useWishlistStore.getState().remove("p1")
    expect(useWishlistStore.getState().productIds).toEqual(["p2"])
  })

  it("clears all", () => {
    useWishlistStore.getState().toggle("p1")
    useWishlistStore.getState().toggle("p2")
    useWishlistStore.getState().clear()
    expect(useWishlistStore.getState().productIds).toEqual([])
  })

  it("has() returns false for non-existent product", () => {
    expect(useWishlistStore.getState().has("nonexistent")).toBe(false)
  })
})

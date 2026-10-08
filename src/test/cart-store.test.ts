import { describe, it, expect, beforeEach } from "vitest"
import { useCartStore } from "@/store/cart-store"
import type { CartItem } from "@/store/cart-store"

const mockItem: CartItem = {
  productId: "p1",
  name: "انگشتر طلا",
  slug: "gold-ring",
  price: 5000000,
  image: "https://example.com/img.jpg",
  quantity: 1,
  variantId: null,
}

const mockItem2: CartItem = {
  productId: "p2",
  name: "سنگ یاقوت",
  slug: "ruby-stone",
  price: 3000000,
  image: null,
  quantity: 2,
  variantId: null,
}

describe("cart-store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it("starts with an empty cart", () => {
    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().getTotalItems()).toBe(0)
    expect(useCartStore.getState().getTotalPrice()).toBe(0)
  })

  it("adds a new item to cart", () => {
    useCartStore.getState().addItem(mockItem)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe("p1")
    expect(state.getTotalItems()).toBe(1)
    expect(state.getTotalPrice()).toBe(5000000)
  })

  it("increments quantity when adding existing item", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)
    expect(state.getTotalItems()).toBe(2)
    expect(state.getTotalPrice()).toBe(10000000)
  })

  it("adds multiple different items", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem2)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(2)
    expect(state.getTotalItems()).toBe(3)
    expect(state.getTotalPrice()).toBe(11000000)
  })

  it("removes an item from cart", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem2)
    useCartStore.getState().removeItem("p1", null)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe("p2")
    expect(state.getTotalItems()).toBe(2)
  })

  it("updates item quantity", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().updateQuantity("p1", null, 5)
    const state = useCartStore.getState()
    expect(state.items[0].quantity).toBe(5)
    expect(state.getTotalItems()).toBe(5)
    expect(state.getTotalPrice()).toBe(25000000)
  })

  it("does not allow quantity below 0", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().updateQuantity("p1", null, -3)
    expect(useCartStore.getState().items[0].quantity).toBe(0)
  })

  it("clears all items", () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem2)
    useCartStore.getState().clearCart()
    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.getTotalItems()).toBe(0)
    expect(state.getTotalPrice()).toBe(0)
  })

  it("handles items with variantId", () => {
    const itemWithVariant: CartItem = { ...mockItem, variantId: "v1" }
    useCartStore.getState().addItem(itemWithVariant)
    useCartStore.getState().addItem(mockItem)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(2)
    expect(state.items[0].variantId).toBe("v1")
    expect(state.items[1].variantId).toBeNull()
  })

  it("removes only the item with matching productId and variantId", () => {
    const itemWithVariant: CartItem = { ...mockItem, variantId: "v1" }
    useCartStore.getState().addItem(itemWithVariant)
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().removeItem("p1", "v1")
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].variantId).toBeNull()
  })
})

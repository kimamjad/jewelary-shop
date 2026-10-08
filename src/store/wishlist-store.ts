import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistState {
  productIds: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      has: (productId) => get().productIds.includes(productId),
      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),
      clear: () => set({ productIds: [] }),
    }),
    { name: "wishlist-storage" }
  )
)

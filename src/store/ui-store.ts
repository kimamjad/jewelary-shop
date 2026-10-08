import { create } from "zustand"

interface UIState {
  cartOpen: boolean
  mobileNavOpen: boolean
  setCartOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))

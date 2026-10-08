import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createOrder,
  fetchUserOrders,
  fetchOrderById,
  fetchAllOrders,
  fetchAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  type CreateOrderInput,
} from "@/lib/api/orders"
import type { OrderStatus } from "@/types"

const orderKeys = {
  all: ["orders"] as const,
  user: ["orders", "user"] as const,
  detail: (id: string) => ["orders", id] as const,
  admin: ["orders", "admin"] as const,
  adminList: (params?: { status?: string; page?: number }) =>
    ["orders", "admin", params ?? {}] as const,
  wishlist: ["wishlist"] as const,
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.user })
      queryClient.invalidateQueries({ queryKey: orderKeys.admin })
      toast.success("سفارش با موفقیت ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUserOrders() {
  return useQuery({
    queryKey: orderKeys.user,
    queryFn: fetchUserOrders,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  })
}

export function useAdminOrders(params?: { status?: OrderStatus | "all"; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: orderKeys.adminList(params),
    queryFn: () => fetchAllOrders(params),
  })
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchAdminOrderById(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success("وضعیت سفارش به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "paid" | "failed" | "refunded" }) =>
      updatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success("وضعیت پرداخت به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useWishlist() {
  return useQuery({
    queryKey: orderKeys.wishlist,
    queryFn: fetchWishlist,
  })
}

export function useAddToWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.wishlist })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.wishlist })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  fetchDashboardStats,
  getDateRange,
  logAdminAction,
  checkPermission,
  fetchRoles,
  fetchPermissions,
  fetchRolePermissions,
  fetchAdminUsers,
  updateUserRole,
  fetchCustomers,
  fetchInventory,
  updateStock,
  fetchAdminOrdersEnhanced,
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  fetchActivityLogs,
  type DateRangePreset,
} from "@/lib/api/admin"
import type { OrderStatus, ProductStatus, Discount } from "@/types"

const adminKeys = {
  dashboard: (preset: string, start?: string, end?: string) => ["admin", "dashboard", preset, start, end] as const,
  roles: ["admin", "roles"] as const,
  permissions: ["admin", "permissions"] as const,
  rolePermissions: (roleId: string) => ["admin", "role-permissions", roleId] as const,
  users: (params: Record<string, unknown>) => ["admin", "users", params] as const,
  customers: (params: Record<string, unknown>) => ["admin", "customers", params] as const,
  inventory: (params: Record<string, unknown>) => ["admin", "inventory", params] as const,
  orders: (params: Record<string, unknown>) => ["admin", "orders", params] as const,
  discounts: ["admin", "discounts"] as const,
  logs: (params: Record<string, unknown>) => ["admin", "logs", params] as const,
}

// ============================================================
// Dashboard
// ============================================================

export function useDashboardStats(preset: DateRangePreset, customStart?: string, customEnd?: string) {
  return useQuery({
    queryKey: adminKeys.dashboard(preset, customStart, customEnd),
    queryFn: () => {
      const { start, end } = getDateRange(preset, customStart, customEnd)
      return fetchDashboardStats(start, end)
    },
  })
}

// ============================================================
// Permission Check
// ============================================================

export function usePermission(permission: string) {
  return useQuery({
    queryKey: ["permission", permission],
    queryFn: () => checkPermission(permission),
  })
}

export function useLogAdminAction() {
  return useMutation({
    mutationFn: (params: { action: string; entityType: string; entityId?: string; details?: Record<string, unknown> }) =>
      logAdminAction(params.action, params.entityType, params.entityId, params.details),
    onError: (err: Error) => console.error("Failed to log admin action:", err.message),
  })
}

// ============================================================
// RBAC
// ============================================================

export function useRoles() {
  return useQuery({ queryKey: adminKeys.roles, queryFn: fetchRoles })
}

export function usePermissions() {
  return useQuery({ queryKey: adminKeys.permissions, queryFn: fetchPermissions })
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: adminKeys.rolePermissions(roleId),
    queryFn: () => fetchRolePermissions(roleId),
    enabled: !!roleId,
  })
}

// ============================================================
// Admin Users
// ============================================================

export function useAdminUsers(params: { page?: number; pageSize?: number; search?: string; role?: string }) {
  return useQuery({ queryKey: adminKeys.users(params), queryFn: () => fetchAdminUsers(params) })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("نقش کاربر به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// Customers
// ============================================================

export function useCustomers(params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({ queryKey: adminKeys.customers(params), queryFn: () => fetchCustomers(params) })
}

// ============================================================
// Inventory
// ============================================================

export function useInventory(params: {
  page?: number
  pageSize?: number
  search?: string
  status?: ProductStatus | "all"
  stockFilter?: "all" | "low" | "out"
}) {
  return useQuery({ queryKey: adminKeys.inventory(params), queryFn: () => fetchInventory(params) })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateStock(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      toast.success("موجودی به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// Admin Orders
// ============================================================

export function useAdminOrdersEnhanced(params: {
  status?: OrderStatus | "all"
  page?: number
  pageSize?: number
  search?: string
}) {
  return useQuery({ queryKey: adminKeys.orders(params), queryFn: () => fetchAdminOrdersEnhanced(params) })
}

// ============================================================
// Discounts
// ============================================================

export function useDiscounts() {
  return useQuery({ queryKey: adminKeys.discounts, queryFn: fetchDiscounts })
}

export function useCreateDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (d: Omit<Discount, "id" | "used_count">) => createDiscount(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.discounts })
      toast.success("کد تخفیف ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Discount> }) => updateDiscount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.discounts })
      toast.success("کد تخفیف به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.discounts })
      toast.success("کد تخفیف حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// Activity Logs
// ============================================================

export function useActivityLogs(params: { page?: number; pageSize?: number }) {
  return useQuery({ queryKey: adminKeys.logs(params), queryFn: () => fetchActivityLogs(params) })
}

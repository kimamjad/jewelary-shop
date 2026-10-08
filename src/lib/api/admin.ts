import { supabase } from "@/lib/supabase"
import type {
  DashboardStats,
  Profile,
  Customer,
  InventoryItem,
  Role,
  Permission,
  AdminActivityLog,
  Order,
  OrderStatus,
  Discount,
  ProductStatus,
} from "@/types"

// ============================================================
// Dashboard Analytics
// ============================================================

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom"

export function getDateRange(preset: DateRangePreset, customStart?: string, customEnd?: string): { start: string; end: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case "today":
      return { start: today.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
    case "yesterday": {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return { start: y.toISOString().split("T")[0], end: y.toISOString().split("T")[0] }
    }
    case "last_7_days": {
      const s = new Date(today)
      s.setDate(s.getDate() - 6)
      return { start: s.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
    }
    case "last_30_days": {
      const s = new Date(today)
      s.setDate(s.getDate() - 29)
      return { start: s.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
    }
    case "this_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: s.toISOString().split("T")[0], end: e.toISOString().split("T")[0] }
    }
    case "this_year":
      return {
        start: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      }
    case "custom":
      return { start: customStart ?? today.toISOString().split("T")[0], end: customEnd ?? today.toISOString().split("T")[0] }
  }
}

export async function fetchDashboardStats(start: string, end: string): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_start: start,
    p_end: end,
  })
  if (error) throw error
  return data as DashboardStats
}

export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc("log_admin_action", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? null,
    p_details: details ?? null,
  })
  if (error) throw error
}

// ============================================================
// Permission Check
// ============================================================

export async function checkPermission(permission: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", { p_permission: permission })
  if (error) return false
  return data as boolean
}

// ============================================================
// RBAC Management
// ============================================================

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase.from("roles").select("*").order("name")
  if (error) throw error
  return (data ?? []) as Role[]
}

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from("permissions").select("*").order("resource, action")
  if (error) throw error
  return (data ?? []) as Permission[]
}

export async function fetchRolePermissions(roleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId)
  if (error) throw error
  return (data ?? []).map((r: { permission_id: string }) => r.permission_id)
}

// ============================================================
// Admin Users
// ============================================================

export async function fetchAdminUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
}): Promise<{ users: Profile[]; total: number }> {
  const { page = 1, pageSize = 20, search = "", role = "all" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from("profiles").select("*", { count: "exact" })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (role !== "all") {
    query = query.eq("role", role)
  }

  query = query.order("created_at", { ascending: false }).range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  return { users: (data ?? []) as Profile[], total: count ?? 0 }
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
  if (error) throw error
  await logAdminAction("update_role", "user", userId, { new_role: role })
}

// ============================================================
// Customers
// ============================================================

export async function fetchCustomers(params?: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<{ customers: Customer[]; total: number }> {
  const { page = 1, pageSize = 20, search = "" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  query = query.order("created_at", { ascending: false }).range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  const profiles = (data ?? []) as Profile[]

  const customers = await Promise.all(
    profiles.map(async (p) => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("user_id", p.id)
      const totalOrders = orderData?.length ?? 0
      const totalSpent = orderData?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0
      return {
        ...p,
        email: null,
        total_orders: totalOrders,
        total_spent: totalSpent,
      } as Customer
    })
  )

  return { customers, total: count ?? 0 }
}

// ============================================================
// Inventory
// ============================================================

export async function fetchInventory(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: ProductStatus | "all"
  stockFilter?: "all" | "low" | "out"
}): Promise<{ items: InventoryItem[]; total: number }> {
  const { page = 1, pageSize = 20, search = "", status = "all", stockFilter = "all" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("products")
    .select(`
      id, name, slug, sku, stock_quantity, status, base_price, sale_price,
      category:categories(name)
    `, { count: "exact" })
    .is("deleted_at", null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }
  if (status !== "all") {
    query = query.eq("status", status)
  }

  query = query.order("name").range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  let items = (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    sku: p.sku as string,
    stock_quantity: p.stock_quantity as number,
    status: p.status as ProductStatus,
    base_price: p.base_price as number,
    sale_price: p.sale_price as number | null,
    category_name: (p.category as { name: string } | null)?.name ?? null,
  })) as InventoryItem[]

  if (stockFilter === "low") {
    items = items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= 10)
  } else if (stockFilter === "out") {
    items = items.filter((i) => i.stock_quantity === 0)
  }

  return { items, total: count ?? 0 }
}

export async function updateStock(productId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
    .eq("id", productId)
  if (error) throw error
  await logAdminAction("update_stock", "product", productId, { new_quantity: quantity })
}

// ============================================================
// Admin Orders (enhanced)
// ============================================================

export async function fetchAdminOrdersEnhanced(params?: {
  status?: OrderStatus | "all"
  page?: number
  pageSize?: number
  search?: string
}): Promise<{ orders: Order[]; total: number }> {
  const { status = "all", page = 1, pageSize = 20, search = "" } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from("orders").select("*", { count: "exact" })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(`customer_info->>full_name.ilike.%${search}%,customer_info->>phone.ilike.%${search}%`)
  }

  query = query.order("created_at", { ascending: false }).range(from, to)
  const { data, error, count } = await query
  if (error) throw error

  return { orders: (data ?? []) as Order[], total: count ?? 0 }
}

// ============================================================
// Discounts/Coupons
// ============================================================

export async function fetchDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase.from("discounts").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Discount[]
}

export async function createDiscount(d: Omit<Discount, "id" | "used_count">): Promise<Discount> {
  const { data, error } = await supabase
    .from("discounts")
    .insert({ ...d, used_count: 0 })
    .select()
    .single()
  if (error) throw error
  await logAdminAction("create_discount", "discount", (data as Discount).id, { code: d.code })
  return data as Discount
}

export async function updateDiscount(id: string, updates: Partial<Discount>): Promise<void> {
  const { error } = await supabase.from("discounts").update(updates).eq("id", id)
  if (error) throw error
  await logAdminAction("update_discount", "discount", id, updates as Record<string, unknown>)
}

export async function deleteDiscount(id: string): Promise<void> {
  const { error } = await supabase.from("discounts").delete().eq("id", id)
  if (error) throw error
  await logAdminAction("delete_discount", "discount", id)
}

// ============================================================
// Activity Logs
// ============================================================

export async function fetchActivityLogs(params?: {
  page?: number
  pageSize?: number
}): Promise<{ logs: AdminActivityLog[]; total: number }> {
  const { page = 1, pageSize = 20 } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("admin_activity_logs")
    .select(`
      *,
      admin:profiles!admin_id(full_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error
  return { logs: (data ?? []) as unknown as AdminActivityLog[], total: count ?? 0 }
}

// ============================================================
// CSV Export Helper
// ============================================================

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

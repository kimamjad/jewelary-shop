import { supabase } from "@/lib/supabase"
import type { Order, OrderWithItems, OrderStatus, CustomerInfo, ShippingInfo } from "@/types"

export interface CreateOrderInput {
  items: { product_id: string; quantity: number }[]
  customer_info: CustomerInfo
  shipping_info: ShippingInfo
  shipping_method: string
  payment_method: string
  notes?: string | null
}

export interface CreateOrderResult {
  order_id: string
  subtotal: number
  shipping_cost: number
  total: number
  status: string
  payment_status: string
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { data, error } = await supabase.rpc("create_order", {
    p_items: JSON.stringify(input.items),
    p_customer_info: JSON.stringify(input.customer_info),
    p_shipping_info: JSON.stringify(input.shipping_info),
    p_shipping_method: input.shipping_method,
    p_payment_method: input.payment_method,
    p_notes: input.notes ?? null,
  })

  if (error) throw error
  return data as CreateOrderResult
}

export async function fetchUserOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as Order[]
}

export async function fetchOrderById(id: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(
        id, order_id, product_id, variant_id, quantity, unit_price,
        product_name, product_slug, product_snapshot
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as unknown as OrderWithItems | null
}

export async function fetchAllOrders(params?: {
  status?: OrderStatus | "all"
  page?: number
  pageSize?: number
}): Promise<{ orders: Order[]; total: number }> {
  const { status = "all", page = 1, pageSize = 20 } = params ?? {}
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from("orders").select("*", { count: "exact" })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return {
    orders: (data ?? []) as Order[],
    total: count ?? 0,
  }
}

export async function fetchAdminOrderById(id: string): Promise<OrderWithItems | null> {
  return fetchOrderById(id)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

// Wishlist API
export async function fetchWishlist(): Promise<{ product_id: string }[]> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")

  if (error) throw error
  return (data ?? []) as { product_id: string }[]
}

export async function addToWishlist(productId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .insert({ product_id: productId })

  if (error) throw error
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("product_id", productId)

  if (error) throw error
}

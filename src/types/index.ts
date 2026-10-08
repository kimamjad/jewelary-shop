export type UserRole =
  | "customer"
  | "admin"
  | "super_admin"
  | "content_manager"
  | "order_manager"
  | "product_manager"

export type PermissionName =
  | "dashboard.view"
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "inventory.view"
  | "inventory.manage"
  | "categories.manage"
  | "attributes.manage"
  | "orders.view"
  | "orders.manage"
  | "customers.view"
  | "customers.manage"
  | "discounts.manage"
  | "blog.manage"
  | "media.manage"
  | "reports.view"
  | "users.view"
  | "users.manage"
  | "roles.manage"
  | "settings.manage"
  | "activity_logs.view"

export interface Role {
  id: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
}

export interface Permission {
  id: string
  name: PermissionName
  resource: string
  action: string
  description: string | null
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  role_id: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_sales: number
  net_sales: number
  order_count: number
  avg_order_value: number
  customer_count: number
  product_count: number
  low_stock_count: number
  out_of_stock_count: number
  pending_orders: number
  recent_orders: {
    id: string
    customer_name: string
    total: number
    status: OrderStatus
    payment_status: PaymentStatus
    created_at: string
  }[]
  best_sellers: {
    product_id: string
    product_name: string
    total_sold: number
    revenue: number
  }[]
  sales_trend: {
    date: string
    sales: number
    orders: number
  }[]
  start_date: string
  end_date: string
}

export interface Customer extends Profile {
  email: string | null
  total_orders: number
  total_spent: number
}

export interface InventoryItem {
  id: string
  name: string
  slug: string
  sku: string
  stock_quantity: number
  status: ProductStatus
  category_name: string | null
  base_price: number
  sale_price: number | null
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  sort_order: number
  deleted_at: string | null
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  created_at: string
}

export type ProductStatus = "draft" | "published" | "archived"
export type ProductVisibility = "public" | "hidden" | "members_only"

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  brand_id: string | null
  category_id: string | null
  base_price: number
  sale_price: number | null
  compare_at_price: number | null
  cost_price: number | null
  sku: string
  stock_quantity: number
  status: ProductStatus
  visibility: ProductVisibility
  is_featured: boolean
  weight_grams: number | null
  meta_title: string | null
  meta_description: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithRelations extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null
  brand: Pick<Brand, "id" | "name" | "slug"> | null
  images: ProductImage[]
  product_attributes: ProductAttributeWithDetails[]
}

export type AttributeType = "text" | "number" | "select" | "boolean" | "color"

export interface AttributeGroup {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface AttributeOption {
  value: string
  label: string
}

export interface Attribute {
  id: string
  group_id: string
  name: string
  slug: string
  type: AttributeType
  unit: string | null
  is_filterable: boolean
  is_required: boolean
  options: AttributeOption[]
  sort_order: number
  created_at: string
}

export interface AttributeWithGroup extends Attribute {
  group: Pick<AttributeGroup, "id" | "name" | "slug">
}

export interface ProductAttribute {
  id: string
  product_id: string
  attribute_id: string
  value: string
}

export interface ProductAttributeWithDetails extends ProductAttribute {
  attribute: Pick<Attribute, "id" | "name" | "slug" | "type" | "unit">
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  price: number
  stock: number
  attribute_values: Record<string, string>
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface CustomerInfo {
  full_name: string
  phone: string
  email: string | null
}

export interface ShippingInfo {
  province: string
  city: string
  address: string
  postal_code: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total_amount: number
  subtotal: number
  shipping_cost: number
  discount_amount: number
  shipping_address: ShippingInfo | null
  shipping_method: string | null
  payment_method: string | null
  payment_status: PaymentStatus
  payment_ref: string | null
  customer_info: CustomerInfo | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price: number
  product_name: string | null
  product_slug: string | null
  product_snapshot: Record<string, unknown>
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

export type DiscountType = "percentage" | "fixed"

export interface Discount {
  id: string
  code: string
  type: DiscountType
  value: number
  min_order: number | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
}

export type BlogPostStatus = "draft" | "published" | "scheduled"

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  author_id: string
  category_id: string | null
  status: BlogPostStatus
  featured_image: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  og_image: string | null
  reading_time_minutes: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostWithRelations extends BlogPost {
  category: BlogCategory | null
  author: { id: string; full_name: string | null } | null
  tags: BlogTag[]
}

export interface BlogPostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  published_at: string | null
  reading_time_minutes: number | null
  category: { id: string; name: string; slug: string } | null
  author: { id: string; full_name: string | null } | null
}

export interface AdminActivityLog {
  id: string
  admin_id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

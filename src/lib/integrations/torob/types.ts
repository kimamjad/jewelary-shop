export interface TorobProduct {
  page_unique: string
  page_url: string
  product_group_id?: string
  title: string
  subtitle?: string
  current_price: number
  old_price?: number
  availability: boolean
  category_name?: string
  image_links: string[]
  short_desc?: string
  spec: Record<string, string | number>
  guarantee?: string
  date_added: string
  date_updated?: string
  seller_name?: string
  seller_city?: string
}

export interface TorobApiResponse {
  api_version: "torob_api_v3"
  current_page: number
  total: number | null
  max_pages: number | null
  next_cursor: string | null
  products: TorobProduct[]
}

export type TorobSortOption = "date_added_desc" | "date_updated_desc" | "product_id_desc"

export interface TorobRequest {
  page?: number
  sort?: TorobSortOption
  cursor?: string
  page_urls?: string[]
  page_uniques?: string[]
}

export interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string
  base_price: number
  sale_price: number | null
  compare_at_price: number | null
  stock_quantity: number
  status: string
  visibility: string
  short_description: string | null
  description: string | null
  category_id: string | null
  brand_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductImageRow {
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface CategoryRow {
  id: string
  name: string
  slug: string
}

export interface ProductAttributeRow {
  value: string
  attribute: { name: string; slug: string }
}

export interface TorobConfig {
  enabled: boolean
  siteUrl: string
  apiPath: string
}

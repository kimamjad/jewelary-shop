import { supabase } from "@/lib/supabase"
import type {
  Product,
  ProductWithRelations,
  ProductImage,
  Category,
  Brand,
  AttributeGroup,
  Attribute,
  AttributeWithGroup,
} from "@/types"

export interface ProductListParams {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  brandId?: string
  status?: Product["status"] | "all"
  sortBy?: "name" | "created_at" | "base_price" | "stock_quantity"
  sortOrder?: "asc" | "desc"
  includeDeleted?: boolean
}

export interface ProductListResult {
  products: Product[]
  total: number
}

export async function fetchProducts(params: ProductListParams): Promise<ProductListResult> {
  const {
    page = 1,
    pageSize = 12,
    search = "",
    categoryId,
    brandId,
    status = "all",
    sortBy = "created_at",
    sortOrder = "desc",
    includeDeleted = false,
  } = params

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from("products").select("*", { count: "exact" })

  if (!includeDeleted) {
    query = query.is("deleted_at", null)
  }

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (brandId) {
    query = query.eq("brand_id", brandId)
  }

  if (status !== "all") {
    query = query.eq("status", status)
  }

  query = query.order(sortBy, { ascending: sortOrder === "asc" })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    products: (data ?? []) as Product[],
    total: count ?? 0,
  }
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      brand:brands(id, name, slug),
      images:product_images(id, product_id, url, alt_text, sort_order, is_primary),
      product_attributes:product_attributes(
        id, product_id, attribute_id, value,
        attribute:attributes(id, name, slug, type, unit)
      )
    `)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) throw error

  return data as unknown as ProductWithRelations | null
}

export async function fetchProductById(id: string): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      brand:brands(id, name, slug),
      images:product_images(id, product_id, url, alt_text, sort_order, is_primary),
      product_attributes:product_attributes(
        id, product_id, attribute_id, value,
        attribute:attributes(id, name, slug, type, unit)
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error

  return data as unknown as ProductWithRelations | null
}

export async function createProduct(
  input: Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at" | "search_vector">
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  input: Partial<Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at" | "search_vector">>
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function softDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}

export async function restoreProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: null })
    .eq("id", id)

  if (error) throw error
}

export async function generateSlug(text: string): Promise<string> {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export interface ProductImageInput {
  url: string
  alt_text?: string | null
  sort_order?: number
  is_primary?: boolean
}

export async function addProductImages(productId: string, images: ProductImageInput[]): Promise<ProductImage[]> {
  if (images.length === 0) return []

  const rows = images.map((img, idx) => ({
    product_id: productId,
    url: img.url,
    alt_text: img.alt_text ?? null,
    sort_order: img.sort_order ?? idx,
    is_primary: img.is_primary ?? idx === 0,
  }))

  const { data, error } = await supabase
    .from("product_images")
    .insert(rows)
    .select()

  if (error) throw error
  return (data ?? []) as ProductImage[]
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)

  if (error) throw error
}

export async function updateProductImage(imageId: string, input: Partial<ProductImageInput>): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .update(input)
    .eq("id", imageId)

  if (error) throw error
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId)

  if (resetError) throw resetError

  const { error: setError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)

  if (setError) throw setError
}

export async function syncProductAttributes(
  productId: string,
  attributes: { attribute_id: string; value: string }[]
): Promise<void> {
  await supabase.from("product_attributes").delete().eq("product_id", productId)

  if (attributes.length === 0) return

  const rows = attributes.map((a) => ({
    product_id: productId,
    attribute_id: a.attribute_id,
    value: a.value,
  }))

  const { error } = await supabase.from("product_attributes").insert(rows)
  if (error) throw error
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as Category[]
}

export async function createCategory(input: Omit<Category, "id" | "created_at" | "deleted_at">): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, input: Partial<Omit<Category, "id" | "created_at" | "deleted_at">>): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function softDeleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  if (error) throw error
  return (data ?? []) as Brand[]
}

export async function fetchAttributeGroups(): Promise<AttributeGroup[]> {
  const { data, error } = await supabase
    .from("attribute_groups")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as AttributeGroup[]
}

export async function fetchAttributes(): Promise<AttributeWithGroup[]> {
  const { data, error } = await supabase
    .from("attributes")
    .select(`
      *,
      group:attribute_groups(id, name, slug)
    `)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as AttributeWithGroup[]
}

export async function fetchAttributesByGroup(groupId: string): Promise<Attribute[]> {
  const { data, error } = await supabase
    .from("attributes")
    .select("*")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as Attribute[]
}

export async function createAttributeGroup(input: Omit<AttributeGroup, "id" | "created_at">): Promise<AttributeGroup> {
  const { data, error } = await supabase
    .from("attribute_groups")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as AttributeGroup
}

export async function updateAttributeGroup(id: string, input: Partial<Omit<AttributeGroup, "id" | "created_at">>): Promise<AttributeGroup> {
  const { data, error } = await supabase
    .from("attribute_groups")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as AttributeGroup
}

export async function deleteAttributeGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from("attribute_groups")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function createAttribute(input: Omit<Attribute, "id" | "created_at">): Promise<Attribute> {
  const { data, error } = await supabase
    .from("attributes")
    .insert({
      ...input,
      options: input.options ?? [],
    })
    .select()
    .single()

  if (error) throw error
  return data as Attribute
}

export async function updateAttribute(id: string, input: Partial<Omit<Attribute, "id" | "created_at">>): Promise<Attribute> {
  const { data, error } = await supabase
    .from("attributes")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Attribute
}

export async function deleteAttribute(id: string): Promise<void> {
  const { error } = await supabase
    .from("attributes")
    .delete()
    .eq("id", id)

  if (error) throw error
}



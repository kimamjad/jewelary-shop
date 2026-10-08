import type {
  TorobProduct,
  TorobRequest,
  ProductRow,
  ProductImageRow,
  CategoryRow,
  ProductAttributeRow,
} from "./types"

export function mapProductToTorob(
  product: ProductRow,
  images: ProductImageRow[],
  category: CategoryRow | null,
  attributes: ProductAttributeRow[],
  siteUrl: string,
): TorobProduct {
  const pageUrl = `${siteUrl}/product/${product.slug}`
  const displayPrice = product.sale_price ?? product.base_price
  const oldPrice =
    product.compare_at_price !== null && product.compare_at_price > displayPrice
      ? product.compare_at_price
      : undefined

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const imageLinks = sortedImages.map((img) => img.url).filter(Boolean)

  const spec: Record<string, string | number> = {}
  for (const attr of attributes) {
    if (attr.attribute?.name && attr.value) {
      spec[attr.attribute.name] = attr.value
    }
  }

  return {
    page_unique: product.id,
    page_url: pageUrl,
    title: product.name,
    current_price: Math.round(displayPrice),
    old_price: oldPrice !== undefined ? Math.round(oldPrice) : undefined,
    availability: product.status === "published" && product.stock_quantity > 0,
    category_name: category?.name ?? undefined,
    image_links: imageLinks,
    short_desc: product.short_description ?? undefined,
    spec,
    date_added: product.created_at,
    date_updated: product.updated_at !== product.created_at ? product.updated_at : undefined,
  }
}

export function validateTorobRequest(body: unknown): {
  valid: boolean
  error?: string
  request?: TorobRequest
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" }
  }

  const obj = body as Record<string, unknown>
  const hasPageUrls = Array.isArray(obj.page_urls)
  const hasPageUniques = Array.isArray(obj.page_uniques)
  const hasPage = typeof obj.page === "number"
  const hasCursor = typeof obj.cursor === "string"

  if (hasPageUrls || hasPageUniques) {
    return {
      valid: true,
      request: {
        page_urls: hasPageUrls ? (obj.page_urls as string[]) : undefined,
        page_uniques: hasPageUniques ? (obj.page_uniques as string[]) : undefined,
      },
    }
  }

  if (hasCursor) {
    const sort = obj.sort as string
    if (sort !== "product_id_desc") {
      return { valid: false, error: "sort parameter must be 'product_id_desc' when using cursor" }
    }
    return {
      valid: true,
      request: { cursor: obj.cursor as string, sort: "product_id_desc" },
    }
  }

  if (hasPage) {
    const sort = obj.sort as string
    if (!sort) {
      return { valid: false, error: "sort parameter is not provided" }
    }
    const validSorts = ["date_added_desc", "date_updated_desc", "product_id_desc"]
    if (!validSorts.includes(sort)) {
      return { valid: false, error: `sort must be one of: ${validSorts.join(", ")}` }
    }
    return {
      valid: true,
      request: {
        page: obj.page as number,
        sort: sort as TorobRequest["sort"],
      },
    }
  }

  return { valid: false, error: "Request must contain page, cursor, page_urls, or page_uniques" }
}

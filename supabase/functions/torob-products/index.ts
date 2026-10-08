import { createClient } from "npm:@supabase/supabase-js@2.115.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Torob-Token, X-Torob-Token-Version",
}

const TOROB_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`

const PAGE_SIZE = 100
const API_VERSION = "torob_api_v3"

interface ProductRow {
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

interface TorobProduct {
  page_unique: string
  page_url: string
  title: string
  current_price: number
  old_price?: number
  availability: boolean
  category_name?: string
  image_links: string[]
  short_desc?: string
  spec: Record<string, string | number>
  date_added: string
  date_updated?: string
}

interface TorobResponse {
  api_version: string
  current_page: number
  total: number | null
  max_pages: number | null
  next_cursor: string | null
  products: TorobProduct[]
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: settingsData } = await supabase
      .from("torob_settings")
      .select("key, value")
      .eq("key", "enabled")

    const enabled = settingsData?.[0]?.value === true
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: "Torob integration is disabled" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const { data: siteUrlData } = await supabase
      .from("torob_settings")
      .select("value")
      .eq("key", "site_url")
      .maybeSingle()

    const siteUrl = (siteUrlData?.value as string) || ""

    const body = await req.json()
    const { valid, error, request } = validateRequest(body)
    if (!valid) {
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    if (request.page_urls || request.page_uniques) {
      return await handleSingleProductRequest(supabase, siteUrl, request, corsHeaders)
    }

    if (request.cursor) {
      return await handleCursorRequest(supabase, siteUrl, request, corsHeaders)
    }

    return await handlePageRequest(supabase, siteUrl, request, corsHeaders)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

function validateRequest(body: unknown): {
  valid: boolean
  error?: string
  request?: any
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
    if (obj.sort !== "product_id_desc") {
      return { valid: false, error: "sort must be 'product_id_desc' when using cursor" }
    }
    return { valid: true, request: { cursor: obj.cursor as string, sort: "product_id_desc" } }
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
    return { valid: true, request: { page: obj.page as number, sort } }
  }

  return { valid: false, error: "Request must contain page, cursor, page_urls, or page_uniques" }
}

async function mapProduct(
  supabase: ReturnType<typeof createClient>,
  product: ProductRow,
  siteUrl: string,
): Promise<TorobProduct> {
  const [imagesResult, categoryResult, attrsResult] = await Promise.all([
    supabase
      .from("product_images")
      .select("url, alt_text, sort_order, is_primary")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    product.category_id
      ? supabase.from("categories").select("id, name, slug").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("product_attributes")
      .select("value, attribute:attributes(name, slug)")
      .eq("product_id", product.id),
  ])

  const images = (imagesResult.data ?? []) as { url: string; sort_order: number; is_primary: boolean }[]
  const category = categoryResult.data as { id: string; name: string; slug: string } | null
  const attrs = (attrsResult.data ?? []) as { value: string; attribute: { name: string; slug: string } }[]

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const spec: Record<string, string | number> = {}
  for (const attr of attrs) {
    if (attr.attribute?.name && attr.value) {
      spec[attr.attribute.name] = attr.value
    }
  }

  const displayPrice = product.sale_price ?? product.base_price
  const oldPrice =
    product.compare_at_price !== null && product.compare_at_price > displayPrice
      ? Math.round(product.compare_at_price)
      : undefined

  return {
    page_unique: product.id,
    page_url: `${siteUrl}/product/${product.slug}`,
    title: product.name,
    current_price: Math.round(displayPrice),
    old_price: oldPrice,
    availability: product.status === "published" && product.stock_quantity > 0,
    category_name: category?.name,
    image_links: sortedImages.map((img) => img.url).filter(Boolean),
    short_desc: product.short_description ?? undefined,
    spec,
    date_added: product.created_at,
    date_updated: product.updated_at !== product.created_at ? product.updated_at : undefined,
  }
}

async function handlePageRequest(
  supabase: ReturnType<typeof createClient>,
  siteUrl: string,
  request: { page: number; sort: string },
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const page = Math.max(1, request.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const sortColumn = request.sort === "date_updated_desc" ? "updated_at" : "created_at"

  const { data: products, count, error } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order(sortColumn, { ascending: false })
    .range(from, to)

  if (error) throw error

  const torobProducts: TorobProduct[] = []
  for (const product of (products ?? []) as ProductRow[]) {
    torobProducts.push(await mapProduct(supabase, product, siteUrl))
  }

  const total = count ?? 0
  const maxPages = Math.ceil(total / PAGE_SIZE)

  const response: TorobResponse = {
    api_version: API_VERSION,
    current_page: page,
    total,
    max_pages: maxPages || 1,
    next_cursor: null,
    products: torobProducts,
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function handleCursorRequest(
  supabase: ReturnType<typeof createClient>,
  siteUrl: string,
  request: { cursor: string; sort: string },
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const cursorId = request.cursor

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .lt("id", cursorId)
    .order("id", { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw error

  const torobProducts: TorobProduct[] = []
  for (const product of (products ?? []) as ProductRow[]) {
    torobProducts.push(await mapProduct(supabase, product, siteUrl))
  }

  const lastProduct = products?.[products.length - 1]
  const nextCursor = products && products.length === PAGE_SIZE && lastProduct ? lastProduct.id : null

  const response: TorobResponse = {
    api_version: API_VERSION,
    current_page: 1,
    total: null,
    max_pages: null,
    next_cursor: nextCursor,
    products: torobProducts,
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function handleSingleProductRequest(
  supabase: ReturnType<typeof createClient>,
  siteUrl: string,
  request: { page_urls?: string[]; page_uniques?: string[] },
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)

  if (request.page_uniques && request.page_uniques.length > 0) {
    query = query.in("id", request.page_uniques)
  } else if (request.page_urls && request.page_urls.length > 0) {
    const slugs = request.page_urls
      .map((url) => {
        try {
          const u = new URL(url)
          const parts = u.pathname.split("/")
          const productIdx = parts.indexOf("product")
          return productIdx >= 0 && productIdx + 1 < parts.length ? parts[productIdx + 1] : null
        } catch {
          return null
        }
      })
      .filter(Boolean) as string[]
    if (slugs.length === 0) {
      return buildEmptyResponse(corsHeaders)
    }
    query = query.in("slug", slugs)
  } else {
    return buildEmptyResponse(corsHeaders)
  }

  const { data: products, error } = await query
  if (error) throw error

  const torobProducts: TorobProduct[] = []
  for (const product of (products ?? []) as ProductRow[]) {
    torobProducts.push(await mapProduct(supabase, product, siteUrl))
  }

  const response: TorobResponse = {
    api_version: API_VERSION,
    current_page: 1,
    total: torobProducts.length,
    max_pages: 1,
    next_cursor: null,
    products: torobProducts,
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function buildEmptyResponse(corsHeaders: Record<string, string>): Response {
  const response: TorobResponse = {
    api_version: API_VERSION,
    current_page: 1,
    total: 0,
    max_pages: 1,
    next_cursor: null,
    products: [],
  }
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

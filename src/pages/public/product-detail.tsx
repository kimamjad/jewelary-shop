import { useParams, Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Heart, ShoppingCart, Minus, Plus, ChevronLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"
import { formatPrice, toPersianDigits, calculateDiscountPercentage } from "@/lib/format"
import { useSEO, buildProductStructuredData, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import type { ProductWithRelations } from "@/types"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  const { addItem } = useCartStore()
  const wishlistToggle = useWishlistStore((s) => s.toggle)
  const wishlistHas = useWishlistStore((s) => s.has)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
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
      .then(({ data, error }) => {
        if (error) {
          toast.error("خطا در بارگذاری محصول")
          setProduct(null)
        } else {
          setProduct(data as unknown as ProductWithRelations | null)
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyTitle>محصول یافت نشد</EmptyTitle>
          <EmptyDescription>محصول مورد نظر وجود ندارد یا حذف شده است</EmptyDescription>
          <EmptyContent>
            <Button asChild><Link to="/shop">بازگشت به فروشگاه</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
  const inWishlist = wishlistHas(product.id)
  const isAvailable = product.status === "published" && product.stock_quantity > 0
  const displayPrice = product.sale_price ?? product.base_price
  const hasDiscount = product.compare_at_price !== null && product.compare_at_price > displayPrice
  const discountPct = hasDiscount ? calculateDiscountPercentage(product.compare_at_price!, displayPrice) : 0

  const productUrl = `${SITE_URL}/product/${product.slug}`
  const seoDescription = product.meta_description ?? product.short_description ?? product.description?.slice(0, 160) ?? ""
  const seoTitle = product.meta_title ?? product.name

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: productUrl,
    ogType: "product",
    ogImage: primaryImage?.url,
    structuredData: [
      buildBreadcrumbStructuredData([
        { name: "خانه", url: SITE_URL },
        { name: "فروشگاه", url: `${SITE_URL}/shop` },
        ...(product.category ? [{ name: product.category.name, url: `${SITE_URL}/category/${product.category.slug}` }] : []),
        { name: product.name, url: productUrl },
      ]),
      buildProductStructuredData({
        name: product.name,
        description: seoDescription,
        image: primaryImage?.url,
        sku: product.sku,
        price: displayPrice,
        availability: isAvailable ? "InStock" : "OutOfStock",
        brand: product.brand?.name,
        category: product.category?.name,
        url: productUrl,
      }),
    ],
  })

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: displayPrice,
      image: primaryImage?.url ?? null,
      quantity,
      variantId: null,
    })
    toast.success("به سبد خرید اضافه شد")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/shop"><ChevronLeft className="size-4" /> فروشگاه</Link>
        </Button>
        {product.category && (
          <>
            <span className="text-muted-foreground">/</span>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted">
              {primaryImage ? (
                <img src={primaryImage.url} alt={primaryImage.alt_text ?? product.name} className="size-full object-cover" loading="eager" fetchPriority="high" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ShoppingCart className="size-16" />
                </div>
              )}
            </div>
          </Card>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img src={img.url} alt={img.alt_text ?? ""} className="size-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {product.brand && (
              <Badge variant="secondary" className="mb-2">{product.brand.name}</Badge>
            )}
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1" dir="ltr">SKU: {product.sku}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compare_at_price!)}</span>
                <Badge className="bg-destructive text-destructive-foreground">{toPersianDigits(discountPct)}٪ تخفیف</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAvailable ? (
              <Badge variant="default" className="gap-1">
                <Check className="size-3" /> موجود ({toPersianDigits(product.stock_quantity)} عدد)
              </Badge>
            ) : (
              <Badge variant="destructive">ناموجود</Badge>
            )}
          </div>

          {product.short_description && (
            <p className="text-muted-foreground">{product.short_description}</p>
          )}

          <Separator />

          {product.product_attributes && product.product_attributes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">ویژگی‌ها</h3>
              <div className="grid gap-2">
                {product.product_attributes.map((pa) => (
                  <div key={pa.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pa.attribute.name}</span>
                    <span className="font-medium">
                      {pa.value}{pa.attribute.unit ? ` ${pa.attribute.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center font-medium">{toPersianDigits(quantity)}</span>
              <Button variant="outline" size="icon" className="size-9" onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))} disabled={quantity >= product.stock_quantity}>
                <Plus className="size-4" />
              </Button>
            </div>

            <Button className="flex-1" size="lg" disabled={!isAvailable} onClick={handleAddToCart}>
              <ShoppingCart className="size-5" />
              افزودن به سبد
            </Button>

            <Button variant="outline" size="icon" className="size-10" onClick={() => { wishlistToggle(product.id); toast.success(inWishlist ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد") }}>
              <Heart className={`size-5 ${inWishlist ? "fill-primary text-primary" : ""}`} />
            </Button>
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">توضیحات</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

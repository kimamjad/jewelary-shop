import { Link } from "react-router-dom"
import { Heart, ShoppingBag } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useWishlistStore } from "@/store/wishlist-store"
import { useCartStore } from "@/store/cart-store"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/types"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function WishlistPage() {
  useSEO({
    title: "علاقه‌مندی‌های من",
    description: "لیست محصولات مورد علاقه شما",
    canonical: `${SITE_URL}/wishlist`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "علاقه‌مندی‌ها", url: `${SITE_URL}/wishlist` },
    ]),
  })

  const { productIds, remove } = useWishlistStore()
  const { addItem, items: cartItems } = useCartStore()

  const { data: products, isLoading } = useQuery({
    queryKey: ["wishlist-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return []
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .is("deleted_at", null)
      if (error) throw error
      return (data ?? []) as Product[]
    },
    enabled: productIds.length > 0,
  })

  if (productIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyMedia variant="icon"><Heart className="size-12" /></EmptyMedia>
          <EmptyTitle>لیست علاقه‌مندی‌های شما خالی است</EmptyTitle>
          <EmptyDescription>محصولات مورد علاقه خود را در اینجا ذخیره کنید</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/shop">مشاهده محصولات</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">علاقه‌مندی‌های من</h1>

      {isLoading ? (
        <div className="space-y-3">
          {productIds.map((id) => (
            <Skeleton key={id} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(products ?? []).map((product) => {
            const inCart = cartItems.some((i) => i.productId === product.id)
            const displayPrice = product.sale_price ?? product.base_price
            const isAvailable = product.status === "published" && product.stock_quantity > 0

            return (
              <Card key={product.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Link to={`/product/${product.slug}`} className="min-w-0 flex-1">
                      <p className="font-medium truncate hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(displayPrice)}
                      </p>
                    </Link>
                    <Badge variant={isAvailable ? "default" : "destructive"}>
                      {isAvailable ? "موجود" : "ناموجود"}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!inCart && isAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          addItem({
                            productId: product.id,
                            name: product.name,
                            slug: product.slug,
                            price: displayPrice,
                            image: null,
                            quantity: 1,
                            variantId: null,
                          })
                        }}
                      >
                        <ShoppingBag className="size-4" />
                        افزودن به سبد
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(product.id)}
                      className="text-destructive"
                    >
                      <Heart className="size-4" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Show placeholders for product IDs that no longer exist */}
          {(products ?? []).length < productIds.length && (
            <p className="text-center text-sm text-muted-foreground">
              برخی محصولات حذف شده‌اند و نمایش داده نمی‌شوند
            </p>
          )}
        </div>
      )}
    </div>
  )
}

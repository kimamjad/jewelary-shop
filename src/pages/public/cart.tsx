import { Link } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty"
import { formatPrice, toPersianDigits } from "@/lib/format"

export function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore()
  const wishlistToggle = useWishlistStore((s) => s.toggle)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyMedia variant="icon"><ShoppingBag className="size-12" /></EmptyMedia>
          <EmptyTitle>سبد خرید شما خالی است</EmptyTitle>
          <EmptyDescription>هنوز محصولی به سبد خرید اضافه نکرده‌اید</EmptyDescription>
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
      <h1 className="text-2xl font-bold mb-6">سبد خرید ({toPersianDigits(getTotalItems())} کالا)</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="size-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.slug}`}
                    className="font-medium hover:text-primary line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{toPersianDigits(item.quantity)}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                <div className="text-left shrink-0">
                  <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    onClick={() => wishlistToggle(item.productId)}
                    title="افزودن به علاقه‌مندی"
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => removeItem(item.productId, item.variantId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تعداد کالا</span>
                <span>{toPersianDigits(getTotalItems())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>مبلغ قابل پرداخت</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">ادامه خرید</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/shop">ادامه خرید</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

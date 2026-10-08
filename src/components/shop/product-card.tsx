import { Link } from "react-router-dom"
import { ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, toPersianDigits, calculateDiscountPercentage } from "@/lib/format"
import type { Product } from "@/types"
import { useCartStore } from "@/store/cart-store"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const displayPrice = product.sale_price ?? product.base_price
  const hasDiscount =
    product.compare_at_price !== null && product.compare_at_price > displayPrice
  const discountPct = hasDiscount
    ? calculateDiscountPercentage(product.compare_at_price!, displayPrice)
    : 0
  const isAvailable = product.status === "published" && product.stock_quantity > 0

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAvailable) return
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: displayPrice,
      image: null,
      quantity: 1,
      variantId: null,
    })
    toast.success("به سبد خرید اضافه شد")
  }

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-square bg-muted overflow-hidden">
          <div className="flex size-full items-center justify-center text-muted-foreground transition-transform group-hover:scale-105">
            <ShoppingCart className="size-10" />
          </div>
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <Link to={`/product/${product.slug}`}>
          <h2 className="font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h2>
        </Link>
        {product.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.short_description}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{formatPrice(displayPrice)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          {isAvailable ? (
            <Badge variant="default">موجود</Badge>
          ) : (
            <Badge variant="destructive">ناموجود</Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-destructive text-destructive-foreground">
              {toPersianDigits(discountPct)}٪ تخفیف
            </Badge>
          )}
        </div>
        {isAvailable && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleQuickAdd}
          >
            <ShoppingCart className="size-4" />
            افزودن سریع
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

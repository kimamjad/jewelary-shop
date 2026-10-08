import { useParams, Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { ChevronLeft, ShoppingCart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSEO, buildBreadcrumbStructuredData, buildWebsiteStructuredData } from "@/hooks/use-seo"
import { formatPrice } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import type { Category, Product } from "@/types"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle()
      .then(({ data: catData, error: catError }) => {
        if (catError || !catData) {
          setCategory(null)
          setProducts([])
          setLoading(false)
          return
        }
        const cat = catData as Category
        setCategory(cat)
        supabase
          .from("products")
          .select("*")
          .eq("category_id", cat.id)
          .eq("status", "published")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .then(({ data: prodData }) => {
            setProducts((prodData ?? []) as Product[])
            setLoading(false)
          })
      })
  }, [slug])

  const categoryUrl = category ? `${SITE_URL}/category/${category.slug}` : ""
  const seoTitle = category?.meta_title ?? category?.name ?? "دسته‌بندی"
  const seoDescription = category?.meta_description ?? category?.description ?? ""

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: categoryUrl,
    ogType: "website",
    structuredData: category
      ? [
          buildWebsiteStructuredData(SITE_URL),
          buildBreadcrumbStructuredData([
            { name: "خانه", url: SITE_URL },
            { name: "فروشگاه", url: `${SITE_URL}/shop` },
            { name: category.name, url: categoryUrl },
          ]),
        ]
      : undefined,
  })

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyTitle>دسته‌بندی یافت نشد</EmptyTitle>
          <EmptyDescription>این دسته‌بندی وجود ندارد یا حذف شده است</EmptyDescription>
          <EmptyContent>
            <Button asChild><Link to="/shop">بازگشت به فروشگاه</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/shop"><ChevronLeft className="size-4" /> فروشگاه</Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{category.name}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>محصولی در این دسته‌بندی وجود ندارد</EmptyTitle>
          <EmptyDescription>به‌زودی محصولات جدیدی اضافه خواهد شد</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const displayPrice = product.sale_price ?? product.base_price
            const hasDiscount = product.compare_at_price !== null && product.compare_at_price > displayPrice
            return (
              <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <Link to={`/product/${product.slug}`}>
                  <div className="aspect-square bg-muted overflow-hidden">
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ShoppingCart className="size-10" />
                    </div>
                  </div>
                </Link>
                <CardContent className="p-4 space-y-2">
                  <Link to={`/product/${product.slug}`}>
                    <h2 className="font-medium line-clamp-2 hover:text-primary transition-colors">{product.name}</h2>
                  </Link>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">{formatPrice(displayPrice)}</span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.compare_at_price!)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.stock_quantity > 0 ? (
                      <Badge variant="default">موجود</Badge>
                    ) : (
                      <Badge variant="destructive">ناموجود</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles, Shield, Truck, Gem } from "lucide-react"
import { useSEO, buildWebsiteStructuredData } from "@/hooks/use-seo"
import { useSearchProducts } from "@/hooks/use-search"
import { useCategories } from "@/hooks/use-catalog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/shop/product-card"
import type { SearchFilters } from "@/lib/api/search"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const featuredFilters: SearchFilters = {
  sort: "newest",
  page: 1,
  pageSize: 8,
}

const features = [
  { icon: Gem, title: "اصالت کالا", desc: "تمام محصولات با گواهی اصالت ارائه می‌شوند" },
  { icon: Shield, title: "ضمانت کیفیت", desc: "ضمانت بازگشت کالا تا ۷ روز" },
  { icon: Truck, title: "ارسال سریع", desc: "ارسال به سراسر کشور در کوتاه‌ترین زمان" },
  { icon: Sparkles, title: "تنوع بالا", desc: "بیش از صدها مدل انگشتر و سنگ قیمتی" },
]

export function HomePage() {
  useSEO({
    title: "فروشگاه جواهرات لوکس",
    description: "خرید آنلاین انگشتر، گردنبند و سنگ‌های قیمتی با بهترین کیفیت و ضمانت اصالت",
    canonical: SITE_URL,
    ogType: "website",
    structuredData: buildWebsiteStructuredData(SITE_URL),
  })

  const { data: featuredData, isLoading: featuredLoading } = useSearchProducts(featuredFilters)
  const { data: categories } = useCategories()

  const featuredProducts = featuredData?.products ?? []
  const activeCategories = (categories ?? []).filter((c) => c.is_active).slice(0, 6)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="size-3" />
              مجموعه جدید پاییز ۱۴۰۴
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
              جواهرات لوکس، اصالت در هر جزئیات
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-7">
              خرید آنلاین انگشتر طلا، گردنبند و سنگ‌های قیمتی با گواهی اصالت و ضمانت کیفیت.
              مستقیم از تولید به دست شما، با بهترین قیمت.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/shop">
                  مشاهده فروشگاه
                  <ArrowLeft className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">درباره ما</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {activeCategories.length > 0 && (
        <section className="border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">دسته‌بندی‌ها</h2>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link to="/shop">
                  همه محصولات
                  <ArrowLeft className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCategories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.slug}`}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <ArrowLeft className="size-5 text-muted-foreground transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">جدیدترین محصولات</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/shop">
                مشاهده همه
                <ArrowLeft className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          {featuredLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              به‌زودی محصولات جدیدی اضافه خواهد شد
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-3xl">
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-right">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Gem className="size-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">مشاوره خرید رایگان</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  کارشناسان ما برای راهنمایی در انتخاب بهترین جواهر در خدمت شما هستند.
                </p>
              </div>
              <Button asChild size="lg">
                <Link to="/contact">تماس با ما</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

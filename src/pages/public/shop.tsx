import { useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { useSearchProducts } from "@/hooks/use-search"
import { parseSearchParams, buildSearchURL, hasActiveFilters } from "@/lib/api/search-url"
import type { SearchFilters, SortOption } from "@/lib/api/search"
import { toPersianDigits } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { FilterSidebar } from "@/components/shop/filter-sidebar"
import { ProductCard } from "@/components/shop/product-card"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const SORT_LABELS: Record<SortOption, string> = {
  newest: "جدیدترین",
  price_asc: "ارزان‌ترین",
  price_desc: "گران‌ترین",
  name_asc: "نام (الفبا)",
  name_desc: "نام (برعکس)",
  popular: "محبوب‌ترین",
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = useMemo(() => parseSearchParams(searchParams), [searchParams])

  const filters: SearchFilters = useMemo(
    () => ({
      query: parsed.query,
      categorySlug: parsed.categorySlug,
      brandIds: parsed.brandIds,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
      inStockOnly: parsed.inStockOnly,
      attributes: parsed.attributes,
      sort: parsed.sort ?? "newest",
      page: parsed.page ?? 1,
      pageSize: 12,
    }),
    [parsed]
  )

  const { data, isLoading, isError } = useSearchProducts(filters)

  const updateFilters = (newFilters: SearchFilters) => {
    const url = buildSearchURL(newFilters)
    setSearchParams(url ? new URLSearchParams(url) : new URLSearchParams())
  }

  const handleSortChange = (value: SortOption) => {
    updateFilters({ ...filters, sort: value, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateFilters({ ...filters, page: newPage })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  useEffect(() => {
    if (parsed.page && parsed.page > 1 && (!data || data.totalPages < parsed.page)) {
      updateFilters({ ...filters, page: 1 })
    }
  }, [data, parsed.page])

  useSEO({
    title: "فروشگاه",
    description: "لیست تمام محصولات جواهرات و سنگ‌های قیمتی با فیلتر و جستجو",
    canonical: `${SITE_URL}/shop`,
    ogType: "website",
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "فروشگاه", url: `${SITE_URL}/shop` },
    ]),
  })

  const activeFilterCount = hasActiveFilters(parsed)
  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">فروشگاه</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "در حال بارگذاری..." : `${toPersianDigits(total)} محصول`}
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar filters={filters} onFiltersChange={updateFilters} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <FilterSidebar filters={filters} onFiltersChange={updateFilters} isMobile />
            </div>

            <div className="flex items-center gap-2">
              {activeFilterCount && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
                  <X className="size-4" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">مرتب‌سازی:</span>
              <Select value={filters.sort ?? "newest"} onValueChange={(v) => handleSortChange(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
              ))}
            </div>
          ) : isError ? (
            <Empty className="py-16">
              <EmptyTitle>خطا در بارگذاری محصولات</EmptyTitle>
              <EmptyDescription>لطفاً دوباره تلاش کنید</EmptyDescription>
            </Empty>
          ) : products.length === 0 ? (
            <Empty className="py-16">
              <EmptyTitle>محصولی یافت نشد</EmptyTitle>
              <EmptyDescription>
                {activeFilterCount
                  ? "فیلترهای انتخابی را تغییر دهید یا پاک کنید"
                  : "به‌زودی محصولات جدیدی اضافه خواهد شد"}
              </EmptyDescription>
              {activeFilterCount && (
                <Button variant="outline" onClick={handleClearFilters} className="mt-4 gap-1">
                  <X className="size-4" />
                  پاک کردن فیلترها
                </Button>
              )}
            </Empty>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="text-muted-foreground px-1">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? "default" : "outline"}
                          size="icon"
                          className="w-9"
                          onClick={() => handlePageChange(page)}
                        >
                          {toPersianDigits(page)}
                        </Button>
                      </div>
                    ))}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

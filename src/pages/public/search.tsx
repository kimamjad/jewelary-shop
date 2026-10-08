import { useMemo, useState, useEffect, useRef } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { Search as SearchIcon, X, ArrowLeft, Tag, Folder, Package } from "lucide-react"
import { useSEO } from "@/hooks/use-seo"
import { useSearchProducts, useSearchSuggestions } from "@/hooks/use-search"
import { parseSearchParams, buildSearchURL, hasActiveFilters } from "@/lib/api/search-url"
import type { SearchFilters, SortOption } from "@/lib/api/search"
import { toPersianDigits } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
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

const SUGGESTION_ICONS = {
  product: Package,
  category: Folder,
  brand: Tag,
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const parsed = useMemo(() => parseSearchParams(searchParams), [searchParams])
  const [inputValue, setInputValue] = useState(parsed.query ?? "")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const { data, isLoading } = useSearchProducts(filters)
  const { data: suggestions } = useSearchSuggestions(inputValue)

  useEffect(() => {
    setInputValue(parsed.query ?? "")
  }, [parsed.query])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const newFilters: SearchFilters = { ...filters, query: value || undefined, page: 1 }
      const url = buildSearchURL(newFilters)
      setSearchParams(url ? new URLSearchParams(url) : new URLSearchParams())
    }, 400)
  }

  const handleSuggestionClick = (suggestion: { type: string; slug: string }) => {
    setShowSuggestions(false)
    if (suggestion.type === "product") {
      navigate(`/product/${suggestion.slug}`)
    } else if (suggestion.type === "category") {
      navigate(`/category/${suggestion.slug}`)
    } else if (suggestion.type === "brand") {
      const newFilters: SearchFilters = { ...filters, brandIds: undefined, page: 1 }
      const url = buildSearchURL(newFilters)
      setSearchParams(url ? new URLSearchParams(url) : new URLSearchParams())
      navigate(`/shop?brands=${suggestion.slug}`)
    }
  }

  const handleSortChange = (value: SortOption) => {
    const newFilters = { ...filters, sort: value, page: 1 }
    const url = buildSearchURL(newFilters)
    setSearchParams(url ? new URLSearchParams(url) : new URLSearchParams())
  }

  const handleClearFilters = () => {
    setInputValue("")
    setSearchParams(new URLSearchParams())
  }

  useSEO({
    title: parsed.query ? `جستجو: ${parsed.query}` : "جستجو",
    description: "جستجوی محصولات جواهرات و سنگ‌های قیمتی",
    canonical: `${SITE_URL}/search`,
    ogType: "website",
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 1
  const hasQuery = Boolean(parsed.query)
  const activeFilterCount = hasActiveFilters(parsed)

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage }
    const url = buildSearchURL(newFilters)
    setSearchParams(url ? new URLSearchParams(url) : new URLSearchParams())
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="جستجوی محصول، دسته‌بندی یا برند..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pr-10 h-12 text-base"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 size-8"
              onClick={() => handleInputChange("")}
            >
              <X className="size-4" />
            </Button>
          )}

          {showSuggestions && suggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-lg border bg-popover shadow-md z-50">
              <div className="p-2">
                {suggestions.map((s, i) => {
                  const Icon = SUGGESTION_ICONS[s.type]
                  return (
                    <button
                      key={i}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-right"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSuggestionClick(s)
                      }}
                    >
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="flex-1">{s.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.type === "product" ? "محصول" : s.type === "category" ? "دسته" : "برند"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasQuery || activeFilterCount ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "در حال جستجو..." : `${toPersianDigits(total)} نتیجه`}
            </p>

            <div className="flex items-center gap-2">
              {activeFilterCount && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
                  <X className="size-4" />
                  پاک کردن
                </Button>
              )}
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
          ) : products.length === 0 ? (
            <Empty className="py-16">
              <EmptyTitle>نتیجه‌ای یافت نشد</EmptyTitle>
              <EmptyDescription>
                کلمه کلیدی را تغییر دهید یا فیلترها را پاک کنید
              </EmptyDescription>
              <Button variant="outline" onClick={handleClearFilters} className="mt-4 gap-1">
                <X className="size-4" />
                پاک کردن فیلترها
              </Button>
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
                    <ArrowLeft className="size-4" />
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
                    <ArrowLeft className="size-4 rotate-180" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="py-16 text-center">
          <SearchIcon className="mx-auto size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">جستجوی محصولات</h2>
          <p className="text-muted-foreground mb-6">
            نام محصول، دسته‌بندی یا برند مورد نظر خود را جستجو کنید
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link to="/shop">مشاهده همه محصولات</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

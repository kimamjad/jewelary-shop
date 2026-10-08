import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useFilterFacets } from "@/hooks/use-search"
import { toPersianDigits } from "@/lib/format"
import type { SearchFilters } from "@/lib/api/search"
import { useState } from "react"

interface FilterSidebarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  isMobile?: boolean
}

export function FilterSidebar({ filters, onFiltersChange, isMobile = false }: FilterSidebarProps) {
  const { data: facets, isLoading } = useFilterFacets()
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 100000000,
  ])

  const activeAttrFilters = filters.attributes ?? {}

  const toggleBrand = (brandId: string) => {
    const current = filters.brandIds ?? []
    const newBrands = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId]
    onFiltersChange({ ...filters, brandIds: newBrands.length > 0 ? newBrands : undefined, page: 1 })
  }

  const toggleAttribute = (attrId: string, value: string) => {
    const current = activeAttrFilters[attrId] ?? []
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    const newAttrs = { ...activeAttrFilters }
    if (newValues.length > 0) {
      newAttrs[attrId] = newValues
    } else {
      delete newAttrs[attrId]
    }
    onFiltersChange({ ...filters, attributes: newAttrs, page: 1 })
  }

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
  }

  const applyPriceFilter = () => {
    onFiltersChange({
      ...filters,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < (facets?.priceRange.max ?? 100000000) ? priceRange[1] : undefined,
      page: 1,
    })
  }

  const toggleInStock = () => {
    onFiltersChange({ ...filters, inStockOnly: !filters.inStockOnly, page: 1 })
  }

  const content = (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-3 font-semibold">موجودی</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStockOnly ?? false}
                onCheckedChange={toggleInStock}
              />
              <label htmlFor="in-stock" className="text-sm cursor-pointer">
                فقط محصولات موجود
              </label>
            </div>
          </div>

          <Separator />

          {facets && facets.priceRange.max > 0 && (
            <>
              <div>
                <h3 className="mb-3 font-semibold">محدوده قیمت</h3>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={facets.priceRange.max}
                    step={facets.priceRange.max > 10000000 ? 1000000 : 100000}
                    value={[priceRange[0], priceRange[1]]}
                    onValueChange={handlePriceChange}
                    onValueCommit={applyPriceFilter}
                    className="my-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{toPersianDigits(priceRange[0].toLocaleString())}</span>
                    <span>{toPersianDigits(priceRange[1].toLocaleString())}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {facets && facets.brands.length > 0 && (
            <>
              <div>
                <h3 className="mb-3 font-semibold">برند</h3>
                <div className="space-y-2">
                  {facets.brands
                    .filter((b) => b.count > 0)
                    .map((brand) => (
                      <div key={brand.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`brand-${brand.id}`}
                          checked={filters.brandIds?.includes(brand.id) ?? false}
                          onCheckedChange={() => toggleBrand(brand.id)}
                        />
                        <label
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{brand.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({toPersianDigits(brand.count)})
                          </span>
                        </label>
                      </div>
                    ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {facets && facets.attributeFacets.length > 0 && (
            <>
              {facets.attributeFacets.map((facet) => (
                <div key={facet.attributeId}>
                  <h3 className="mb-3 font-semibold">{facet.attributeName}</h3>
                  <div className="space-y-2">
                    {facet.options.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`attr-${facet.attributeId}-${opt.value}`}
                          checked={activeAttrFilters[facet.attributeId]?.includes(opt.value) ?? false}
                          onCheckedChange={() => toggleAttribute(facet.attributeId, opt.value)}
                        />
                        <label
                          htmlFor={`attr-${facet.attributeId}-${opt.value}`}
                          className="text-sm cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{opt.label}</span>
                          <span className="text-muted-foreground text-xs">
                            ({toPersianDigits(opt.count)})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 lg:hidden">
            <Filter className="size-4" />
            فیلترها
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>فیلترها</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-6rem)] mt-4 pr-4">
            {content}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="sticky top-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">فیلترها</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">{content}</ScrollArea>
    </div>
  )
}

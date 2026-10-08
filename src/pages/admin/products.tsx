import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Eye, Trash2, Pencil, ArrowUpDown, Package } from "lucide-react"
import { useProducts, useCategories, useSoftDeleteProduct } from "@/hooks/use-catalog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, toPersianDigits, formatDate } from "@/lib/format"
import type { Product } from "@/types"

const statusLabels: Record<Product["status"], string> = {
  draft: "پیش‌نویس",
  published: "منتشر شده",
  archived: "آرشیو شده",
}

const statusVariants: Record<Product["status"], "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  published: "default",
  archived: "destructive",
}

export function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "base_price" | "stock_quantity">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const { data, isLoading } = useProducts({
    page,
    pageSize,
    search,
    categoryId: categoryId === "all" ? undefined : categoryId,
    status: statusFilter as Product["status"] | "all",
    sortBy,
    sortOrder,
  })
  const { data: categories } = useCategories()
  const softDelete = useSoftDeleteProduct()

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize)

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این محصول مطمئن هستید؟")) {
      softDelete.mutate(id)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const sortedProducts = data?.products ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? toPersianDigits(data.total) : "—"} محصول
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، SKU یا اسلاگ..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="published">منتشر شده</SelectItem>
                <SelectItem value="draft">پیش‌نویس</SelectItem>
                <SelectItem value="archived">آرشیو شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">تصویر</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("name")}>
                    نام
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("base_price")}>
                    قیمت
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("stock_quantity")}>
                    موجودی
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("created_at")}>
                    تاریخ
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 size-8 opacity-50" />
                    محصولی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="size-10 rounded-md bg-muted" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/admin/products/${product.id}`} className="hover:text-primary hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{product.sku}</TableCell>
                    <TableCell>{formatPrice(product.base_price)}</TableCell>
                    <TableCell>
                      <span className={product.stock_quantity === 0 ? "text-destructive" : ""}>
                        {toPersianDigits(product.stock_quantity)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[product.status]}>
                        {statusLabels[product.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/product/${product.slug}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/products/${product.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

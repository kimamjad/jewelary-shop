import { useState } from "react"
import { Save } from "lucide-react"
import { useInventory, useUpdateStock } from "@/hooks/use-admin"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice, toPersianDigits } from "@/lib/format"
import type { InventoryItem, ProductStatus } from "@/types"

const statusLabels: Record<ProductStatus, string> = { draft: "پیش‌نویس", published: "منتشر شده", archived: "بایگانی" }

export function AdminInventoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ProductStatus | "all">("all")
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const { data, isLoading } = useInventory({ page, pageSize: 20, search, status, stockFilter })
  const updateStock = useUpdateStock()

  const columns: Column<InventoryItem>[] = [
    { key: "name", header: "نام محصول", sortable: true, accessor: (r) => r.name },
    { key: "sku", header: "SKU", sortable: true, accessor: (r) => <span dir="ltr">{r.sku}</span> },
    { key: "category_name", header: "دسته", accessor: (r) => r.category_name ?? "—" },
    { key: "status", header: "وضعیت", accessor: (r) => <Badge variant={r.status === "published" ? "default" : "secondary"}>{statusLabels[r.status]}</Badge> },
    { key: "stock_quantity", header: "موجودی", sortable: true, accessor: (r) => {
      if (editingId === r.id) {
        return (
          <div className="flex items-center gap-1">
            <Input className="h-8 w-20" type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <Button size="icon" className="size-8" onClick={() => { updateStock.mutate({ productId: r.id, quantity: Number(editValue) }); setEditingId(null) }}>
              <Save className="size-3" />
            </Button>
          </div>
        )
      }
      const isLow = r.stock_quantity > 0 && r.stock_quantity <= 10
      const isOut = r.stock_quantity === 0
      return (
        <button
          className={`font-medium ${isOut ? "text-destructive" : isLow ? "text-amber-500" : ""}`}
          onClick={() => { setEditingId(r.id); setEditValue(String(r.stock_quantity)) }}
        >
          {toPersianDigits(r.stock_quantity)}
        </button>
      )
    }, exportValue: (r) => r.stock_quantity },
    { key: "base_price", header: "قیمت پایه", sortable: true, accessor: (r) => formatPrice(r.base_price), exportValue: (r) => r.base_price },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت موجودی</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت موجودی محصولات</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="جستجوی محصول یا SKU..." className="max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <Select value={status} onValueChange={(v) => { setStatus(v as ProductStatus | "all"); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="published">منتشر شده</SelectItem>
            <SelectItem value="draft">پیش‌نویس</SelectItem>
            <SelectItem value="archived">بایگانی</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v as "all" | "low" | "out"); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="low">موجودی کم</SelectItem>
            <SelectItem value="out">ناموجود</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable
              data={data?.items ?? []}
              columns={columns}
              getRowId={(r) => r.id}
              enableExport
              exportFilename="inventory.csv"
              emptyMessage="محصولی یافت نشد"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

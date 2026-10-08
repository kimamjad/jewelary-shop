import { useState } from "react"
import { useCustomers } from "@/hooks/use-admin"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, toPersianDigits, formatDate } from "@/lib/format"
import type { Customer } from "@/types"

export function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useCustomers({ page, pageSize: 20, search })

  const columns: Column<Customer>[] = [
    { key: "full_name", header: "نام", sortable: true, accessor: (r) => r.full_name ?? "ناشناس", exportValue: (r) => r.full_name ?? "" },
    { key: "phone", header: "تلفن", accessor: (r) => <span dir="ltr">{r.phone ?? "—"}</span>, exportValue: (r) => r.phone ?? "" },
    { key: "total_orders", header: "تعداد سفارش", sortable: true, accessor: (r) => toPersianDigits(r.total_orders), exportValue: (r) => r.total_orders },
    { key: "total_spent", header: "کل خرید", sortable: true, accessor: (r) => formatPrice(r.total_spent), exportValue: (r) => r.total_spent },
    { key: "created_at", header: "تاریخ عضویت", sortable: true, accessor: (r) => formatDate(r.created_at), exportValue: (r) => r.created_at },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مشتریان</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت مشتریان فروشگاه</p>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="جستجوی نام یا تلفن..." className="max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable
              data={data?.customers ?? []}
              columns={columns}
              getRowId={(r) => r.id}
              enableExport
              exportFilename="customers.csv"
              emptyMessage="مشتری‌ای یافت نشد"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

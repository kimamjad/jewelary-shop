import { useState } from "react"
import { Download } from "lucide-react"
import { useDashboardStats } from "@/hooks/use-admin"
import { type DateRangePreset, exportToCSV } from "@/lib/api/admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { formatPrice, formatNumber, toPersianDigits, formatDate } from "@/lib/format"

const presetLabels: Record<DateRangePreset, string> = {
  today: "امروز", yesterday: "دیروز", last_7_days: "۷ روز اخیر", last_30_days: "۳۰ روز اخیر",
  this_month: "این ماه", last_month: "ماه گذشته", this_year: "امسال", custom: "بازه دلخواه",
}

export function AdminReportsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("last_30_days")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const { data: stats, isLoading } = useDashboardStats(preset, customStart, customEnd)

  const handleExportSales = () => {
    const trend = stats?.sales_trend ?? []
    exportToCSV("sales-report.csv",
      ["تاریخ", "فروش", "تعداد سفارش"],
      trend.map((t) => [t.date, t.sales, t.orders])
    )
  }

  const handleExportBestSellers = () => {
    const sellers = stats?.best_sellers ?? []
    exportToCSV("best-sellers.csv",
      ["محصول", "تعداد فروش", "درآمد"],
      sellers.map((s) => [s.product_name, s.total_sold, s.revenue])
    )
  }

  const handleExportRecentOrders = () => {
    const orders = stats?.recent_orders ?? []
    exportToCSV("recent-orders.csv",
      ["شناسه", "مشتری", "مبلغ", "وضعیت", "تاریخ"],
      orders.map((o) => [o.id, o.customer_name, o.total, o.status, o.created_at])
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">گزارش‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">گزارش فروش و عملکرد</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(presetLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <>
              <Input type="date" className="w-40" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              <Input type="date" className="w-40" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "کل فروش", value: formatPrice(stats?.total_sales ?? 0) },
          { label: "فروش خالص", value: formatPrice(stats?.net_sales ?? 0) },
          { label: "تعداد سفارش", value: formatNumber(stats?.order_count ?? 0) },
          { label: "میانگین سفارش", value: formatPrice(stats?.avg_order_value ?? 0) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              {isLoading ? <Skeleton className="mt-2 h-6 w-24" /> : <p className="mt-1 text-xl font-bold">{s.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales trend report */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>گزارش روزانه فروش</CardTitle>
            <CardDescription>روند فروش در بازه انتخابی</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportSales}>
            <Download className="size-4" /> خروجی CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>تاریخ</TableHead>
                <TableHead>فروش</TableHead>
                <TableHead>تعداد سفارش</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                ))
              ) : (stats?.sales_trend ?? []).length > 0 ? (
                (stats?.sales_trend ?? []).map((t) => (
                  <TableRow key={t.date}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(t.sales))}</TableCell>
                    <TableCell>{toPersianDigits(Number(t.orders))}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">داده‌ای موجود نیست</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Best sellers + Recent orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>پرفروش‌ترین محصولات</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportBestSellers}>
              <Download className="size-4" /> CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>محصول</TableHead>
                  <TableHead>فروش</TableHead>
                  <TableHead>درآمد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                ) : (stats?.best_sellers ?? []).length > 0 ? (
                  (stats?.best_sellers ?? []).map((s) => (
                    <TableRow key={s.product_id}>
                      <TableCell className="font-medium">{s.product_name}</TableCell>
                      <TableCell>{toPersianDigits(s.total_sold)}</TableCell>
                      <TableCell>{formatPrice(s.revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">داده‌ای موجود نیست</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>سفارش‌های اخیر</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportRecentOrders}>
              <Download className="size-4" /> CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مشتری</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                ) : (stats?.recent_orders ?? []).length > 0 ? (
                  (stats?.recent_orders ?? []).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.customer_name}</TableCell>
                      <TableCell>{formatPrice(o.total)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">داده‌ای موجود نیست</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

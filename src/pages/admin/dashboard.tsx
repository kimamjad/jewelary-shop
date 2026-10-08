import { useState } from "react"
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle, PackageX,
  Clock, TrendingUp,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useDashboardStats } from "@/hooks/use-admin"
import { type DateRangePreset } from "@/lib/api/admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatNumber, toPersianDigits, formatDate } from "@/lib/format"
import type { OrderStatus } from "@/types"

const presetLabels: Record<DateRangePreset, string> = {
  today: "امروز",
  yesterday: "دیروز",
  last_7_days: "۷ روز اخیر",
  last_30_days: "۳۰ روز اخیر",
  this_month: "این ماه",
  last_month: "ماه گذشته",
  this_year: "امسال",
  custom: "بازه دلخواه",
}

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "در انتظار", confirmed: "تایید شده", processing: "در حال پردازش",
  shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده", refunded: "بازگشت وجه",
}

const orderStatusBadges: Record<OrderStatus, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary", confirmed: "default", processing: "default",
  shipped: "default", delivered: "default", cancelled: "destructive", refunded: "destructive",
}

interface StatCardProps {
  title: string
  value: string
  icon: typeof DollarSign
  subtitle?: string
  isLoading?: boolean
}

function StatCard({ title, value, icon: Icon, subtitle, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-7 w-32" />
        ) : (
          <p className="mt-2 text-2xl font-bold">{value}</p>
        )}
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function AdminDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("last_30_days")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const { data: stats, isLoading } = useDashboardStats(preset, customStart, customEnd)

  const salesTrendData = (stats?.sales_trend ?? []).map((t) => ({
    date: t.date,
    sales: Number(t.sales),
    orders: Number(t.orders),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
          <p className="mt-1 text-sm text-muted-foreground">نمای کلی عملکرد فروشگاه</p>
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

      {/* Stat cards row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="کل فروش" value={isLoading ? "" : formatPrice(stats?.total_sales ?? 0)} icon={DollarSign} subtitle="در بازه انتخابی" isLoading={isLoading} />
        <StatCard title="فروش خالص" value={isLoading ? "" : formatPrice(stats?.net_sales ?? 0)} icon={TrendingUp} subtitle="کم از ارسال و تخفیف" isLoading={isLoading} />
        <StatCard title="تعداد سفارش‌ها" value={isLoading ? "" : formatNumber(stats?.order_count ?? 0)} icon={ShoppingCart} isLoading={isLoading} />
        <StatCard title="میانگین ارزش سفارش" value={isLoading ? "" : formatPrice(stats?.avg_order_value ?? 0)} icon={DollarSign} isLoading={isLoading} />
      </div>

      {/* Stat cards row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="تعداد مشتریان" value={isLoading ? "" : formatNumber(stats?.customer_count ?? 0)} icon={Users} isLoading={isLoading} />
        <StatCard title="تعداد محصولات" value={isLoading ? "" : formatNumber(stats?.product_count ?? 0)} icon={Package} isLoading={isLoading} />
        <StatCard
          title="موجودی کم"
          value={isLoading ? "" : formatNumber(stats?.low_stock_count ?? 0)}
          icon={AlertTriangle}
          subtitle="۱۰ عدد یا کمتر"
          isLoading={isLoading}
        />
        <StatCard
          title="ناموجود"
          value={isLoading ? "" : formatNumber(stats?.out_of_stock_count ?? 0)}
          icon={PackageX}
          isLoading={isLoading}
        />
      </div>

      {/* Pending orders alert */}
      {(stats?.pending_orders ?? 0) > 0 && (
        <Card className="border-amber-500/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="size-5 text-amber-500" />
            <p className="text-sm">
              <span className="font-bold">{toPersianDigits(stats?.pending_orders ?? 0)}</span> سفارش در انتظار تایید
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>روند فروش</CardTitle>
          <CardDescription>فروش و تعداد سفارش‌ها در بازه انتخابی</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesTrendData.length > 0 ? (
            <div className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesTrendData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="sales" name="فروش" type="monotone" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
          )}
        </CardContent>
      </Card>

      {/* Orders Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>روند سفارش‌ها</CardTitle>
          <CardDescription>تعداد سفارش‌های روزانه</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : salesTrendData.length > 0 ? (
            <div className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesTrendData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" name="سفارش‌ها" fill="var(--chart-2)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders + Best Sellers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>سفارش‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (stats?.recent_orders ?? []).length > 0 ? (
              (stats?.recent_orders ?? []).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={orderStatusBadges[order.status]}>{orderStatusLabels[order.status]}</Badge>
                    <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">سفارشی ثبت نشده است</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>پرفروش‌ترین محصولات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (stats?.best_sellers ?? []).length > 0 ? (
              (stats?.best_sellers ?? []).map((item, idx) => (
                <div key={item.product_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold shrink-0">
                      {toPersianDigits(idx + 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{toPersianDigits(item.total_sold)} عدد فروخته شده</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm shrink-0">{formatPrice(item.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">داده‌ای موجود نیست</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

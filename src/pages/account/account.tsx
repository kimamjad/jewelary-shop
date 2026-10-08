import { Link } from "react-router-dom"
import { Package, User, LogOut, ChevronLeft } from "lucide-react"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { useAuth } from "@/hooks/use-auth"
import { useUserOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatPrice, toPersianDigits, formatDate } from "@/lib/format"
import type { OrderStatus } from "@/types"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  refunded: "بازگشت وجه",
}

export function AccountPage() {
  useSEO({
    title: "حساب کاربری",
    description: "مدیریت حساب کاربری، سفارش‌ها و اطلاعات شخصی",
    canonical: `${SITE_URL}/account`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "حساب کاربری", url: `${SITE_URL}/account` },
    ]),
  })

  const { profile, signOut } = useAuth()
  const { data: orders, isLoading } = useUserOrders()

  const recentOrders = (orders ?? []).slice(0, 3)
  const totalOrders = orders?.length ?? 0
  const totalSpent = orders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">حساب کاربری</h1>
        <p className="mt-1 text-muted-foreground">
          خوش آمدید، {profile?.full_name ?? "کاربر گرامی"}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{toPersianDigits(totalOrders)}</p>
              <p className="text-xs text-muted-foreground">تعداد سفارش‌ها</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">مجموع خرید</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link to="/account/profile">
          <Card className="group transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <User className="size-5 text-primary" />
                <span className="font-medium">ویرایش پروفایل</span>
              </div>
              <ChevronLeft className="size-4 text-muted-foreground rtl:rotate-180 group-hover:-translate-x-1" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/account/orders">
          <Card className="group transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <Package className="size-5 text-primary" />
                <span className="font-medium">سفارش‌های من</span>
              </div>
              <ChevronLeft className="size-4 text-muted-foreground rtl:rotate-180 group-hover:-translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">سفارش‌های اخیر</CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/account/orders">
              مشاهده همه
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              شما هنوز سفارشی ثبت نکرده‌اید
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      سفارش {toPersianDigits(order.id.slice(0, 8))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{orderStatusLabels[order.status]}</Badge>
                    <span className="text-sm font-medium">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" className="gap-2" onClick={() => signOut()}>
          <LogOut className="size-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  )
}

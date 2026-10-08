import { Link } from "react-router-dom"
import { Package } from "lucide-react"
import { useUserOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { formatPrice, toPersianDigits, formatDate } from "@/lib/format"
import type { OrderStatus, PaymentStatus } from "@/types"

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  refunded: "بازگشت وجه",
}

const orderStatusVariants: Record<OrderStatus, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  failed: "پرداخت ناموفق",
  refunded: "بازگشت وجه",
}

export function OrdersPage() {
  const { data: orders, isLoading } = useUserOrders()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyMedia variant="icon"><Package className="size-12" /></EmptyMedia>
          <EmptyTitle>شما هنوز سفارشی ثبت نکرده‌اید</EmptyTitle>
          <EmptyDescription>سفارش‌های شما در این صفحه نمایش داده می‌شوند</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/shop">شروع خرید</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">سفارش‌های من</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  سفارش {toPersianDigits(order.id.slice(0, 8))}
                </CardTitle>
                <Badge variant={orderStatusVariants[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">وضعیت پرداخت</span>
                <Badge variant="outline">{paymentStatusLabels[order.payment_status]}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">هزینه ارسال</span>
                <span>{order.shipping_cost === 0 ? "رایگان" : formatPrice(order.shipping_cost)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-bold">
                <span>مبلغ کل</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

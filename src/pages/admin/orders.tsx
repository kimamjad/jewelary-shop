import { useState } from "react"
import { Package, Eye } from "lucide-react"
import { useAdminOrders, useUpdateOrderStatus, useUpdatePaymentStatus, useAdminOrder } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyMedia } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
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

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  failed: "پرداخت ناموفق",
  refunded: "بازگشت وجه",
}

const allStatuses: (OrderStatus | "all")[] = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]

export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data, isLoading } = useAdminOrders({ status: statusFilter, page, pageSize: 20 })
  const updateStatus = useUpdateOrderStatus()
  const updatePayment = useUpdatePaymentStatus()

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت سفارش‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مدیریت و پیگیری سفارش‌های فروشگاه
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">فیلتر:</span>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as OrderStatus | "all"); setPage(1) }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "همه سفارش‌ها" : orderStatusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12">
              <Empty>
                <EmptyMedia variant="icon"><Package className="size-12" /></EmptyMedia>
                <EmptyTitle>سفارشی یافت نشد</EmptyTitle>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره سفارش</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت سفارش</TableHead>
                  <TableHead>وضعیت پرداخت</TableHead>
                  <TableHead>مبلغ کل</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium" dir="ltr">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v as OrderStatus })}
                      >
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(orderStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.payment_status}
                        onValueChange={(v) => updatePayment.mutate({ id: order.id, status: v as PaymentStatus })}
                      >
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-bold">{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(order.id)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            بعدی
          </Button>
        </div>
      )}

      <OrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  )
}

function OrderDetailDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { data: order, isLoading } = useAdminOrder(orderId ?? "")

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>جزئیات سفارش</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : order ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">مشتری</p>
                <p className="font-medium">{order.customer_info?.full_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">شماره تماس</p>
                <p className="font-medium" dir="ltr">{order.customer_info?.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">استان</p>
                <p className="font-medium">{order.shipping_address?.province ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">شهر</p>
                <p className="font-medium">{order.shipping_address?.city ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">آدرس</p>
                <p className="font-medium">{order.shipping_address?.address ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">کد پستی</p>
                <p className="font-medium" dir="ltr">{order.shipping_address?.postal_code ?? "—"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">اقلام سفارش</h4>
              <div className="space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.product_name ?? "محصول"}</p>
                      <p className="text-muted-foreground">{toPersianDigits(item.quantity)} عدد × {formatPrice(item.unit_price)}</p>
                    </div>
                    <span className="font-bold">{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">هزینه ارسال</span>
                <span>{order.shipping_cost === 0 ? "رایگان" : formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>مبلغ کل</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">یادداشت</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">اطلاعات سفارش یافت نشد</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

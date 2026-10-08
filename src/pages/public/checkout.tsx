import { useState } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, ChevronLeft } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCartStore } from "@/store/cart-store"
import { useCreateOrder } from "@/hooks/use-orders"
import {
  checkoutSchema,
  shippingCosts,
  shippingLabels,
  paymentLabels,
  type CheckoutFormValues,
} from "@/lib/validators/checkout"
import { formatPrice, toPersianDigits } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import type { CustomerInfo, ShippingInfo } from "@/types"

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const createOrder = useCreateOrder()
  const [selectedShipping, setSelectedShipping] = useState<string>("post")

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      province: "",
      city: "",
      address: "",
      postal_code: "",
      shipping_method: "post",
      payment_method: "zarinpal",
      notes: "",
      accept_terms: false,
    },
  })

  const subtotal = getTotalPrice()
  const shippingCost = shippingCosts[selectedShipping] ?? 0
  const total = subtotal + shippingCost

  if (items.length === 0 && !createOrder.isSuccess) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyTitle>سبد خرید خالی است</EmptyTitle>
          <EmptyDescription>برای تسویه حساب ابتدا محصولاتی را به سبد خرید اضافه کنید</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/shop">مشاهده محصولات</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  if (createOrder.isSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">سفارش شما با موفقیت ثبت شد</h1>
            <p className="text-muted-foreground">
              شماره سفارش: {toPersianDigits(createOrder.data.order_id.slice(0, 8))}
            </p>
            <p className="text-muted-foreground">
              مبلغ کل: {formatPrice(createOrder.data.total)}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild>
                <Link to="/account/orders">مشاهده سفارش‌های من</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">ادامه خرید</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    const customerInfo: CustomerInfo = {
      full_name: values.full_name,
      phone: values.phone,
      email: values.email || null,
    }
    const shippingInfo: ShippingInfo = {
      province: values.province,
      city: values.city,
      address: values.address,
      postal_code: values.postal_code,
    }

    await createOrder.mutateAsync({
      items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      customer_info: customerInfo,
      shipping_info: shippingInfo,
      shipping_method: values.shipping_method,
      payment_method: values.payment_method,
      notes: values.notes || null,
    })

    clearCart()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/cart"><ChevronLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">تسویه حساب</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تماس</CardTitle>
              <CardDescription>اطلاعات تماس شما برای هماهنگی ارسال</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Controller
                name="full_name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>نام و نام خانوادگی</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>شماره موبایل</FieldLabel>
                    <Input {...field} id={field.name} dir="ltr" placeholder="09123456789" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor={field.name}>ایمیل (اختیاری)</FieldLabel>
                    <Input {...field} id={field.name} dir="ltr" value={field.value ?? ""} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آدرس ارسال</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Controller
                name="province"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>استان</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>شهر</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>آدرس کامل</FieldLabel>
                    <Textarea {...field} id={field.name} rows={3} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="postal_code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>کد پستی</FieldLabel>
                    <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روش ارسال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(shippingLabels).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={value}
                      checked={selectedShipping === value}
                      onChange={(e) => {
                        setSelectedShipping(e.target.value)
                        form.setValue("shipping_method", e.target.value as "post" | "tipax" | "pickup")
                      }}
                      className="size-4 accent-primary"
                    />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {shippingCosts[value] === 0 ? "رایگان" : formatPrice(shippingCosts[value])}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روش پرداخت</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="payment_method"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>یادداشت سفارش</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <Textarea {...field} id={field.name} rows={2} value={field.value ?? ""} placeholder="توضیحات اختیاری برای سفارش" />
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 text-sm">
                    <div className="size-12 shrink-0 overflow-hidden rounded border bg-muted">
                      {item.image && <img src={item.image} alt={item.name} className="size-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 font-medium">{item.name}</p>
                      <p className="text-muted-foreground">{toPersianDigits(item.quantity)} عدد</p>
                    </div>
                    <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">جمع کالاها</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هزینه ارسال</span>
                  <span>{shippingCost === 0 ? "رایگان" : formatPrice(shippingCost)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>قابل پرداخت</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Controller
                name="accept_terms"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground">
                        <Link to="/terms" className="text-primary underline">قوانین فروشگاه</Link> را مطالعه کرده و می‌پذیرم
                      </span>
                    </label>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={createOrder.isPending}>
                {createOrder.isPending ? "در حال ثبت..." : "ثبت سفارش"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

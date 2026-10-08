import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount } from "@/hooks/use-admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { formatPrice, toPersianDigits, formatDate } from "@/lib/format"
import type { Discount } from "@/types"

const discountSchema = z.object({
  code: z.string().min(2, "کد را وارد کنید"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(1, "مقدار باید بزرگتر از ۰ باشد"),
  min_order: z.number().optional(),
  max_uses: z.number().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
})

type DiscountFormValues = z.infer<typeof discountSchema>

export function AdminDiscountsPage() {
  const { data: discounts, isLoading } = useDiscounts()
  const createDiscount = useCreateDiscount()
  const updateDiscount = useUpdateDiscount()
  const deleteDiscount = useDeleteDiscount()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: { code: "", type: "percentage", value: 0, min_order: 0, max_uses: 0, expires_at: "", is_active: true },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset({ code: "", type: "percentage", value: 0, min_order: 0, max_uses: 0, expires_at: "", is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (d: Discount) => {
    setEditingId(d.id)
    form.reset({ code: d.code, type: d.type, value: d.value, min_order: d.min_order ?? 0, max_uses: d.max_uses ?? 0, expires_at: d.expires_at ?? "", is_active: d.is_active })
    setDialogOpen(true)
  }

  const onSubmit = async (values: DiscountFormValues) => {
    const payload = {
      code: values.code,
      type: values.type,
      value: values.value,
      min_order: values.min_order || null,
      max_uses: values.max_uses || null,
      expires_at: values.expires_at || null,
      is_active: values.is_active,
    }
    if (editingId) {
      await updateDiscount.mutateAsync({ id: editingId, updates: payload })
    } else {
      await createDiscount.mutateAsync(payload as Omit<Discount, "id" | "used_count">)
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تخفیف‌ها و کدهای تخفیف</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت کدهای تخفیف فروشگاه</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" /> کد جدید</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (discounts ?? []).length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">کد تخفیفی ثبت نشده است</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>مقدار</TableHead>
                  <TableHead>حداقل سفارش</TableHead>
                  <TableHead>استفاده شده</TableHead>
                  <TableHead>انقضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(discounts ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium" dir="ltr">{d.code}</TableCell>
                    <TableCell>{d.type === "percentage" ? "درصد" : "مبلغ ثابت"}</TableCell>
                    <TableCell>{d.type === "percentage" ? `${toPersianDigits(d.value)}٪` : formatPrice(d.value)}</TableCell>
                    <TableCell>{d.min_order ? formatPrice(d.min_order) : "—"}</TableCell>
                    <TableCell>{toPersianDigits(d.used_count)}{d.max_uses ? ` / ${toPersianDigits(d.max_uses)}` : ""}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.expires_at ? formatDate(d.expires_at) : "—"}</TableCell>
                    <TableCell><Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "فعال" : "غیرفعال"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(d)}><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => { if (confirm("حذف این کد تخفیف؟")) deleteDiscount.mutate(d.id) }}><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller name="code" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>کد</FieldLabel>
                <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="type" control={form.control} render={({ field }) => (
              <Field>
                <FieldLabel>نوع تخفیف</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">درصد</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )} />
            <Controller name="value" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>مقدار</FieldLabel>
                <Input id={field.name} type="number" dir="ltr" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="min_order" control={form.control} render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>حداقل مبلغ سفارش (اختیاری)</FieldLabel>
                <Input id={field.name} type="number" dir="ltr" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
              </Field>
            )} />
            <Controller name="max_uses" control={form.control} render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>حداکثر استفاده (اختیاری)</FieldLabel>
                <Input id={field.name} type="number" dir="ltr" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
              </Field>
            )} />
            <Controller name="expires_at" control={form.control} render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>تاریخ انقضا (اختیاری)</FieldLabel>
                <Input id={field.name} type="date" dir="ltr" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
              </Field>
            )} />
            <Controller name="is_active" control={form.control} render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                <span className="text-sm">کد فعال است</span>
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={createDiscount.isPending || updateDiscount.isPending}>ذخیره</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

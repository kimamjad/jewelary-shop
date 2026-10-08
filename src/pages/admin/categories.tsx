import { useState } from "react"
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-catalog"
import { categorySchema, type CategoryFormValues } from "@/lib/validators/product"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toPersianDigits } from "@/lib/format"
import type { Category } from "@/types"

export function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parent_id: null,
      description: "",
      image_url: null,
      is_active: true,
      sort_order: 0,
    },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset({
      name: "",
      slug: "",
      parent_id: null,
      description: "",
      image_url: null,
      is_active: true,
      sort_order: 0,
    })
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    form.reset({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      description: cat.description ?? "",
      image_url: cat.image_url,
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, input: values })
      } else {
        await createCategory.mutateAsync(values as Omit<Category, "id" | "created_at" | "deleted_at">)
      }
      setDialogOpen(false)
    } catch {
      // error handled by mutation toast
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟")) {
      deleteCategory.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories ? toPersianDigits(categories.length) : "—"} دسته‌بندی
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          دسته جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>اسلاگ</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (categories?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FolderTree className="mx-auto mb-2 size-8 opacity-50" />
                    دسته‌بندی‌ای یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{cat.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {cat.description ?? "—"}
                    </TableCell>
                    <TableCell>{toPersianDigits(cat.sort_order)}</TableCell>
                    <TableCell>
                      <Badge variant={cat.is_active ? "default" : "secondary"}>
                        {cat.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش دسته" : "دسته جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>نام</FieldLabel>
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>اسلاگ</FieldLabel>
                  <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>توضیحات</FieldLabel>
                  <Textarea {...field} id={field.name} rows={3} value={field.value ?? ""} />
                </Field>
              )}
            />
            <Controller
              name="sort_order"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ترتیب نمایش</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    dir="ltr"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="is_active"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>وضعیت</FieldLabel>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-muted-foreground">
                      {field.value ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </Field>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {createCategory.isPending || updateCategory.isPending ? "در حال ذخیره..." : "ذخیره"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

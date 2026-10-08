import { useState } from "react"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useAttributeGroups,
  useAttributes,
  useCreateAttributeGroup,
  useUpdateAttributeGroup,
  useDeleteAttributeGroup,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
} from "@/hooks/use-catalog"
import {
  attributeGroupSchema,
  attributeSchema,
  type AttributeGroupFormValues,
  type AttributeFormValues,
} from "@/lib/validators/product"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toPersianDigits } from "@/lib/format"
import type { AttributeGroup, Attribute, AttributeType } from "@/types"

const typeLabels: Record<AttributeType, string> = {
  text: "متن",
  number: "عدد",
  select: "انتخاب",
  boolean: "بله/خیر",
  color: "رنگ",
}

export function AdminAttributesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت ویژگی‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          گروه‌ها و ویژگی‌های محصولات را مدیریت کنید
        </p>
      </div>

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">گروه‌ها</TabsTrigger>
          <TabsTrigger value="attributes">ویژگی‌ها</TabsTrigger>
        </TabsList>
        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
        <TabsContent value="attributes">
          <AttributesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupsTab() {
  const { data: groups, isLoading } = useAttributeGroups()
  const createGroup = useCreateAttributeGroup()
  const updateGroup = useUpdateAttributeGroup()
  const deleteGroup = useDeleteAttributeGroup()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<AttributeGroupFormValues>({
    resolver: zodResolver(attributeGroupSchema),
    defaultValues: { name: "", slug: "", sort_order: 0 },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset({ name: "", slug: "", sort_order: 0 })
    setDialogOpen(true)
  }

  const openEdit = (group: AttributeGroup) => {
    setEditingId(group.id)
    form.reset({ name: group.name, slug: group.slug, sort_order: group.sort_order })
    setDialogOpen(true)
  }

  const onSubmit = async (values: AttributeGroupFormValues) => {
    try {
      if (editingId) {
        await updateGroup.mutateAsync({ id: editingId, input: values })
      } else {
        await createGroup.mutateAsync(values)
      }
      setDialogOpen(false)
    } catch {
      // error handled by toast
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("حذف این گروه باعث حذف تمام ویژگی‌های زیرمجموعه آن می‌شود. ادامه می‌دهید؟")) {
      deleteGroup.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          گروه جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>اسلاگ</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (groups?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    گروهی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                groups?.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{group.slug}</TableCell>
                    <TableCell>{toPersianDigits(group.sort_order)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-destructive">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش گروه" : "گروه جدید"}</DialogTitle>
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
              name="sort_order"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ترتیب</FieldLabel>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AttributesTab() {
  const { data: attributes, isLoading } = useAttributes()
  const { data: groups } = useAttributeGroups()
  const createAttr = useCreateAttribute()
  const updateAttr = useUpdateAttribute()
  const deleteAttr = useDeleteAttribute()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      group_id: "",
      name: "",
      slug: "",
      type: "text",
      unit: null,
      is_filterable: false,
      is_required: false,
      options: [],
      sort_order: 0,
    },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset({
      group_id: "",
      name: "",
      slug: "",
      type: "text",
      unit: null,
      is_filterable: false,
      is_required: false,
      options: [],
      sort_order: 0,
    })
    setDialogOpen(true)
  }

  const openEdit = (attr: Attribute) => {
    setEditingId(attr.id)
    form.reset({
      group_id: attr.group_id,
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      unit: attr.unit,
      is_filterable: attr.is_filterable,
      is_required: attr.is_required,
      options: attr.options,
      sort_order: attr.sort_order,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: AttributeFormValues) => {
    try {
      const input = {
        ...values,
        unit: values.unit ?? null,
        options: values.options ?? [],
      }
      if (editingId) {
        await updateAttr.mutateAsync({ id: editingId, input })
      } else {
        await createAttr.mutateAsync(input)
      }
      setDialogOpen(false)
    } catch {
      // error handled by toast
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این ویژگی مطمئن هستید؟")) {
      deleteAttr.mutate(id)
    }
  }

  const groupName = (groupId: string) =>
    groups?.find((g) => g.id === groupId)?.name ?? "—"

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          ویژگی جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>گروه</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>واحد</TableHead>
                <TableHead>فیلتر</TableHead>
                <TableHead>اجباری</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (attributes?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Tag className="mx-auto mb-2 size-8 opacity-50" />
                    ویژگی‌ای یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                attributes?.map((attr) => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {groupName(attr.group_id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabels[attr.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {attr.unit ?? "—"}
                    </TableCell>
                    <TableCell>
                      {attr.is_filterable ? (
                        <Badge>بله</Badge>
                      ) : (
                        <Badge variant="secondary">خیر</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {attr.is_required ? (
                        <Badge>بله</Badge>
                      ) : (
                        <Badge variant="secondary">خیر</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(attr)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(attr.id)} className="text-destructive">
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
            <DialogTitle>{editingId ? "ویرایش ویژگی" : "ویژگی جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="group_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>گروه</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="انتخاب گروه" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>نوع</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">متن</SelectItem>
                        <SelectItem value="number">عدد</SelectItem>
                        <SelectItem value="select">انتخاب</SelectItem>
                        <SelectItem value="boolean">بله/خیر</SelectItem>
                        <SelectItem value="color">رنگ</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="unit"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>واحد</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="is_filterable"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>قابلیت فیلتر</FieldLabel>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">{field.value ? "بله" : "خیر"}</span>
                    </div>
                  </Field>
                )}
              />
              <Controller
                name="is_required"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>اجباری</FieldLabel>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">{field.value ? "بله" : "خیر"}</span>
                    </div>
                  </Field>
                )}
              />
            </div>
            <Controller
              name="sort_order"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>ترتیب</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    dir="ltr"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </Field>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={createAttr.isPending || updateAttr.isPending}>
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

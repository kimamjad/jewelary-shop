import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Save, X, Plus, Trash2, Star, Image as ImageIcon } from "lucide-react"
import { productSchema, type ProductFormValues } from "@/lib/validators/product"
import {
  useCategories,
  useBrands,
  useCreateProduct,
  useUpdateProduct,
  useProduct,
  useAttributeGroups,
  useAttributes,
  useAddProductImages,
  useDeleteProductImage,
  useSetPrimaryImage,
  useSyncProductAttributes,
} from "@/hooks/use-catalog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Product, Attribute, ProductImage } from "@/types"

interface ProductFormProps {
  productId?: string
}

interface PendingImage {
  url: string
  alt_text: string
}

interface AttributeValueState {
  [attributeId: string]: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate()
  const isEdit = !!productId

  const { data: existingProduct, isLoading } = useProduct(productId ?? "")
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: attributeGroups } = useAttributeGroups()
  const { data: attributes } = useAttributes()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const addImages = useAddProductImages()
  const deleteImage = useDeleteProductImage()
  const setPrimary = useSetPrimaryImage()
  const syncAttributes = useSyncProductAttributes()

  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [imageAltInput, setImageAltInput] = useState("")
  const [attributeValues, setAttributeValues] = useState<AttributeValueState>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const nameInputRef = useRef<string>("")

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      brand_id: null,
      category_id: null,
      base_price: 0,
      sale_price: null,
      compare_at_price: null,
      cost_price: null,
      sku: "",
      stock_quantity: 0,
      status: "draft",
      visibility: "public",
      is_featured: false,
      weight_grams: null,
      meta_title: null,
      meta_description: null,
    },
  })

  useEffect(() => {
    if (existingProduct) {
      form.reset({
        name: existingProduct.name,
        slug: existingProduct.slug,
        description: existingProduct.description ?? "",
        short_description: existingProduct.short_description ?? "",
        brand_id: existingProduct.brand_id,
        category_id: existingProduct.category_id,
        base_price: existingProduct.base_price,
        sale_price: existingProduct.sale_price,
        compare_at_price: existingProduct.compare_at_price,
        cost_price: existingProduct.cost_price,
        sku: existingProduct.sku,
        stock_quantity: existingProduct.stock_quantity,
        status: existingProduct.status,
        visibility: existingProduct.visibility,
        is_featured: existingProduct.is_featured,
        weight_grams: existingProduct.weight_grams,
        meta_title: existingProduct.meta_title,
        meta_description: existingProduct.meta_description,
      })
      nameInputRef.current = existingProduct.name

      const existingAttrs: AttributeValueState = {}
      existingProduct.product_attributes?.forEach((pa) => {
        existingAttrs[pa.attribute_id] = pa.value
      })
      setAttributeValues(existingAttrs)
    }
  }, [existingProduct, form])

  const handleNameChange = (value: string, onChange: (v: string) => void) => {
    onChange(value)
    nameInputRef.current = value
    if (!slugManuallyEdited) {
      const generated = generateSlugSync(value)
      form.setValue("slug", generated)
    }
  }

  const handleSlugChange = (value: string, onChange: (v: string) => void) => {
    onChange(value)
    setSlugManuallyEdited(value.length > 0)
  }

  const addPendingImage = () => {
    if (!imageUrlInput.trim()) return
    setPendingImages([...pendingImages, { url: imageUrlInput.trim(), alt_text: imageAltInput.trim() }])
    setImageUrlInput("")
    setImageAltInput("")
  }

  const removePendingImage = (index: number) => {
    setPendingImages(pendingImages.filter((_, i) => i !== index))
  }

  const handleDeleteExistingImage = (image: ProductImage) => {
    if (!productId) return
    if (confirm("حذف این تصویر؟")) {
      deleteImage.mutate({ imageId: image.id, productId })
    }
  }

  const handleSetPrimaryImage = (image: ProductImage) => {
    if (!productId) return
    setPrimary.mutate({ productId, imageId: image.id })
  }

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [attributeId]: value }))
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      let savedProductId = productId

      if (isEdit && productId) {
        await updateProduct.mutateAsync({ id: productId, input: values })
      } else {
        const created = await createProduct.mutateAsync(
          values as Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at">
        )
        savedProductId = created.id
      }

      if (savedProductId) {
        if (pendingImages.length > 0) {
          await addImages.mutateAsync({
            productId: savedProductId,
            images: pendingImages.map((img, idx) => ({
              url: img.url,
              alt_text: img.alt_text || null,
              sort_order: idx,
              is_primary: idx === 0 && !existingProduct?.images?.length,
            })),
          })
        }

        const attrEntries = Object.entries(attributeValues).filter(([, v]) => v.trim())
        if (attrEntries.length > 0 || isEdit) {
          await syncAttributes.mutateAsync({
            productId: savedProductId,
            attributes: attrEntries.map(([attribute_id, value]) => ({ attribute_id, value })),
          })
        }
      }

      navigate("/admin/products")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره محصول")
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const groupedAttributes = (attributeGroups ?? []).map((group) => ({
    group,
    items: (attributes ?? []).filter((a) => a.group_id === group.id),
  }))

  const existingImages = existingProduct?.images ?? []

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "ویرایش محصول" : "محصول جدید"}
        </h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
            <X className="size-4" />
            انصراف
          </Button>
          <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
            <Save className="size-4" />
            {createProduct.isPending || updateProduct.isPending ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">اطلاعات کلی</TabsTrigger>
          <TabsTrigger value="pricing">قیمت و موجودی</TabsTrigger>
          <TabsTrigger value="images">تصاویر</TabsTrigger>
          <TabsTrigger value="attributes">ویژگی‌ها</TabsTrigger>
          <TabsTrigger value="seo">سئو</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات پایه</CardTitle>
              <CardDescription>نام، توضیحات و دسته‌بندی محصول</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>نام محصول</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>اسلاگ (URL)</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      dir="ltr"
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => handleSlugChange(e.target.value, field.onChange)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="short_description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>توضیح کوتاه</FieldLabel>
                    <Textarea {...field} id={field.name} rows={2} />
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>توضیحات کامل</FieldLabel>
                    <Textarea {...field} id={field.name} rows={6} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>دسته‌بندی و برند</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Controller
                name="category_id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>دسته‌بندی</FieldLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب دسته" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون دسته</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="brand_id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>برند</FieldLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب برند" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون برند</SelectItem>
                        {brands?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قیمت‌گذاری</CardTitle>
              <CardDescription>قیمت پایه، قیمت فروش و قیمت مقایسه</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Controller
                name="base_price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>قیمت پایه (تومان)</FieldLabel>
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
                name="sale_price"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>قیمت فروش</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      dir="ltr"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </Field>
                )}
              />
              <Controller
                name="compare_at_price"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>قیمت مقایسه</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      dir="ltr"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </Field>
                )}
              />
              <Controller
                name="cost_price"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>قیمت خرید</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      dir="ltr"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>موجودی و وضعیت</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Controller
                name="sku"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>SKU</FieldLabel>
                    <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stock_quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>موجودی</FieldLabel>
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
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>وضعیت</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">پیش‌نویس</SelectItem>
                        <SelectItem value="published">منتشر شده</SelectItem>
                        <SelectItem value="archived">آرشیو شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="visibility"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>نمایش</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">عمومی</SelectItem>
                        <SelectItem value="hidden">مخفی</SelectItem>
                        <SelectItem value="members_only">فقط اعضا</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="weight_grams"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>وزن (گرم)</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      step="0.01"
                      dir="ltr"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </Field>
                )}
              />
              <Controller
                name="is_featured"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>محصول ویژه</FieldLabel>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "بله" : "خیر"}
                      </span>
                    </div>
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تصاویر محصول</CardTitle>
              <CardDescription>
                {isEdit
                  ? "تصاویر موجود را مدیریت کنید یا تصویر جدید اضافه کنید"
                  : "آدرس تصاویر را وارد کنید. تصاویر پس از ذخیره محصول اضافه می‌شوند."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">تصاویر موجود</h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {existingImages.map((img) => (
                      <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                        <img
                          src={img.url}
                          alt={img.alt_text ?? ""}
                          className="aspect-square w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white hover:text-yellow-400"
                            onClick={() => handleSetPrimaryImage(img)}
                            title="تنظیم به‌عنوان تصویر اصلی"
                          >
                            <Star className={`size-4 ${img.is_primary ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white hover:text-red-400"
                            onClick={() => handleDeleteExistingImage(img)}
                            title="حذف تصویر"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {img.is_primary && (
                          <Badge className="absolute right-1 top-1 text-[10px]">اصلی</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">افزودن تصویر جدید</h4>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-3">
                    <Field>
                      <FieldLabel htmlFor="image-url">آدرس تصویر</FieldLabel>
                      <Input
                        id="image-url"
                        dir="ltr"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="image-alt">متن جایگزین (اختیاری)</FieldLabel>
                      <Input
                        id="image-alt"
                        placeholder="توضیح تصویر"
                        value={imageAltInput}
                        onChange={(e) => setImageAltInput(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Button type="button" variant="outline" onClick={addPendingImage} disabled={!imageUrlInput.trim()}>
                    <Plus className="size-4" />
                    افزودن
                  </Button>
                </div>

                {pendingImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {pendingImages.map((img, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-lg border">
                        <img src={img.url} alt={img.alt_text} className="aspect-square w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-end bg-black/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white hover:text-red-400"
                            onClick={() => removePendingImage(idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {idx === 0 && existingImages.length === 0 && (
                          <Badge className="absolute right-1 top-1 text-[10px]">اصلی</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {existingImages.length === 0 && pendingImages.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                    <ImageIcon className="mb-2 size-8 opacity-50" />
                    <p className="text-sm">هنوز تصویری اضافه نشده است</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ویژگی‌های محصول</CardTitle>
              <CardDescription>
                ویژگی‌های محصول را بر اساس گروه‌ها پر کنید. این مقادیر در صفحه محصول نمایش داده می‌شوند.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedAttributes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">هنوز گروه ویژگی‌ای تعریف نشده است.</p>
                  <Button asChild variant="outline" className="mt-3" size="sm">
                    <a href="/admin/attributes">تعریف ویژگی‌ها</a>
                  </Button>
                </div>
              ) : (
                groupedAttributes.map(({ group, items }) => (
                  items.length > 0 && (
                    <div key={group.id} className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold">{group.name}</h4>
                        <Separator className="mt-2" />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {items.map((attr) => (
                          <AttributeInput
                            key={attr.id}
                            attribute={attr}
                            value={attributeValues[attr.id] ?? ""}
                            onChange={(v) => handleAttributeChange(attr.id, v)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>بهینه‌سازی موتور جستجو</CardTitle>
              <CardDescription>عنوان و توضیحات متا برای سئو</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="meta_title"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>عنوان متا</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </Field>
                )}
              />
              <Controller
                name="meta_description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>توضیحات متا</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}

function AttributeInput({
  attribute,
  value,
  onChange,
}: {
  attribute: Attribute
  value: string
  onChange: (value: string) => void
}) {
  const label = attribute.unit ? `${attribute.name} (${attribute.unit})` : attribute.name

  if (attribute.type === "select") {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {attribute.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    )
  }

  if (attribute.type === "boolean") {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-2 pt-2">
          <Switch checked={value === "true"} onCheckedChange={(checked) => onChange(checked ? "true" : "false")} />
          <span className="text-sm text-muted-foreground">{value === "true" ? "بله" : "خیر"}</span>
        </div>
      </Field>
    )
  }

  if (attribute.type === "color") {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="size-10 cursor-pointer rounded-md border"
          />
          <Input
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
          />
        </div>
      </Field>
    )
  }

  return (
    <Field>
      <FieldLabel htmlFor={`attr-${attribute.id}`}>{label}</FieldLabel>
      <Input
        id={`attr-${attribute.id}`}
        dir={attribute.type === "number" ? "ltr" : undefined}
        type={attribute.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={attribute.is_required ? "الزامی" : "اختیاری"}
      />
    </Field>
  )
}

function generateSlugSync(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plus, Pencil, Trash2, Eye, Save, X } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  useAdminPosts,
  useAdminPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  useSyncPostTags,
  useBlogCategories,
  useBlogTags,
  useCreateBlogTag,
} from "@/hooks/use-blog"
import { useAuth } from "@/hooks/use-auth"
import { blogPostSchema, type BlogPostFormValues } from "@/lib/validators/blog"
import { generateSlug, estimateReadingTime } from "@/lib/api/blog"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/format"
import type { BlogPost, BlogPostStatus } from "@/types"

const statusLabels: Record<BlogPostStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشر شده",
  scheduled: "زمان‌بندی شده",
}

const statusBadges: Record<BlogPostStatus, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  published: "default",
  scheduled: "outline",
}

export function AdminBlogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | "all">("all")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const { data, isLoading } = useAdminPosts({ page, pageSize: 20, status: statusFilter, search })
  const { user } = useAuth()
  const { data: categories } = useBlogCategories()
  const { data: allTags } = useBlogTags()
  const createPost = useCreateBlogPost()
  const updatePost = useUpdateBlogPost()
  const deletePost = useDeleteBlogPost()
  const syncTags = useSyncPostTags()
  const createTag = useCreateBlogTag()

  const { data: editingPost } = useAdminPost(editingId ?? undefined)

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "", slug: "", content: "", excerpt: "", category_id: null,
      status: "draft", featured_image: null, meta_title: null, meta_description: null,
      canonical_url: null, og_image: null, reading_time_minutes: null,
      published_at: null, tag_ids: [],
    },
  })

  useEffect(() => {
    if (editingPost && editingId) {
      form.reset({
        title: editingPost.title,
        slug: editingPost.slug,
        content: editingPost.content,
        excerpt: editingPost.excerpt ?? "",
        category_id: editingPost.category_id,
        status: editingPost.status,
        featured_image: editingPost.featured_image,
        meta_title: editingPost.meta_title,
        meta_description: editingPost.meta_description,
        canonical_url: editingPost.canonical_url,
        og_image: editingPost.og_image,
        reading_time_minutes: editingPost.reading_time_minutes,
        published_at: editingPost.published_at,
        tag_ids: editingPost.tags.map((t) => t.id),
      })
    }
  }, [editingPost, editingId, form])

  const openCreate = () => {
    setEditingId(null)
    setPreviewMode(false)
    form.reset({
      title: "", slug: "", content: "", excerpt: "", category_id: null,
      status: "draft", featured_image: null, meta_title: null, meta_description: null,
      canonical_url: null, og_image: null, reading_time_minutes: null,
      published_at: null, tag_ids: [],
    })
    setEditorOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setPreviewMode(false)
    setEditorOpen(true)
  }

  const onSubmit = async (values: BlogPostFormValues) => {
    const readingTime = estimateReadingTime(values.content)
    const publishedAt = values.status === "published" && !values.published_at
      ? new Date().toISOString()
      : values.published_at

    const payload = {
      title: values.title,
      slug: values.slug,
      content: values.content,
      excerpt: values.excerpt || null,
      category_id: values.category_id || null,
      status: values.status,
      featured_image: values.featured_image || null,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
      canonical_url: values.canonical_url || null,
      og_image: values.og_image || null,
      reading_time_minutes: readingTime,
      published_at: publishedAt || null,
    }

    if (editingId) {
      await updatePost.mutateAsync({ id: editingId, updates: payload })
      if (values.tag_ids) await syncTags.mutateAsync({ postId: editingId, tagIds: values.tag_ids })
    } else {
      if (!user) { toast.error("کاربر وارد نشده است"); return }
      const created = await createPost.mutateAsync({ ...payload, author_id: user.id })
      if (values.tag_ids) await syncTags.mutateAsync({ postId: created.id, tagIds: values.tag_ids })
    }
    setEditorOpen(false)
  }

  const handleAddTag = async () => {
    const name = prompt("نام برچسب:")
    if (!name) return
    const slug = generateSlug(name)
    await createTag.mutateAsync({ name, slug })
  }

  const columns: Column<BlogPost>[] = [
    { key: "title", header: "عنوان", sortable: true, accessor: (r) => r.title, exportValue: (r) => r.title },
    {
      key: "status",
      header: "وضعیت",
      sortable: true,
      accessor: (r) => <Badge variant={statusBadges[r.status]}>{statusLabels[r.status]}</Badge>,
      exportValue: (r) => r.status,
    },
    {
      key: "published_at",
      header: "تاریخ انتشار",
      sortable: true,
      accessor: (r) => r.published_at ? formatDate(r.published_at) : "—",
      exportValue: (r) => r.published_at ?? "",
    },
    {
      key: "actions",
      header: "عملیات",
      hideable: false,
      accessor: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link to={`/blog/${r.slug}`} target="_blank"><Eye className="size-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(r.id)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="size-8 text-destructive"
            onClick={() => { if (confirm("حذف این مقاله؟")) deletePost.mutate(r.id) }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت وبلاگ</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و انتشار مقالات</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" /> مقاله جدید</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="جستجوی مقاله..." className="max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as BlogPostStatus | "all"); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="draft">پیش‌نویس</SelectItem>
            <SelectItem value="published">منتشر شده</SelectItem>
            <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable
              data={data?.posts ?? []}
              columns={columns}
              getRowId={(r) => r.id}
              enableExport
              exportFilename="blog-posts.csv"
              emptyMessage="مقاله‌ای یافت نشد"
            />
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "ویرایش مقاله" : "مقاله جدید"}</DialogTitle>
          </DialogHeader>

          {editingId && !editingPost ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs value={previewMode ? "preview" : "edit"} onValueChange={(v) => setPreviewMode(v === "preview")}>
                <TabsList>
                  <TabsTrigger value="edit">ویرایش</TabsTrigger>
                  <TabsTrigger value="preview">پیش‌نمایش</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  {/* Title + Slug */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller name="title" control={form.control} render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>عنوان</FieldLabel>
                        <Input {...field} id={field.name} aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur()
                            if (!form.getValues("slug")) form.setValue("slug", generateSlug(e.target.value))
                          }}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                    <Controller name="slug" control={form.control} render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>اسلاگ (URL)</FieldLabel>
                        <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                  </div>

                  {/* Excerpt */}
                  <Controller name="excerpt" control={form.control} render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>خلاصه</FieldLabel>
                      <Textarea {...field} id={field.name} rows={2} value={field.value ?? ""} />
                    </Field>
                  )} />

                  {/* Content */}
                  <Controller name="content" control={form.control} render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>محتوا (HTML)</FieldLabel>
                      <Textarea {...field} id={field.name} rows={10} dir="rtl" className="font-mono text-sm" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )} />

                  {/* Status + Category */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller name="status" control={form.control} render={({ field }) => (
                      <Field>
                        <FieldLabel>وضعیت</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">پیش‌نویس</SelectItem>
                            <SelectItem value="published">منتشر شده</SelectItem>
                            <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )} />
                    <Controller name="category_id" control={form.control} render={({ field }) => (
                      <Field>
                        <FieldLabel>دسته‌بندی</FieldLabel>
                        <Select value={field.value ?? "__none"} onValueChange={(v) => field.onChange(v === "__none" ? null : v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">بدون دسته</SelectItem>
                            {(categories ?? []).map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )} />
                  </div>

                  {/* Tags */}
                  <Controller name="tag_ids" control={form.control} render={({ field }) => (
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel>برچسب‌ها</FieldLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAddTag}>
                          <Plus className="size-3" /> برچسب جدید
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                        {(allTags ?? []).map((tag) => {
                          const checked = (field.value ?? []).includes(tag.id)
                          return (
                            <label key={tag.id} className="flex items-center gap-1.5 cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const current = field.value ?? []
                                  if (v) field.onChange([...current, tag.id])
                                  else field.onChange(current.filter((id: string) => id !== tag.id))
                                }}
                              />
                              <span className="text-sm">{tag.name}</span>
                            </label>
                          )
                        })}
                        {(allTags ?? []).length === 0 && (
                          <p className="text-sm text-muted-foreground">برچسبی موجود نیست</p>
                        )}
                      </div>
                    </Field>
                  )} />

                  {/* Featured image */}
                  <Controller name="featured_image" control={form.control} render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>تصویر شاخص (URL)</FieldLabel>
                      <Input id={field.name} dir="ltr" value={field.value ?? ""} onChange={field.onChange} placeholder="https://..." />
                    </Field>
                  )} />

                  <Separator />

                  {/* SEO Section */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">تنظیمات سئو</h3>
                    <Controller name="meta_title" control={form.control} render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>عنوان سئو (حداکثر ۶۰ کاراکتر)</FieldLabel>
                        <Input id={field.name} value={field.value ?? ""} onChange={field.onChange} maxLength={60} placeholder="عنوان برای موتورهای جستجو" />
                      </Field>
                    )} />
                    <Controller name="meta_description" control={form.control} render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>توضیحات سئو (حداکثر ۱۶۰ کاراکتر)</FieldLabel>
                        <Textarea id={field.name} value={field.value ?? ""} onChange={field.onChange} maxLength={160} rows={2} placeholder="توضیحات متا" />
                      </Field>
                    )} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller name="canonical_url" control={form.control} render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Canonical URL</FieldLabel>
                          <Input id={field.name} dir="ltr" value={field.value ?? ""} onChange={field.onChange} placeholder="https://..." />
                        </Field>
                      )} />
                      <Controller name="og_image" control={form.control} render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>تصویر Open Graph</FieldLabel>
                          <Input id={field.name} dir="ltr" value={field.value ?? ""} onChange={field.onChange} placeholder="https://..." />
                        </Field>
                      )} />
                    </div>
                  </div>

                  <Separator />

                  {/* Publish date */}
                  <Controller name="published_at" control={form.control} render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>تاریخ انتشار (برای زمان‌بندی)</FieldLabel>
                      <Input id={field.name} type="datetime-local" dir="ltr" value={field.value ? field.value.slice(0, 16) : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
                    </Field>
                  )} />
                </TabsContent>

                <TabsContent value="preview">
                  <div className="rounded-lg border p-6">
                    <h1 className="text-2xl font-bold mb-2">{form.watch("title") || "عنوان مقاله"}</h1>
                    {form.watch("excerpt") && <p className="text-muted-foreground mb-4">{form.watch("excerpt")}</p>}
                    {form.watch("featured_image") && (
                      <img src={form.watch("featured_image")!} alt="" className="w-full rounded-lg mb-4" />
                    )}
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: form.watch("content") || "<p>محتوای مقاله...</p>" }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                  <X className="size-4" /> انصراف
                </Button>
                <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                  <Save className="size-4" /> ذخیره
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



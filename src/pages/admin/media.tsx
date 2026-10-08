import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Upload, Trash2, Search, Image as ImageIcon, Loader2 } from "lucide-react"
import { useSEO } from "@/hooks/use-seo"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { toPersianDigits } from "@/lib/format"

interface MediaItem {
  id: string
  url: string
  alt_text: string | null
  product_id: string | null
  is_primary: boolean
  created_at: string
}

const PAGE_SIZE = 24

export function AdminMediaPage() {
  useSEO({ title: "مدیریت رسانه", description: "آپلود و مدیریت تصاویر محصولات" })

  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["media", search, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from("product_images")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })

      if (search.trim()) {
        query = query.or(`url.ilike.%${search.trim()}%,alt_text.ilike.%${search.trim()}%`)
      }

      query = query.range(from, to)
      const { data, error, count } = await query
      if (error) throw error
      return { items: (data ?? []) as MediaItem[], total: count ?? 0 }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_images").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success("تصویر حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName)

        const { error: dbError } = await supabase.from("product_images").insert({
          url: urlData.publicUrl,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          sort_order: 0,
          is_primary: false,
        })
        if (dbError) throw dbError
      }
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success(`${toPersianDigits(files.length)} تصویر آپلود شد`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در آپلود")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت رسانه</h1>
          <p className="mt-1 text-muted-foreground">
            {total > 0 ? `${toPersianDigits(total)} تصویر` : "آپلود و مدیریت تصاویر"}
          </p>
        </div>
        <div>
          <Button asChild className="gap-2 cursor-pointer">
            <label className="cursor-pointer">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "در حال آپلود..." : "آپلود تصویر"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجوی تصاویر..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pr-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty className="py-16">
          <EmptyMedia variant="icon"><ImageIcon className="size-12" /></EmptyMedia>
          <EmptyTitle>هیچ تصویری موجود نیست</EmptyTitle>
          <EmptyDescription>
            {search ? "نتیجه‌ای یافت نشد" : "برای شروع، تصاویر محصولات را آپلود کنید"}
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item) => (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={item.url}
                    alt={item.alt_text ?? ""}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {item.is_primary && (
                    <span className="absolute right-2 top-2 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      اصلی
                    </span>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="truncate text-xs text-muted-foreground" title={item.alt_text ?? ""}>
                    {item.alt_text ?? "بدون عنوان"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground">
                {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

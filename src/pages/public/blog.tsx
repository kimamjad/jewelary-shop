import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Calendar, Clock, Search, Tag } from "lucide-react"
import { usePublishedPosts, useBlogCategories, useBlogTags } from "@/hooks/use-blog"
import { useSEO, buildWebsiteStructuredData, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { formatDate, toPersianDigits } from "@/lib/format"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const categoryId = searchParams.get("category") ?? undefined
  const tagId = searchParams.get("tag") ?? undefined
  const page = parseInt(searchParams.get("page") ?? "1", 10)

  useSEO({
    title: "وبلاگ",
    description: "مقالات و راهنماهای دنیای جواهرات و سنگ‌های قیمتی",
    canonical: `${SITE_URL}/blog`,
    ogType: "website",
    structuredData: [
      buildWebsiteStructuredData(SITE_URL),
      buildBreadcrumbStructuredData([
        { name: "خانه", url: SITE_URL },
        { name: "وبلاگ", url: `${SITE_URL}/blog` },
      ]),
    ],
  })

  const { data, isLoading } = usePublishedPosts({ page, pageSize: 9, categoryId, tagId, search })
  const { data: categories } = useBlogCategories()
  const { data: tags } = useBlogTags()

  const totalPages = Math.ceil((data?.total ?? 0) / 9)

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete("page")
    setSearchParams(next)
  }

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    next.set("page", String(p))
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">وبلاگ</h1>
        <p className="mt-2 text-muted-foreground">مقالات و راهنماهای دنیای جواهرات و سنگ‌های قیمتی</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="جستجوی مقاله..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category filter chips */}
      {(categories ?? []).length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <Button
            variant={!categoryId ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("category", null)}
          >
            همه
          </Button>
          {(categories ?? []).map((cat) => (
            <Button
              key={cat.id}
              variant={categoryId === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("category", cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {/* Posts grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (data?.posts ?? []).length === 0 ? (
        <Empty className="py-16">
          <EmptyTitle>مقاله‌ای یافت نشد</EmptyTitle>
          <EmptyDescription>برای این فیلتر مقاله‌ای موجود نیست</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.posts ?? []).map((post) => (
            <Card key={post.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <Link to={`/blog/${post.slug}`}>
                <div className="aspect-video bg-muted overflow-hidden">
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Tag className="size-8" />
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4 space-y-2">
                {post.category && (
                  <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                )}
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  {post.reading_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {toPersianDigits(post.reading_time_minutes)} دقیقه
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            قبلی
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            بعدی
          </Button>
        </div>
      )}

      {/* Tags */}
      {(tags ?? []).length > 0 && (
        <div className="mt-12 border-t pt-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">برچسب‌ها</h3>
          <div className="flex flex-wrap gap-2">
            {(tags ?? []).map((tag) => (
              <Link key={tag.id} to={`/blog?tag=${tag.id}`}>
                <Badge
                  variant={tagId === tag.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

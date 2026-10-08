import { useParams, Link } from "react-router-dom"
import { Calendar, Clock, ChevronLeft, Tag } from "lucide-react"
import { usePostBySlug, useRelatedPosts } from "@/hooks/use-blog"
import {
  useSEO,
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
} from "@/hooks/use-seo"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { formatDate, toPersianDigits } from "@/lib/format"
import type { BlogPostListItem } from "@/types"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading } = usePostBySlug(slug)
  const { data: related } = useRelatedPosts(post?.id, post?.category_id ?? null)

  const ogImage = post?.og_image ?? post?.featured_image ?? undefined
  const canonical = post?.canonical_url ?? `${SITE_URL}/blog/${slug}`

  useSEO({
    title: post?.meta_title ?? post?.title,
    description: post?.meta_description ?? post?.excerpt ?? "",
    canonical,
    ogType: "article",
    ogImage,
    structuredData: post
      ? [
          buildBreadcrumbStructuredData([
            { name: "خانه", url: SITE_URL },
            { name: "وبلاگ", url: `${SITE_URL}/blog` },
            { name: post.title, url: canonical },
          ]),
          buildArticleStructuredData({
            title: post.title,
            description: post.excerpt ?? "",
            image: ogImage,
            author: post.author?.full_name ?? "ناشناس",
            datePublished: post.published_at ?? post.created_at,
            url: canonical,
            section: post.category?.name,
          }),
        ]
      : undefined,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="mb-6 h-4 w-1/2" />
        <Skeleton className="aspect-video w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty>
          <EmptyTitle>مقاله یافت نشد</EmptyTitle>
          <EmptyDescription>این مقاله وجود ندارد یا منتشر نشده است</EmptyDescription>
          <EmptyContent>
            <Button asChild><Link to="/blog">بازگشت به وبلاگ</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/blog"><ChevronLeft className="size-4" /> وبلاگ</Link>
        </Button>
        {post.category && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{post.category.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <header className="mb-6 space-y-3">
        {post.category && (
          <Badge variant="secondary">{post.category.name}</Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-balance">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{post.author?.full_name ?? "ناشناس"}</span>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(post.published_at)}
            </span>
          )}
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {toPersianDigits(post.reading_time_minutes)} دقیقه مطالعه
            </span>
          )}
        </div>
      </header>

      {/* Featured image */}
      {(post.featured_image || post.og_image) && (
        <div className="mb-6 overflow-hidden rounded-lg">
          <img
            src={post.featured_image ?? post.og_image ?? ""}
            alt={post.title}
            className="w-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:leading-7 prose-a:text-primary prose-img:rounded-lg"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag.id} to={`/blog?tag=${tag.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                <Tag className="size-3 ml-1" />
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <Separator className="my-8" />

      {/* Related posts */}
      {(related ?? []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">مقالات مرتبط</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(related as BlogPostListItem[]).map((rp) => (
              <Card key={rp.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <Link to={`/blog/${rp.slug}`}>
                  <div className="aspect-video bg-muted overflow-hidden">
                    {rp.featured_image ? (
                      <img
                        src={rp.featured_image}
                        alt={rp.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Tag className="size-6" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-3">
                  <Link to={`/blog/${rp.slug}`}>
                    <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

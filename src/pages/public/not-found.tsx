import { Link } from "react-router-dom"
import { Home, Search } from "lucide-react"
import { useSEO } from "@/hooks/use-seo"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  useSEO({ title: "صفحه یافت نشد", noindex: true })

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-extrabold text-primary">۴۰۴</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">صفحه یافت نشد</h1>
      <p className="mt-2 text-muted-foreground">
        صفحه مورد نظر شما وجود ندارد یا منتقل شده است
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild className="gap-2">
          <Link to="/">
            <Home className="size-4" />
            بازگشت به خانه
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/shop">
            <Search className="size-4" />
            جستجوی محصولات
          </Link>
        </Button>
      </div>
    </div>
  )
}

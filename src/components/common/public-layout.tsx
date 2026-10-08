import { Outlet, Link } from "react-router-dom"
import { ShoppingCart, Heart, User, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { useUIStore } from "@/store/ui-store"

export function PublicLayout() {
  const totalItems = useCartStore((s) => s.getTotalItems())
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <Link to="/" className="text-xl font-bold tracking-tight">
              جواهر
            </Link>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-medium hover:text-primary">
              خانه
            </Link>
            <Link to="/shop" className="text-sm font-medium hover:text-primary">
              فروشگاه
            </Link>
            <Link to="/blog" className="text-sm font-medium hover:text-primary">
              وبلاگ
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary">
              درباره ما
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary">
              تماس با ما
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/search">
                <Search className="size-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/wishlist">
                <Heart className="size-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="size-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -left-1 size-5 justify-center p-0 text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/account">
                <User className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold">جواهر</h3>
              <p className="text-sm text-muted-foreground">
                فروشگاه آنلاین انگشتر و سنگ‌های قیمتی
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">دسترسی سریع</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/shop">فروشگاه</Link></li>
                <li><Link to="/blog">وبلاگ</Link></li>
                <li><Link to="/about">درباره ما</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">پشتیبانی</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/contact">تماس با ما</Link></li>
                <li><Link to="/faq">سوالات متداول</Link></li>
                <li><Link to="/terms">قوانین</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">حریم خصوصی</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy">حریم خصوصی</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            © ۱۴۰۴ جواهر. تمام حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  )
}

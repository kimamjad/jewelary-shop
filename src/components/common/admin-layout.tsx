import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Package, ShoppingBag, Users, FileText, Settings, LogOut,
  Tags, Boxes, ClipboardList, Percent, Image, BarChart3, Shield, ScrollText,
  Menu, ChevronLeft, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { usePermission } from "@/hooks/use-admin"
import { cn } from "@/lib/utils"
import type { PermissionName } from "@/types"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  permission: PermissionName
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "اصلی",
    items: [
      { to: "/admin", label: "داشبورد", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    label: "کاتالوگ",
    items: [
      { to: "/admin/products", label: "محصولات", icon: Package, permission: "products.view" },
      { to: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags, permission: "categories.manage" },
      { to: "/admin/attributes", label: "ویژگی‌ها", icon: Boxes, permission: "attributes.manage" },
      { to: "/admin/inventory", label: "موجودی", icon: ClipboardList, permission: "inventory.view" },
    ],
  },
  {
    label: "فروش",
    items: [
      { to: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag, permission: "orders.view" },
      { to: "/admin/customers", label: "مشتریان", icon: Users, permission: "customers.view" },
      { to: "/admin/discounts", label: "تخفیف‌ها", icon: Percent, permission: "discounts.manage" },
    ],
  },
  {
    label: "محتوا",
    items: [
      { to: "/admin/blog", label: "وبلاگ", icon: FileText, permission: "blog.manage" },
      { to: "/admin/media", label: "رسانه", icon: Image, permission: "media.manage" },
    ],
  },
  {
    label: "گزارش‌ها",
    items: [
      { to: "/admin/reports", label: "گزارش‌ها", icon: BarChart3, permission: "reports.view" },
      { to: "/admin/activity-logs", label: "لاگ فعالیت", icon: ScrollText, permission: "activity_logs.view" },
    ],
  },
  {
    label: "سیستم",
    items: [
      { to: "/admin/users", label: "کاربران", icon: Users, permission: "users.view" },
      { to: "/admin/roles", label: "نقش‌ها و مجوزها", icon: Shield, permission: "roles.manage" },
      { to: "/admin/settings", label: "تنظیمات", icon: Settings, permission: "settings.manage" },
      { to: "/admin/torob", label: "یکپارچه‌سازی ترب", icon: Search, permission: "settings.manage" },
    ],
  },
]

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation()
  const { data: hasPermission } = usePermission(item.permission)
  if (!hasPermission) return null

  const isActive = location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to))
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  const { signOut, profile } = useAuth()
  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
          {profile?.full_name?.[0] ?? "؟"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.full_name ?? "کاربر"}</p>
          <p className="text-xs text-muted-foreground">{profile?.role}</p>
        </div>
      </div>
      <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => signOut()}>
        <LogOut className="size-4" />
        خروج
      </Button>
    </div>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 border-l bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/admin" className="text-lg font-bold">پنل مدیریت</Link>
        </div>
        <NavContent />
        <SidebarFooter />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>پنل مدیریت</SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-4rem)] flex-col">
            <NavContent onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <Link to="/admin" className="text-base font-bold">پنل مدیریت</Link>
        </header>

        {/* Desktop top bar */}
        <header className="hidden h-14 items-center justify-between border-b px-6 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ChevronLeft className="size-4" />
              بازگشت به فروشگاه
            </Link>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

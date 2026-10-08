import { useState } from "react"
import { useRoles, usePermissions, useRolePermissions } from "@/hooks/use-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import type { Permission } from "@/types"

const roleDescriptions: Record<string, string> = {
  super_admin: "دسترسی کامل به همه بخش‌ها",
  admin: "مدیر فروشگاه با دسترسی وسیع",
  content_manager: "مدیر محتوا و وبلاگ",
  order_manager: "مدیر سفارش‌ها و ارسال",
  product_manager: "مدیر محصولات و موجودی",
}

export function AdminRolesPage() {
  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permsLoading } = usePermissions()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const { data: rolePermIds } = useRolePermissions(selectedRoleId ?? "")

  const groupedPerms = (permissions ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p)
    return acc
  }, {})

  const resourceLabels: Record<string, string> = {
    dashboard: "داشبورد", products: "محصولات", inventory: "موجودی", categories: "دسته‌بندی",
    attributes: "ویژگی‌ها", orders: "سفارش‌ها", customers: "مشتریان", discounts: "تخفیف‌ها",
    blog: "وبلاگ", media: "رسانه", reports: "گزارش‌ها", users: "کاربران", roles: "نقش‌ها",
    settings: "تنظیمات", activity_logs: "لاگ فعالیت",
  }

  const actionLabels: Record<string, string> = {
    view: "مشاهده", create: "ایجاد", edit: "ویرایش", delete: "حذف", manage: "مدیریت",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">نقش‌ها و مجوزها</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت دسترسی‌های کاربران</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        {/* Roles list */}
        <Card>
          <CardHeader>
            <CardTitle>نقش‌ها</CardTitle>
            <CardDescription>۵ نقش سیستمی</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rolesLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : (roles ?? []).map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-right transition-colors hover:bg-muted/50 ${
                  selectedRoleId === role.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div>
                  <p className="font-medium">{role.name === "super_admin" ? "مدیر ارشد" : role.name === "admin" ? "مدیر" : role.name === "content_manager" ? "مدیر محتوا" : role.name === "order_manager" ? "مدیر سفارش" : role.name === "product_manager" ? "مدیر محصول" : role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.description ?? roleDescriptions[role.name]}</p>
                </div>
                {role.is_system && <Badge variant="secondary">سیستمی</Badge>}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Permissions matrix */}
        <Card>
          <CardHeader>
            <CardTitle>مجوزها</CardTitle>
            <CardDescription>
              {selectedRoleId ? "مجوزهای این نقش" : "یک نقش را انتخاب کنید"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPerms).map(([resource, perms]) => (
                  <div key={resource}>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">{resourceLabels[resource] ?? resource}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p) => {
                        const has = selectedRoleId === null ? false : (rolePermIds ?? []).includes(p.id) || roles?.find((r) => r.id === selectedRoleId)?.name === "super_admin"
                        return (
                          <Badge key={p.id} variant={has ? "default" : "outline"}>
                            {actionLabels[p.action] ?? p.action}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions reference table */}
      <Card>
        <CardHeader><CardTitle>تمام مجوزها</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام مجوز</TableHead>
                <TableHead>منبع</TableHead>
                <TableHead>عملیات</TableHead>
                <TableHead>توضیحات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(permissions ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs" dir="ltr">{p.name}</TableCell>
                  <TableCell>{resourceLabels[p.resource] ?? p.resource}</TableCell>
                  <TableCell>{actionLabels[p.action] ?? p.action}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

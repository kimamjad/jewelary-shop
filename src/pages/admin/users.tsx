import { useState } from "react"
import { useAdminUsers, useUpdateUserRole } from "@/hooks/use-admin"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import type { Profile, UserRole } from "@/types"

const roleLabels: Record<UserRole, string> = {
  customer: "مشتری",
  admin: "مدیر",
  super_admin: "مدیر ارشد",
  content_manager: "مدیر محتوا",
  order_manager: "مدیر سفارش",
  product_manager: "مدیر محصول",
}

const allRoles: (UserRole | "all")[] = ["all", "customer", "admin", "super_admin", "content_manager", "order_manager", "product_manager"]

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const { data, isLoading } = useAdminUsers({ page, pageSize: 20, search, role: roleFilter })
  const updateRole = useUpdateUserRole()

  const columns: Column<Profile>[] = [
    { key: "full_name", header: "نام", sortable: true, accessor: (r) => r.full_name ?? "ناشناس", exportValue: (r) => r.full_name ?? "" },
    { key: "phone", header: "تلفن", accessor: (r) => <span dir="ltr">{r.phone ?? "—"}</span>, exportValue: (r) => r.phone ?? "" },
    {
      key: "role",
      header: "نقش",
      sortable: true,
      accessor: (r) => (
        <Select value={r.role} onValueChange={(v) => updateRole.mutate({ userId: r.id, role: v })}>
          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      exportValue: (r) => r.role,
    },
    { key: "created_at", header: "تاریخ عضویت", sortable: true, accessor: (r) => formatDate(r.created_at), exportValue: (r) => r.created_at },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">کاربران</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت کاربران و نقش‌ها</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="جستجوی نام یا تلفن..." className="max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {allRoles.map((r) => (
              <SelectItem key={r} value={r}>{r === "all" ? "همه نقش‌ها" : roleLabels[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable
              data={data?.users ?? []}
              columns={columns}
              getRowId={(r) => r.id}
              enableExport
              exportFilename="users.csv"
              emptyMessage="کاربری یافت نشد"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

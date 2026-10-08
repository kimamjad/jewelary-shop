import { useState } from "react"
import { useActivityLogs } from "@/hooks/use-admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { formatDate, toPersianDigits } from "@/lib/format"

export function AdminActivityLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useActivityLogs({ page, pageSize: 20 })
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لاگ فعالیت‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">تاریخچه تغییرات انجام شده توسط مدیران</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (data?.logs ?? []).length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">فعالیتی ثبت نشده است</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عملیات</TableHead>
                  <TableHead>نوع موجودیت</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.logs ?? []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{log.entity_type}</TableCell>
                    <TableCell>{(log as unknown as { admin?: { full_name: string | null } }).admin?.full_name ?? "ناشناس"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="text-sm text-muted-foreground">صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}
    </div>
  )
}

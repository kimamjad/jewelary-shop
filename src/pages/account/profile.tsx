import { useState } from "react"
import { toast } from "sonner"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

export function ProfilePage() {
  useSEO({
    title: "ویرایش پروفایل",
    description: "ویرایش اطلاعات شخصی حساب کاربری",
    canonical: `${SITE_URL}/account/profile`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "حساب کاربری", url: `${SITE_URL}/account` },
      { name: "ویرایش پروفایل", url: `${SITE_URL}/account/profile` },
    ]),
  })

  const { profile, user, refreshProfile, isLoading } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("نام نمی‌تواند خالی باشد")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user!.id)
      if (error) throw error
      await refreshProfile()
      toast.success("پروفایل به‌روزرسانی شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ویرایش پروفایل</h1>
        <p className="mt-1 text-muted-foreground">اطلاعات شخصی خود را به‌روزرسانی کنید</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          <CardDescription>نام و شماره تماس شما</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                dir="ltr"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">ایمیل قابل تغییر نیست</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="نام شما"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تماس</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Save, Store, Phone, Mail, MapPin, Image as ImageIcon } from "lucide-react"
import { useSEO } from "@/hooks/use-seo"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const SETTINGS_KEY = "store_settings"

interface StoreSettings {
  siteName: string
  siteDescription: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  freeShippingThreshold: string
  heroTitle: string
  heroSubtitle: string
}

const defaultSettings: StoreSettings = {
  siteName: "جواهرات لوکس",
  siteDescription: "فروشگاه آنلاین انگشتر و سنگ‌های قیمتی",
  contactPhone: "۰۲۱-۸۸۸۸۸۸۸۸",
  contactEmail: "info@jewelrystore.ir",
  contactAddress: "تهران، خیابان ولیعصر، بازار طلا و جواهر",
  freeShippingThreshold: "2000000",
  heroTitle: "جواهرات لوکس، اصالت در هر جزئیات",
  heroSubtitle: "خرید آنلاین انگشتر طلا، گردنبند و سنگ‌های قیمتی با گواهی اصالت و ضمانت کیفیت.",
}

function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaultSettings
}

export function AdminSettingsPage() {
  useSEO({ title: "تنظیمات فروشگاه", description: "مدیریت تنظیمات کلی فروشگاه" })

  const queryClient = useQueryClient()
  const { profile, isLoading: authLoading } = useAuth()
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      queryClient.invalidateQueries({ queryKey: ["store-settings"] })
      toast.success("تنظیمات ذخیره شد")
    } catch {
      toast.error("خطا در ذخیره‌سازی تنظیمات")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">تنظیمات فروشگاه</h1>
        <p className="mt-1 text-muted-foreground">مدیریت اطلاعات و تنظیمات کلی فروشگاه</p>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <div>
              <CardTitle>اطلاعات فروشگاه</CardTitle>
              <CardDescription>نام و توضیحات فروشگاه</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">نام فروشگاه</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">توضیحات کوتاه</Label>
            <Input
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" />
            <div>
              <CardTitle>صفحه اصلی</CardTitle>
              <CardDescription>عنوان و توضیحات بخش هرو صفحه اصلی</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">عنوان هرو</Label>
            <Input
              id="heroTitle"
              value={settings.heroTitle}
              onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">توضیحات هرو</Label>
            <Textarea
              id="heroSubtitle"
              value={settings.heroSubtitle}
              onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="size-5 text-primary" />
            <div>
              <CardTitle>اطلاعات تماس</CardTitle>
              <CardDescription>اطلاعاتی که در صفحه تماس و فوتر نمایش داده می‌شود</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-1">
                <Phone className="size-3" /> تلفن تماس
              </Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-1">
                <Mail className="size-3" /> ایمیل
              </Label>
              <Input
                id="contactEmail"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactAddress" className="flex items-center gap-1">
              <MapPin className="size-3" /> آدرس
            </Label>
            <Textarea
              id="contactAddress"
              value={settings.contactAddress}
              onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>ارسال</CardTitle>
          <CardDescription>تنظیمات ارسال و حمل</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="freeShipping">آستانه ارسال رایگان (تومان)</Label>
            <Input
              id="freeShipping"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
              dir="ltr"
              type="number"
            />
            <p className="text-xs text-muted-foreground">
              سفارش‌های بالای این مبلغ ارسال رایگان دارند
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Account Info */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">{profile?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">کاربر فعلی</p>
        </div>
        <span className="text-xs text-muted-foreground">{profile?.role}</span>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="size-4" />
        {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </Button>
    </div>
  )
}

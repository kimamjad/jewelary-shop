import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ExternalLink, Zap, Check, X, Loader2, ShoppingBag } from "lucide-react"
import { fetchTorobSettings, updateTorobSettings, testTorobConnection } from "@/lib/integrations/torob/settings"
import { useSEO } from "@/hooks/use-seo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminTorobPage() {
  useSEO({ title: "یکپارچه‌سازی ترب", description: "تنظیمات اتصال فروشگاه به ترب" })

  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ["torob-settings"],
    queryFn: fetchTorobSettings,
  })

  const [enabled, setEnabled] = useState(false)
  const [siteUrl, setSiteUrl] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; productCount?: number; error?: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled)
      setSiteUrl(settings.siteUrl)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: (input: { enabled: boolean; siteUrl: string }) => updateTorobSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torob-settings"] })
      toast.success("تنظیمات ترب ذخیره شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSave = () => {
    saveMutation.mutate({ enabled, siteUrl: siteUrl.replace(/\/$/, "") })
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testTorobConnection(siteUrl.replace(/\/$/, ""))
    setTestResult(result)
    setTesting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const apiEndpoint = siteUrl ? `${siteUrl.replace(/\/$/, "")}/functions/v1/torob-products` : ""

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">یکپارچه‌سازی ترب</h1>
        <p className="text-muted-foreground mt-1">
          ترب پلتفرم مقایسه قیمت است — محصولات شما در ترب نمایش داده می‌شوند و کاربران از طریق لینک مستقیم به فروشگاه شما هدایت می‌شوند.
        </p>
      </div>

      <Alert>
        <ShoppingBag className="size-4" />
        <AlertTitle>توجه: ترب درگاه پرداخت نیست</AlertTitle>
        <AlertDescription>
          ترب صرفاً پلتفرم مقایسه قیمت و جذب کاربر است. فرآیند پرداخت فروشگاه شما مستقل از ترب انجام می‌شود. کاربر پس از کلیک روی محصول در ترب، به سایت شما منتقل شده و خرید را در فروشگاه شما انجام می‌دهد.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>وضعیت اتصال</CardTitle>
              <CardDescription>فعال‌سازی یا غیرفعال‌سازی ارسال محصولات به ترب</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="torob-enabled" className="text-sm">
                {enabled ? "فعال" : "غیرفعال"}
              </Label>
              <Switch id="torob-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settings?.lastSyncAt && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="size-4" />
              آخرین همگام‌سازی: {new Date(settings.lastSyncAt).toLocaleDateString("fa-IR")}
              {settings.productCount !== null && ` (${settings.productCount} محصول)`}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">آدرس سایت فروشگاه</Label>
              <Input
                id="site-url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                آدرس کامل سایت فروشگاه — لینک محصولات در ترب بر اساس این آدرس ساخته می‌شود
              </p>
            </div>

            {apiEndpoint && (
              <div className="space-y-2">
                <Label>آدرس API ترب (برای ارائه به پنل ترب)</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm" dir="ltr">
                    {apiEndpoint}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(apiEndpoint)
                      toast.success("کپی شد")
                    }}
                  >
                    کپی
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  این آدرس را در پنل فروشندگان ترب در بخش تنظیمات API ثبت کنید
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              ذخیره تنظیمات
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !siteUrl}>
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              تست اتصال
            </Button>
          </div>

          {testResult && (
            <div className="mt-4">
              {testResult.success ? (
                <Alert>
                  <Check className="size-4" />
                  <AlertTitle>اتصال موفق</AlertTitle>
                  <AlertDescription>
                    API ترب فعال است و {testResult.productCount} محصول قابل ارسال می‌باشد
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <X className="size-4" />
                  <AlertTitle>اتصال ناموفق</AlertTitle>
                  <AlertDescription>{testResult.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>راهنمای راه‌اندازی</CardTitle>
          <CardDescription>مراحل اتصال فروشگاه به ترب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <Badge variant="outline" className="shrink-0">۱</Badge>
            <p>آدرس کامل سایت فروشگاه را در فیلد بالا وارد کنید و ذخیره کنید.</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="shrink-0">۲</Badge>
            <p>در پنل فروشندگان ترب (panel.torob.com) ثبت‌نام کنید و منتظر تایید بمانید.</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="shrink-0">۳</Badge>
            <p>آدرس API نمایش‌داده‌شده در بالا را در پنل ترب در بخش تنظیمات API ثبت کنید.</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="shrink-0">۴</Badge>
            <p>کلید عمومی ترب (EdDSA) به‌صورت خودکار در Edge Function ذخیره شده است — نیازی به تنظیم دستی نیست.</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="shrink-0">۵</Badge>
            <p>پس از تایید توسط ترب، محصولات شما به‌صورت خودکار استخراج و در ترب نمایش داده می‌شوند.</p>
          </div>
          <Separator className="my-3" />
          <a
            href="https://panel.torob.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            ورود به پنل فروشندگان ترب
            <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

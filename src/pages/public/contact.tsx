import { useState } from "react"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"
import { toast } from "sonner"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const contactInfo = [
  { icon: Phone, label: "تلفن تماس", value: "۰۲۱-۸۸۸۸۸۸۸۸", dir: "ltr" },
  { icon: Mail, label: "ایمیل", value: "info@jewelrystore.ir", dir: "ltr" },
  { icon: MapPin, label: "آدرس", value: "تهران، خیابان ولیعصر، بازار طلا و جواهر" },
  { icon: Clock, label: "ساعات کاری", value: "شنبه تا پنجشنبه، ۱۰ تا ۲۰" },
]

export function ContactPage() {
  useSEO({
    title: "تماس با ما",
    description: "راه‌های ارتباطی با فروشگاه جواهرات لوکس — تلفن، ایمیل و فرم تماس",
    canonical: `${SITE_URL}/contact`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "تماس با ما", url: `${SITE_URL}/contact` },
    ]),
  })

  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("لطفاً نام، تلفن و پیام را وارد کنید")
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    toast.success("پیام شما ثبت شد. به‌زودی با شما تماس خواهیم گرفت.")
    setForm({ name: "", email: "", phone: "", subject: "", message: "" })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">تماس با ما</h1>
        <p className="mt-2 text-muted-foreground">
          برای مشاوره، سفارش یا هرگونه سوال با ما در ارتباط باشید
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Contact Info */}
        <div className="space-y-4">
          {contactInfo.map((info, idx) => (
            <Card key={info.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <info.icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-medium truncate" dir={info.dir ?? "rtl"}>
                    {info.value}
                  </p>
                </div>
              </CardContent>
              {idx < contactInfo.length - 1 && <Separator />}
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>فرم تماس</CardTitle>
            <CardDescription>پیام خود را برای ما ارسال کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="نام شما"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">موضوع</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="موضوع پیام"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">پیام شما *</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="پیام خود را اینجا بنویسید..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? null : <Send className="size-4" />}
                {submitting ? "در حال ارسال..." : "ارسال پیام"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

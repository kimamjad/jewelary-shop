import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const sections = [
  {
    title: "جمع‌آوری اطلاعات",
    body: "ما اطلاعات شما را در موارد زیر جمع‌آوری می‌کنیم: ثبت‌نام و ایجاد حساب کاربری، ثبت سفارش، پرداخت آنلاین و تماس با پشتیبانی. اطلاعات جمع‌آوری‌شده شامل نام، شماره تماس، ایمیل، آدرس ارسال و تاریخچه خرید است.",
  },
  {
    title: "استفاده از اطلاعات",
    body: "اطلاعات شما صرفاً برای پردازش سفارش‌ها، ارسال کالا، پشتیبانی مشتری و بهبود خدمات ما استفاده می‌شود. ما از اطلاعات شما برای تبلیغات بدون اجازه شما استفاده نمی‌کنیم.",
  },
  {
    title: "اشتراک‌گذاری اطلاعات",
    body: "اطاعات شما در اختیار اشخاص ثالث قرار نمی‌گیرد، به جز موارد قانونی و برای انجام خدمات ارسال که در آن صورت تنها آدرس و شماره تماس به شرکت پستی ارائه می‌شود.",
  },
  {
    title: "امنیت اطلاعات",
    body: "ما از پروتکل‌های امنیتی استاندارد برای محافظت از اطلاعات شما استفاده می‌کنیم. پرداخت‌ها از طریق درگاه‌های امن و رمزنگاری‌شده انجام می‌شوند و اطلاعات کارت بانکی نزد ما ذخیره نمی‌شود.",
  },
  {
    title: "کوکی‌ها (Cookies)",
    body: "سایت از کوکی‌ها برای بهبود تجربه کاربری و یادآوری تنظیمات شما استفاده می‌کند. می‌توانید کوکی‌ها را از تنظیمات مرورگر خود غیرفعال کنید.",
  },
  {
    title: "حقوق شما",
    body: "شما حق دسترسی به اطلاعات خود، ویرایش آن‌ها و درخواست حذف حساب کاربری را دارید. برای این منظور می‌توانید با پشتیبانی تماس بگیرید.",
  },
  {
    title: "تغییرات سیاست",
    body: "این سیاست ممکن است به‌روزرسانی شود. تغییرات از زمان انتشار در سایت اعمال می‌شوند. توصیه می‌شود صفحه را به‌طور دوره‌ای بررسی کنید.",
  },
]

export function PrivacyPage() {
  useSEO({
    title: "حریم خصوصی",
    description: "سیاست حریم خصوصی و نحوه محافظت از اطلاعات شما در فروشگاه جواهرات لوکس",
    canonical: `${SITE_URL}/privacy`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "حریم خصوصی", url: `${SITE_URL}/privacy` },
    ]),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">حریم خصوصی</h1>
        <p className="mt-2 text-muted-foreground">
          نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">آخرین بروزرسانی: مهر ۱۴۰۴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {sections.map((section, idx) => (
            <div key={idx}>
              <div className="py-4">
                <h2 className="mb-2 text-base font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground leading-7">{section.body}</p>
              </div>
              {idx < sections.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

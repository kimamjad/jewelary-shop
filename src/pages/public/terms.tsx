import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const sections = [
  {
    title: "۱. ثبت سفارش",
    body: "ثبت سفارش در سایت به منزله پذیرش قوانین و مقررات فروشگاه است. پس از ثبت سفارش، کارشناسان ما با شما تماس گرفته و سفارش تأیید می‌شود. تأیید نهایی سفارش منوط به موجود بودن کالا و تأیید پرداخت است.",
  },
  {
    title: "۲. قیمت‌ها و پرداخت",
    body: "قیمت‌های نمایش‌داده‌شده در سایت بر حسب تومان و شامل مالیات بر ارزش افزوده است. قیمت محصولات در صورت تغییرات بازار ممکن است بدون اطلاع قبلی تغییر کند. پرداخت تنها از طریق درگاه‌های معتبر سایت امکان‌پذیر است.",
  },
  {
    title: "۳. ارسال و تحویل",
    body: "سفارش‌های تأیید شده حداکثر ظرف ۲۴ ساعت در تهران و ۴۸ تا ۷۲ ساعت در سایر شهرستان‌ها ارسال می‌شوند. زمان تحویل تقریبی است و در شرایط خاص ممکن است متفاوت باشد. تحویل کالا به شخص سفارش‌دهنده یا نماینده معتبر او انجام می‌شود.",
  },
  {
    title: "۴. ضمانت اصالت کالا",
    body: "تمام محصولات با گواهی اصالت ارائه می‌شوند. در صورت اثبات عدم اصالت کالا، فروشگاه متعهد به بازگشت کامل مبلغ پرداختی است.",
  },
  {
    title: "۵. بازگشت و مرجوعی",
    body: "شما می‌توانید کالا را ظرف ۷ روز کاری از تاریخ دریافت مرجوع کنید. کالا باید در وضعیت اولیه، بدون استفاده و با تمام برچسب‌ها و گواهی‌ها باشد. هزینه ارسال مرجوعی برای کالای معیوب بر عهده فروشگاه است.",
  },
  {
    title: "۶. حفظ اطلاعات",
    body: "اطاعات شخصی شما نزد فروشگاه محفوظ بوده و در اختیار اشخاص ثالث قرار نمی‌گیرد. اطلاعات پرداخت از طریق درگاه‌های امن و رمزنگاری‌شده پردازش می‌شود.",
  },
  {
    title: "۷. مالکیت معنوی",
    body: "تمام محتوای سایت شامل تصاویر، متن‌ها و طراحی متعلق به فروشگاه جواهرات لوکس است و هرگونه استفاده بدون اجازه کتبی ممنوع است.",
  },
  {
    title: "۸. تغییر قوانین",
    body: "فروشگاه حق تغییر قوانین و مقررات را برای خود محفوظ می‌دارد. تغییرات از زمان انتشار در سایت اعمال می‌شوند.",
  },
]

export function TermsPage() {
  useSEO({
    title: "قوانین و مقررات",
    description: "قوانین و مقررات خرید از فروشگاه جواهرات لوکس",
    canonical: `${SITE_URL}/terms`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "قوانین و مقررات", url: `${SITE_URL}/terms` },
    ]),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">قوانین و مقررات</h1>
        <p className="mt-2 text-muted-foreground">
          خرید از فروشگاه به منزله پذیرش قوانین زیر است
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

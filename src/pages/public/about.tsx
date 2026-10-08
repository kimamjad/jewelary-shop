import { Gem, Shield, Award, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

const stats = [
  { value: "+۱۰ سال", label: "تجربه فعالیت" },
  { value: "+۵۰۰۰", label: "مشتری راضی" },
  { value: "+۳۰۰", label: "مدل متنوع" },
  { value: "۱۰۰٪", label: "اصالت کالا" },
]

const values = [
  {
    icon: Gem,
    title: "کیفیت بی‌نظیر",
    desc: "هر جواهر با دقت و ظرافت توسط استادکاران مجرب تولید می‌شود و قبل از ارسال کنترل کیفیت می‌شود.",
  },
  {
    icon: Shield,
    title: "اصالت تضمینی",
    desc: "تمام محصولات با گواهی اصالت و ضمانت بازگشت کالا ارائه می‌شوند.",
  },
  {
    icon: Award,
    title: "قیمت منصفانه",
    desc: "با حذف واسطه‌ها، قیمت واقعی و منصفانه را مستقیم از تولیدکننده دریافت می‌کنید.",
  },
  {
    icon: Users,
    title: "مشاوره تخصصی",
    desc: "کارشناسان ما همراه شما هستند تا بهترین انتخاب را داشته باشید.",
  },
]

export function AboutPage() {
  useSEO({
    title: "درباره ما",
    description: "داستان فروشگاه جواهرات لوکس — تجربه، اصالت و تعهد به کیفیت",
    canonical: `${SITE_URL}/about`,
    structuredData: buildBreadcrumbStructuredData([
      { name: "خانه", url: SITE_URL },
      { name: "درباره ما", url: `${SITE_URL}/about` },
    ]),
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">درباره جواهرات لوکس</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          داستان ما، ارزش‌های ما و تعهد ما به شما
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-12">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Story */}
      <section className="space-y-4 leading-7 text-muted-foreground">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">داستان ما</h2>
        <p>
          جواهرات لوکس با هدف ارائه محصولات باکیفیت و اصل به مشتریان عزیز آغاز به کار کرد.
          ما با بیش از یک دهه تجربه در بازار طلا و جواهر، می‌دانیم که هر قطعه جواهر فقط یک
          زینت نیست؛ بلکه نماد سلیقه، شخصیت و ارزش‌های شماست.
        </p>
        <p>
          از همان ابتدا، هدف ما این بود که تجربه خرید جواهر را شفاف، ساده و مطمئن کنیم.
          حذف واسطه‌ها، ارائه گواهی اصالت برای هر محصول، و کنترل کیفیت دقیق قبل از ارسال،
          از اصول اساسی ماست که به آن پایبندیم.
        </p>
      </section>

      <Separator className="my-8" />

      {/* Values */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">ارزش‌های ما</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map((value) => (
            <div key={value.title} className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <value.icon className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{value.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-6">{value.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-xl font-semibold">آماده‌اید تجربه کنید؟</h2>
        <p className="text-sm text-muted-foreground">
          مجموعه ما را مشاهده کنید و جواهر مورد علاقه خود را پیدا کنید
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/shop">مشاهده فروشگاه</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">تماس با ما</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

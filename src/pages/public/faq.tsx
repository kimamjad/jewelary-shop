import { useSEO, buildBreadcrumbStructuredData } from "@/hooks/use-seo"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageCircle, ShoppingBag, CreditCard, Truck, RotateCcw, Shield } from "lucide-react"

const SITE_URL = typeof window !== "undefined" ? window.location.origin : ""

interface FAQItem {
  question: string
  answer: string
}

const faqGroups: { icon: typeof ShoppingBag; title: string; items: FAQItem[] }[] = [
  {
    icon: ShoppingBag,
    title: "خرید و سفارش",
    items: [
      {
        question: "چگونه سفارش ثبت کنم؟",
        answer: "کافیست محصول مورد نظر را انتخاب کنید، به سبد خرید اضافه کنید و وارد صفحه تسویه حساب شوید. اطلاعات تماس و آدرس را وارد کرده و سفارش شما ثبت می‌شود.",
      },
      {
        question: "آیا برای خرید باید ثبت‌نام کنم؟",
        answer: "بله، برای ثبت سفارش و پیگیری آن نیاز به ثبت‌نام در سایت دارید. ثبت‌نام سریع و رایگان است.",
      },
      {
        question: "آیا می‌توانم سفارشم را تلفنی ثبت کنم؟",
        answer: "بله، می‌توانید با شماره ۰۲۱-۸۸۸۸۸۸۸۸ تماس بگیرید و سفارش خود را با کمک کارشناسان ما ثبت کنید.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "پرداخت",
    items: [
      {
        question: "روش‌های پرداخت چیست؟",
        answer: "پرداخت به‌صورت آنلاین از طریق درگاه پرداخت امن و همچنین پرداخت در محل (برای سفارش‌های انتخابی) امکان‌پذیر است.",
      },
      {
        question: "آیا پرداخت اقساطی امکان‌پذیر است؟",
        answer: "در حال حاضر پرداخت اقساطی فعال نیست اما به‌زودی این امکان برای مشتریان فعال خواهد شد.",
      },
    ],
  },
  {
    icon: Truck,
    title: "ارسال و تحویل",
    items: [
      {
        question: "زمان ارسال چقدر است؟",
        answer: "سفارش‌های تأیید شده حداکثر ظرف ۲۴ ساعت در تهران و ۴۸ تا ۷۲ ساعت در سایر شهرستان‌ها ارسال می‌شوند.",
      },
      {
        question: "هزینه ارسال چقدر است؟",
        answer: "ارسال سفارش‌های بالای ۲ میلیون تومان رایگان است. برای سفارش‌های کمتر، هزینه ارسال بر اساس مقصد محاسبه می‌شود.",
      },
      {
        question: "آیا ارسال به تمام شهرها انجام می‌شود؟",
        answer: "بله، ارسال به تمام شهرهای کشور از طریق پیک و شرکت‌های پستی انجام می‌شود.",
      },
    ],
  },
  {
    icon: RotateCcw,
    title: "بازگشت و ضمانت",
    items: [
      {
        question: "سیاست بازگشت کالا چیست؟",
        answer: "شما می‌توانید کالا را ظرف ۷ روز از تاریخ دریافت، در صورت عدم رضایت یا مشکل، مرجوع کنید. هزینه ارسال مرجوعی بر عهده فروشگاه است.",
      },
      {
        question: "آیا محصولات گواهی اصالت دارند؟",
        answer: "بله، تمام محصولات با گواهی اصالت و ضمانت کیفیت ارائه می‌شوند. گواهی همراه با محصول ارسال می‌گردد.",
      },
    ],
  },
]

export function FaqPage() {
  useSEO({
    title: "سوالات متداول",
    description: "پاسخ سوالات رایج درباره خرید، پرداخت، ارسال و بازگشت کالا از فروشگاه جواهرات لوکس",
    canonical: `${SITE_URL}/faq`,
    structuredData: [
      buildBreadcrumbStructuredData([
        { name: "خانه", url: SITE_URL },
        { name: "سوالات متداول", url: `${SITE_URL}/faq` },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqGroups.flatMap((group) =>
          group.items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        ),
      },
    ],
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="size-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">سوالات متداول</h1>
        <p className="mt-2 text-muted-foreground">
          پاسخ سوالات پرتکرار شما در یک نگاه
        </p>
      </div>

      <div className="space-y-6">
        {faqGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              <group.icon className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">{group.title}</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible>
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`${group.title}-${idx}`}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="px-4 text-right hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 text-muted-foreground leading-6">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 p-6 text-center">
        <Shield className="mx-auto mb-2 size-8 text-primary" />
        <p className="text-sm font-medium">سوال دیگری دارید؟</p>
        <p className="mt-1 text-sm text-muted-foreground">
          کارشناسان ما آماده پاسخگویی به شما هستند
        </p>
      </div>
    </div>
  )
}

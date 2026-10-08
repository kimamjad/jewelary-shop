import { z } from "zod"

export const checkoutSchema = z.object({
  full_name: z.string().min(2, "نام و نام خانوادگی الزامی است"),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد"),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  province: z.string().min(1, "استان را انتخاب کنید"),
  city: z.string().min(1, "شهر را انتخاب کنید"),
  address: z.string().min(10, "آدرس باید حداقل ۱۰ کاراکتر باشد"),
  postal_code: z
    .string()
    .regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  shipping_method: z.enum(["post", "tipax", "pickup"]),
  payment_method: z.enum(["zarinpal", "cod"]),
  notes: z.string().optional(),
  accept_terms: z.boolean().refine((v) => v === true, {
    message: "پذیرش قوانین الزامی است",
  }),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export const shippingCosts: Record<string, number> = {
  post: 50000,
  tipax: 30000,
  pickup: 0,
}

export const shippingLabels: Record<string, string> = {
  post: "پست",
  tipax: "تیپاکس",
  pickup: "تحضیر در فروشگاه",
}

export const paymentLabels: Record<string, string> = {
  zarinpal: "زرین‌پال (آنلاین)",
  cod: "پرداخت در محل",
}

export const discountCodeSchema = z.object({
  code: z.string().min(1, "کد تخفیف را وارد کنید"),
})

export type DiscountCodeFormValues = z.infer<typeof discountCodeSchema>

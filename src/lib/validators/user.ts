import { z } from "zod"

export const discountSchema = z.object({
  code: z.string().min(2, "کد تخفیف باید حداقل ۲ کاراکتر باشد"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("مقدار باید بزرگتر از صفر باشد"),
  min_order: z.number().nonnegative().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean(),
})

export type DiscountFormValues = z.infer<typeof discountSchema>

export const profileSchema = z.object({
  full_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد")
    .optional()
    .or(z.literal("")),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export const contactFormSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر نیست"),
  subject: z.string().min(2, "موضوع را وارد کنید"),
  message: z.string().min(10, "پیام باید حداقل ۱۰ کاراکتر باشد"),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

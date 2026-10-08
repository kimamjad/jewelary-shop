import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    full_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
    email: z.string().email("ایمیل معتبر نیست"),
    phone: z
      .string()
      .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع و ۱۱ رقم باشد"),
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

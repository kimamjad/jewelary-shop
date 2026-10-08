import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { signupSchema, type SignupFormValues } from "@/lib/validators/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true)
    try {
      await signUp(values.email, values.password, values.full_name)
      toast.success("ثبت‌نام موفقیت‌آمیز بود")
      navigate("/", { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">ثبت‌نام</CardTitle>
          <CardDescription>یک حساب کاربری جدید بسازید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="full_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>نام و نام خانوادگی</FieldLabel>
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ایمیل</FieldLabel>
                  <Input {...field} id={field.name} type="email" dir="ltr" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>شماره موبایل</FieldLabel>
                  <Input {...field} id={field.name} dir="ltr" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>رمز عبور</FieldLabel>
                  <Input {...field} id={field.name} type="password" dir="ltr" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>تکرار رمز عبور</FieldLabel>
                  <Input {...field} id={field.name} type="password" dir="ltr" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            حساب دارید؟{" "}
            <Link to="/login" className="text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

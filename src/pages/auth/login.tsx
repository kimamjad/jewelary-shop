import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      await signIn(values.email, values.password)
      toast.success("ورود موفقیت‌آمیز بود")
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"
      navigate(from, { replace: true })
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
          <CardTitle className="text-2xl">ورود</CardTitle>
          <CardDescription>برای ادامه وارد حساب خود شوید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ایمیل</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    dir="ltr"
                    aria-invalid={fieldState.invalid}
                  />
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
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    dir="ltr"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            حساب ندارید؟{" "}
            <Link to="/signup" className="text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

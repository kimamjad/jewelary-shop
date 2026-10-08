import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PagePlaceholderProps {
  title: string
  description?: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            این صفحه در مراحل بعدی پیاده‌سازی خواهد شد.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

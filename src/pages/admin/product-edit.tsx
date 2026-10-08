import { useParams } from "react-router-dom"
import { ProductForm } from "@/components/admin/product-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>شناسه محصول مشخص نیست</AlertDescription>
      </Alert>
    )
  }

  return <ProductForm productId={id} />
}

export function AdminProductEditPageSkeleton() {
  return <Skeleton className="h-96 w-full" />
}

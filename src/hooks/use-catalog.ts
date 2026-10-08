import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  addProductImages,
  deleteProductImage,
  setPrimaryImage,
  syncProductAttributes,
  fetchCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
  fetchBrands,
  fetchAttributeGroups,
  fetchAttributes,
  createAttributeGroup,
  updateAttributeGroup,
  deleteAttributeGroup,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  type ProductListParams,
  type ProductImageInput,
} from "@/lib/api/catalog"

const queryKeys = {
  products: (params: ProductListParams) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,
  productBySlug: (slug: string) => ["product-slug", slug] as const,
  categories: ["categories"] as const,
  brands: ["brands"] as const,
  attributeGroups: ["attribute-groups"] as const,
  attributes: ["attributes"] as const,
}

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => fetchProducts(params),
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id,
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.productBySlug(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("محصول با موفقیت ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.id) })
      toast.success("محصول با موفقیت به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSoftDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: softDeleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("محصول حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("محصول بازیابی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAddProductImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, images }: { productId: string; images: ProductImageInput[] }) =>
      addProductImages(productId, images),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.productId) })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ imageId }: { imageId: string; productId: string }) =>
      deleteProductImage(imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.productId) })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSetPrimaryImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      setPrimaryImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.productId) })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSyncProductAttributes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, attributes }: { productId: string; attributes: { attribute_id: string; value: string }[] }) =>
      syncProductAttributes(productId, attributes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.productId) })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      toast.success("دسته‌بندی ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      toast.success("دسته‌بندی به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: softDeleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      toast.success("دسته‌بندی حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: fetchBrands,
  })
}

export function useAttributeGroups() {
  return useQuery({
    queryKey: queryKeys.attributeGroups,
    queryFn: fetchAttributeGroups,
  })
}

export function useAttributes() {
  return useQuery({
    queryKey: queryKeys.attributes,
    queryFn: fetchAttributes,
  })
}

export function useCreateAttributeGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAttributeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributeGroups })
      toast.success("گروه ویژگی ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAttributeGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateAttributeGroup>[1] }) =>
      updateAttributeGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributeGroups })
      toast.success("گروه ویژگی به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAttributeGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAttributeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributeGroups })
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes })
      toast.success("گروه ویژگی حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes })
      toast.success("ویژگی ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateAttribute>[1] }) =>
      updateAttribute(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes })
      toast.success("ویژگی به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes })
      toast.success("ویژگی حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(2, "نام محصول باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2, "اسلاگ باید حداقل ۲ کاراکتر باشد")
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره"),
  description: z.string().optional(),
  short_description: z.string().max(200, "توضیح کوتاه نباید بیش از ۲۰۰ کاراکتر باشد").optional(),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  base_price: z.number().positive("قیمت باید بزرگتر از صفر باشد"),
  sale_price: z.number().positive().nullable().optional(),
  compare_at_price: z.number().positive().nullable().optional(),
  cost_price: z.number().min(0).nullable().optional(),
  sku: z.string().min(1, "SKU الزامی است"),
  stock_quantity: z.number().int().min(0, "موجودی نمی‌تواند منفی باشد"),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "hidden", "members_only"]),
  is_featured: z.boolean(),
  weight_grams: z.number().positive().nullable().optional(),
  meta_title: z.string().max(60).nullable().optional(),
  meta_description: z.string().max(160).nullable().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const categorySchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  parent_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  image_url: z.string().url("آدرس تصویر معتبر نیست").nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const brandSchema = z.object({
  name: z.string().min(2, "نام برند باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  description: z.string().optional(),
})

export type BrandFormValues = z.infer<typeof brandSchema>

export const attributeGroupSchema = z.object({
  name: z.string().min(2, "نام گروه باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  sort_order: z.number().int().min(0),
})

export type AttributeGroupFormValues = z.infer<typeof attributeGroupSchema>

export const attributeSchema = z.object({
  group_id: z.string().uuid("گروه ویژگی الزامی است"),
  name: z.string().min(2, "نام ویژگی باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  type: z.enum(["text", "number", "select", "boolean", "color"]),
  unit: z.string().nullable().optional(),
  is_filterable: z.boolean(),
  is_required: z.boolean(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  sort_order: z.number().int().min(0),
})

export type AttributeFormValues = z.infer<typeof attributeSchema>

export const productAttributeSchema = z.object({
  attribute_id: z.string().uuid(),
  value: z.string().min(1, "مقدار ویژگی الزامی است"),
})

export type ProductAttributeFormValues = z.infer<typeof productAttributeSchema>

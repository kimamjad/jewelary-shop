import { z } from "zod"

export const blogPostSchema = z.object({
  title: z.string().min(2, "عنوان باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  content: z.string().min(10, "محتوای مقاله باید حداقل ۱۰ کاراکتر باشد"),
  excerpt: z.string().max(200, "خلاصه نباید بیشتر از ۲۰۰ کاراکتر باشد").optional().nullable(),
  category_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "published", "scheduled"]),
  featured_image: z.string().url().nullable().optional(),
  meta_title: z.string().max(60, "عنوان سئو حداکثر ۶۰ کاراکتر").nullable().optional(),
  meta_description: z.string().max(160, "توضیحات سئو حداکثر ۱۶۰ کاراکتر").nullable().optional(),
  canonical_url: z.string().url().nullable().optional(),
  og_image: z.string().url().nullable().optional(),
  reading_time_minutes: z.number().min(1).nullable().optional(),
  published_at: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export type BlogPostFormValues = z.infer<typeof blogPostSchema>

export const blogCategorySchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
  description: z.string().optional().nullable(),
})

export type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>

export const blogTagSchema = z.object({
  name: z.string().min(2, "نام برچسب باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره"),
})

export type BlogTagFormValues = z.infer<typeof blogTagSchema>

export const commentSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر نیست"),
  comment: z.string().min(5, "نظر باید حداقل ۵ کاراکتر باشد"),
})

export type CommentFormValues = z.infer<typeof commentSchema>

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  fetchPublishedPosts,
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchBlogCategories,
  fetchBlogTags,
  fetchAdminPosts,
  fetchAdminPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  syncPostTags,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  createBlogTag,
  deleteBlogTag,
} from "@/lib/api/blog"
import type { BlogPostStatus } from "@/types"

const blogKeys = {
  publicList: (params: Record<string, unknown>) => ["blog", "list", params] as const,
  publicPost: (slug: string) => ["blog", "post", slug] as const,
  related: (postId: string) => ["blog", "related", postId] as const,
  categories: ["blog", "categories"] as const,
  tags: ["blog", "tags"] as const,
  adminList: (params: Record<string, unknown>) => ["admin", "blog", params] as const,
  adminPost: (id: string) => ["admin", "blog", id] as const,
}

// Public hooks

export function usePublishedPosts(params: { page?: number; pageSize?: number; categoryId?: string; tagId?: string; search?: string }) {
  return useQuery({ queryKey: blogKeys.publicList(params), queryFn: () => fetchPublishedPosts(params) })
}

export function usePostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: blogKeys.publicPost(slug ?? ""),
    queryFn: () => fetchPostBySlug(slug!),
    enabled: !!slug,
  })
}

export function useRelatedPosts(postId: string | undefined, categoryId: string | null | undefined) {
  return useQuery({
    queryKey: blogKeys.related(postId ?? ""),
    queryFn: () => fetchRelatedPosts(postId!, categoryId ?? null),
    enabled: !!postId,
  })
}

export function useBlogCategories() {
  return useQuery({ queryKey: blogKeys.categories, queryFn: fetchBlogCategories })
}

export function useBlogTags() {
  return useQuery({ queryKey: blogKeys.tags, queryFn: fetchBlogTags })
}

// Admin hooks

export function useAdminPosts(params: { page?: number; pageSize?: number; status?: BlogPostStatus | "all"; search?: string }) {
  return useQuery({ queryKey: blogKeys.adminList(params), queryFn: () => fetchAdminPosts(params) })
}

export function useAdminPost(id: string | undefined) {
  return useQuery({
    queryKey: blogKeys.adminPost(id ?? ""),
    queryFn: () => fetchAdminPostById(id!),
    enabled: !!id,
  })
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createBlogPost>[0]) => createBlogPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      queryClient.invalidateQueries({ queryKey: ["blog"] })
      toast.success("مقاله ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateBlogPost>[1] }) =>
      updateBlogPost(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      queryClient.invalidateQueries({ queryKey: ["blog"] })
      toast.success("مقاله به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      queryClient.invalidateQueries({ queryKey: ["blog"] })
      toast.success("مقاله حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSyncPostTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, tagIds }: { postId: string; tagIds: string[] }) => syncPostTags(postId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] })
      queryClient.invalidateQueries({ queryKey: ["blog"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createBlogCategory>[0]) => createBlogCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories })
      toast.success("دسته‌بندی ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateBlogCategory>[1] }) =>
      updateBlogCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories })
      toast.success("دسته‌بندی به‌روزرسانی شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlogCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories })
      toast.success("دسته‌بندی حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateBlogTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createBlogTag>[0]) => createBlogTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.tags })
      toast.success("برچسب ایجاد شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBlogTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlogTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.tags })
      toast.success("برچسب حذف شد")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

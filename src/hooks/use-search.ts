import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  searchProducts,
  fetchSearchSuggestions,
  fetchFilterFacets,
  fetchFilterableAttributes,
  fetchCategoriesForFilter,
  fetchBrandsForFilter,
  type SearchFilters,
} from "@/lib/api/search"

export function useSearchProducts(filters: SearchFilters) {
  return useQuery({
    queryKey: ["search-products", filters],
    queryFn: () => searchProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => fetchSearchSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  })
}

export function useFilterFacets() {
  return useQuery({
    queryKey: ["filter-facets"],
    queryFn: fetchFilterFacets,
    staleTime: 5 * 60_000,
  })
}

export function useFilterableAttributes() {
  return useQuery({
    queryKey: ["filterable-attributes"],
    queryFn: fetchFilterableAttributes,
    staleTime: 5 * 60_000,
  })
}

export function useCategoriesForFilter() {
  return useQuery({
    queryKey: ["categories-for-filter"],
    queryFn: fetchCategoriesForFilter,
    staleTime: 5 * 60_000,
  })
}

export function useBrandsForFilter() {
  return useQuery({
    queryKey: ["brands-for-filter"],
    queryFn: fetchBrandsForFilter,
    staleTime: 5 * 60_000,
  })
}
